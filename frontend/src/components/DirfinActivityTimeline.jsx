import { Alert, Box, Chip, Divider, Stack, Typography } from '@mui/material'

function formatActivityDate(value) {
  return new Date(value).toLocaleString('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function DirfinActivityTimeline({ entries = [] }) {
  if (!entries.length) {
    return (
      <Alert severity="info">
        Aucune modification DirFin n’a encore été enregistrée.
      </Alert>
    )
  }

  return (
    <Stack spacing={1.5}>
      {entries.map((entry) => (
        <Box key={entry.id} sx={{ borderLeft: '3px solid', borderColor: 'primary.main', pl: 2, py: 0.5 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between">
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Typography variant="subtitle2">{entry.actor}</Typography>
              <Chip size="small" label={entry.action} color="primary" variant="outlined" />
            </Stack>
            <Typography variant="caption" color="text.secondary">
              {formatActivityDate(entry.at)}
            </Typography>
          </Stack>
          {entry.detail && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {entry.detail}
            </Typography>
          )}
          <Divider sx={{ mt: 1 }} />
        </Box>
      ))}
    </Stack>
  )
}

export default DirfinActivityTimeline
