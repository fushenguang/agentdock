import { SecondaryScreen } from '../../src/components/shell/SecondaryScreen'

export default function StorageScreen() {
  return (
    <SecondaryScreen
      title="Storage"
      body="Sessions, memory projections, audit events, and pending outbox records live in local SQLite."
    />
  )
}
