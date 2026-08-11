import { Stack, Typography } from '@mui/material'

function PageHeader({ title, subtitle }) {
  return (
    <Stack spacing={0.5} sx={{ mb: 2.5 }}>
      <Typography variant="h4">{title}</Typography>
      {subtitle ? (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      ) : null}
    </Stack>
  )
}

export default PageHeader
