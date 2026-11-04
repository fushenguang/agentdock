#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const READY_TIMEOUT_MS = 10_000
const HEALTH_TIMEOUT_MS = 5_000

function requiredArtifacts(packageRoot) {
  return [
    join(packageRoot, 'web', 'server.mjs'),
    join(packageRoot, 'web', 'runtime', 'server', 'hosted-runtime.mjs'),
    join(packageRoot, 'web', 'runtime', 'server', 'vault-supply.mjs'),
    join(packageRoot, 'web', 'server', 'assets', 'capability-service.mjs'),
  ]
}

async function waitForReady(child, readOutput) {
  return await new Promise((resolveReady, rejectReady) => {
    const timeout = setTimeout(() => {
      rejectReady(new Error(`packaged runtime did not become ready\n${readOutput()}`))
    }, READY_TIMEOUT_MS)
    const finish = (callback, value) => {
      clearTimeout(timeout)
      callback(value)
    }
    const onData = (chunk) => {
      for (const line of chunk.toString().split('\n')) {
        if (!line.trim()) continue
        try {
          const event = JSON.parse(line)
          if (event.status === 'ready' && Number.isInteger(event.port)) {
            child.stdout.off('data', onData)
            finish(resolveReady, event.port)
            return
          }
        } catch {
          // Startup diagnostics may contain non-JSON lines.
        }
      }
    }
    child.stdout.on('data', onData)
    child.once('error', (error) => finish(rejectReady, error))
    child.once('exit', (code, signal) => {
      finish(
        rejectReady,
        new Error(`packaged runtime exited before ready (${code ?? signal})\n${readOutput()}`),
      )
    })
  })
}

async function stopRuntime(child) {
  if (child.exitCode !== null || child.signalCode !== null) return
  child.kill('SIGTERM')
  await new Promise((resolveExit) => {
    const timeout = setTimeout(() => {
      child.kill('SIGKILL')
      resolveExit()
    }, HEALTH_TIMEOUT_MS)
    child.once('exit', () => {
      clearTimeout(timeout)
      resolveExit()
    })
  })
}

export async function smokePackagedRuntime({ packageRoot, dataRoot } = {}) {
  if (!packageRoot) throw new Error('packageRoot is required')
  const resolvedPackageRoot = resolve(packageRoot)
  const resolvedDataRoot = resolve(dataRoot ?? join(resolvedPackageRoot, '.runtime-smoke'))
  const missing = requiredArtifacts(resolvedPackageRoot).filter((path) => !existsSync(path))
  if (missing.length > 0) {
    throw new Error(`packaged runtime is incomplete:\n  ${missing.join('\n  ')}`)
  }
  mkdirSync(resolvedDataRoot, { recursive: true })

  const outputRoot = join(resolvedPackageRoot, 'web')
  const child = spawn(process.execPath, [join(outputRoot, 'server.mjs')], {
    cwd: outputRoot,
    env: {
      ...process.env,
      PORT: '0',
      HOST: '127.0.0.1',
      PACKAGE_ROOT: resolvedPackageRoot,
      DATA_ROOT: resolvedDataRoot,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let output = ''
  const append = (chunk) => {
    output += chunk.toString()
  }
  child.stdout.on('data', append)
  child.stderr.on('data', append)

  try {
    const port = await waitForReady(child, () => output)
    const response = await fetch(`http://127.0.0.1:${port}/_thefoolai/v1/health`, {
      signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
    })
    const health = await response.json().catch(() => null)
    if (response.status !== 200 || health?.status !== 'ready') {
      throw new Error(
        `packaged runtime health check failed: HTTP ${response.status} ${JSON.stringify(health)}\n${output}`,
      )
    }
    return {
      ok: true,
      port,
      packageRoot: resolvedPackageRoot,
      health,
    }
  } catch (error) {
    throw new Error(
      `${error instanceof Error ? error.message : String(error)}\n--- runtime output ---\n${output}`,
    )
  } finally {
    await stopRuntime(child)
  }
}

async function main() {
  const repositoryRoot = process.cwd()
  const packageId = process.argv[2]
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(packageId ?? '')) {
    console.error('Usage: node tools/smoke-package.mjs <package-id>')
    process.exitCode = 1
    return
  }
  const result = await smokePackagedRuntime({
    packageRoot: join(repositoryRoot, 'apps', packageId),
    dataRoot: join(repositoryRoot, '.runtime-smoke', packageId),
  })
  console.log(JSON.stringify(result))
}

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  try {
    await main()
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
