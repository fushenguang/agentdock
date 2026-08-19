import * as p from '@clack/prompts'
import {
  buildDeviceAuthUrl,
  clearCredentials,
  newDeviceCode,
  openBrowser,
  pollForSession,
  readCredentials,
  resolveProvider,
  writeCredentials,
} from '../../core/auth.js'

export interface AuthCommandOptions {
  provider?: string
}

export async function runAuthLoginHumanAdapter(opts: AuthCommandOptions = {}): Promise<void> {
  p.intro('agentdock auth login')

  const provider = resolveProvider(opts.provider ? { providerName: opts.provider } : {})

  if (!provider.anonKey) {
    p.log.error(`Provider "${provider.name}" has no anon key configured.`)
    p.log.info('Set AGENTDOCK_AUTH_ANON_KEY, or add auth.providers in ~/.agentdock/config.json')
    p.cancel('Cannot start login')
    process.exit(1)
  }

  const deviceCode = newDeviceCode()
  const url = buildDeviceAuthUrl(provider, deviceCode)

  // Print the URL unconditionally: browser launch fails silently on headless
  // machines and inside containers, and "nothing happened" is a terrible way to
  // learn that.
  p.log.info(`Opening your browser to authorize:\n${url}`)
  openBrowser(url)

  const spinner = p.spinner()
  spinner.start('Waiting for authorization in the browser...')

  const outcome = await pollForSession({ provider, deviceCode })

  if (!outcome.ok) {
    spinner.stop('Authorization failed.')
    p.log.error(outcome.message)
    p.cancel(`✗ ${outcome.error}`)
    process.exit(1)
  }

  writeCredentials(outcome.credentials)
  spinner.stop('Authorized.')
  p.log.success(`Signed in as ${outcome.credentials.displayName ?? outcome.credentials.userId}`)
  p.outro(`✓ Credentials saved (provider: ${provider.name})`)
}

export async function runAuthLogoutHumanAdapter(_opts: AuthCommandOptions = {}): Promise<void> {
  p.intro('agentdock auth logout')
  const had = clearCredentials()
  p.outro(had ? '✓ Signed out' : 'Already signed out')
}

export async function runAuthStatusHumanAdapter(opts: AuthCommandOptions = {}): Promise<void> {
  p.intro('agentdock auth status')
  const provider = resolveProvider(opts.provider ? { providerName: opts.provider } : {})
  const status = readCredentials()

  if (!status.loggedIn) {
    p.log.warn(
      status.reason === 'CORRUPT_CREDENTIALS'
        ? 'Stored credentials are unreadable — run `agentdock auth login` again.'
        : 'Not signed in.',
    )
    // Non-zero so scripts can branch on it (tasks.md 2.3).
    p.outro('✗ Not signed in')
    process.exit(1)
  }

  // Never print tokens — identity only (design.md §7).
  p.log.info(`Provider:  ${status.credentials.provider} (${provider.webUrl})`)
  p.log.info(`User:      ${status.credentials.displayName ?? '(no display name)'}`)
  p.log.info(`User ID:   ${status.credentials.userId}`)
  p.log.info(`Signed in: ${status.credentials.savedAt}`)
  p.outro('✓ Signed in')
}
