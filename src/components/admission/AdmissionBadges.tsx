import Badge, { type BadgeTone } from '../ui/Badge'
import { SOURCE_LABEL, type DataSource, type ProgramStatus } from '../../domain/admission'

const STATUS_TONE: Record<ProgramStatus, BadgeTone> = {
  Open: 'success',
  'Closing Soon': 'warning',
  Closed: 'danger',
}

/** Open / Closing Soon / Closed, derived from the deadline. */
export function ProgramStatusBadge({ status }: { status: ProgramStatus }) {
  return <Badge label={status} tone={STATUS_TONE[status]} />
}

/** Whether the data was entered by the university or collected from a public announcement. */
export function SourceBadge({ source }: { source: DataSource }) {
  return source === 'university' ? (
    <Badge label={SOURCE_LABEL.university} tone="primary" icon="check-circle" />
  ) : (
    <Badge label={SOURCE_LABEL.scraper} tone="violet" icon="globe" />
  )
}
