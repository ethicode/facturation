import {
  Chip,
  Stack,
  Typography,
} from '@mui/material'
import Timeline from '@mui/lab/Timeline'
import TimelineConnector from '@mui/lab/TimelineConnector'
import TimelineContent from '@mui/lab/TimelineContent'
import TimelineDot from '@mui/lab/TimelineDot'
import TimelineItem from '@mui/lab/TimelineItem'
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent'
import TimelineSeparator from '@mui/lab/TimelineSeparator'
import { formatDateTime } from '../utils/facturationWorkflow.js'
import { parseAttachmentReference } from '../services/uploadService.js'

function HistoryTimeline({
  entries = [],
  dotColor = 'primary',
  roleLabels = {},
  showRoleChip = false,
}) {
  const safeDotColor = dotColor === 'default' ? 'primary' : dotColor

  return (
    <Timeline sx={{ m: 0, p: 0 }}>
      {entries.map((entry, index) => (
        <TimelineItem key={entry.id || `${entry.at}-${entry.action}-${index}`}>
          <TimelineOppositeContent color="text.secondary" sx={{ flex: 0.32 }}>
            {formatDateTime(entry.at)}
          </TimelineOppositeContent>
          <TimelineSeparator>
            <TimelineDot color={safeDotColor} variant="outlined" />
            {index < entries.length - 1 && <TimelineConnector />}
          </TimelineSeparator>
          <TimelineContent>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {entry.action}
              </Typography>
              {showRoleChip && entry.role && (
                <Chip size="small" label={roleLabels[entry.role] || entry.role} variant="outlined" />
              )}
            </Stack>
            {(entry.email || entry.actor) && (
              <Typography variant="caption" color="text.secondary">
                {entry.email || entry.actor}
              </Typography>
            )}
            {entry.detail && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                {entry.detail}
              </Typography>
            )}
            {entry.commentaire && !entry.detail && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                {entry.commentaire}
              </Typography>
            )}
            {Array.isArray(entry.piecesJointes) && entry.piecesJointes.length > 0 && (
              <Stack spacing={0.25} sx={{ mt: 0.25 }}>
                <Typography variant="body2" color="text.secondary">
                  Pièces jointes:
                </Typography>
                {entry.piecesJointes.map((attachmentRef) => {
                  const attachment = parseAttachmentReference(attachmentRef)
                  return attachment.href ? (
                    <Typography key={`${attachmentRef}-${attachment.href}`} variant="body2" color="text.secondary">
                      <a href={attachment.href} target="_blank" rel="noreferrer">{attachment.label || attachment.href}</a>
                    </Typography>
                  ) : (
                    <Typography key={attachmentRef} variant="body2" color="text.secondary">
                      {attachment.label || attachmentRef}
                    </Typography>
                  )
                })}
              </Stack>
            )}
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  )
}

export default HistoryTimeline
