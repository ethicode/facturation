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
  showComment = true,
  onEntryClick,
  selectedEntryId,
}) {
  const safeDotColor = dotColor === 'default' ? 'primary' : dotColor

  return (
    <Timeline sx={{ m: 0, p: 0 }}>
      {entries.map((entry, index) => (
        <TimelineItem
          key={entry.id || `${entry.at}-${entry.action}-${index}`}
          role={onEntryClick ? 'button' : undefined}
          tabIndex={onEntryClick ? 0 : undefined}
          aria-pressed={onEntryClick ? entry.id === selectedEntryId : undefined}
          aria-label={onEntryClick ? `${entry.action}, ${formatDateTime(entry.at)}, ${entry.email || entry.actor || ''}` : undefined}
          onClick={onEntryClick ? () => onEntryClick(entry) : undefined}
          onKeyDown={onEntryClick ? (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              onEntryClick(entry)
            }
          } : undefined}
          sx={onEntryClick ? {
            cursor: 'pointer',
            borderRadius: 1,
            bgcolor: entry.id === selectedEntryId ? 'action.selected' : 'transparent',
            '&:hover': { bgcolor: entry.id === selectedEntryId ? 'action.selected' : 'action.hover' },
            '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
          } : undefined}
        >
          <TimelineOppositeContent color="text.secondary" sx={{ flex: 0.32 }}>
            {formatDateTime(entry.at)}
          </TimelineOppositeContent>
          <TimelineSeparator>
            <TimelineDot color={safeDotColor} variant="outlined" />
            {index < entries.length - 1 && <TimelineConnector />}
          </TimelineSeparator>
          <TimelineContent>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant="body2" sx={{ fontWeight: 600 }} color={onEntryClick ? 'primary.main' : undefined}>
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
            {showComment && entry.commentaire && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                {entry.commentaire}
              </Typography>
            )}
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  )
}

export default HistoryTimeline
