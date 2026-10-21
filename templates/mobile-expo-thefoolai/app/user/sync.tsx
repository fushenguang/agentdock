import { SecondaryScreen } from '../../src/components/shell/SecondaryScreen'

export default function SyncScreen() {
  return (
    <SecondaryScreen
      title="Sync"
      body="Remote mutations are queued as idempotent outbox operations; local use does not require sync."
    />
  )
}
