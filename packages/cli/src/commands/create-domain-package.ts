import { defineCommand } from 'citty'
import { provisionDomainPackage } from '../core/provisionDomainPackage.js'

export const createDomainPackageCommand = defineCommand({
  meta: {
    name: 'create-domain-package',
    description: 'Create and verify a standalone domain package, optionally delivering it to Gitee',
  },
  args: {
    spec: { type: 'string', description: 'Path or HTTPS URL to package-spec.json' },
    dir: { type: 'string', description: 'Target directory (default: dp-<id>)' },
    provider: { type: 'string', description: 'Git service (gitee)' },
    namespace: { type: 'string', description: 'Gitee enterprise namespace, enterprise:<path>' },
    visibility: { type: 'string', description: 'private (default) or internal' },
    'dry-run': {
      type: 'boolean',
      description: 'Show the plan without creating files or repositories',
    },
    json: { type: 'boolean', description: 'Print one machine-readable result' },
  },
  async run({ args }) {
    const result = await provisionDomainPackage(args)
    if (args.json) process.stdout.write(JSON.stringify(result) + '\n')
    else if (result.ok) {
      console.log(`${result.status}: ${result.localPath}\nChecks: ${result.checks.join(', ')}`)
      if ('destination' in result && result.destination)
        console.log(`Destination: ${result.destination}`)
      if ('repo' in result && result.repo) console.log(result.repo.cloneUrl)
    } else
      console.error(
        `${result.phase}: ${result.message}${result.localPath ? ` (${result.localPath})` : ''}`,
      )
    if (!result.ok) process.exitCode = 1
  },
})
