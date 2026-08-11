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

function HistoryTimeline({
  entries = [],
  dotColor = 'primary',
  roleLabels = {},
  showRoleChip = false,
}) {
  return (
    <Timeline sx={{ m: 0, p: 0 }}>
      {entries.map((entry, index) => (
        <TimelineItem key={entry.id || `${entry.at}-${entry.action}-${index}`}>
          <TimelineOppositeContent color="text.secondary" sx={{ flex: 0.32 }}>
            {formatDateTime(entry.at)}
          </TimelineOppositeContent>
          <TimelineSeparator>
            <TimelineDot color={dotColor} variant="outlined" />
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
            {entry.actor && (
              <Typography variant="caption" color="text.secondary">
                {entry.actor}
              </Typography>
            )}
            {entry.detail && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                {entry.detail}
              </Typography>
            )}
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  )
}

export default HistoryTimeline
