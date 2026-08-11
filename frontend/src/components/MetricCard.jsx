import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined'
import { Card, CardContent, Chip, Stack, Typography } from '@mui/material'

function formatMetricValue(label, value) {
  const raw = String(value ?? '').trim()
  if (!raw) return ''

  const lowerLabel = label.toLowerCase()
  const isFinancial = ['budget', 'frais', 'montant', 'dépense', 'dépenses', 'reste', 'consomm'].some((keyword) => lowerLabel.includes(keyword))

  if (!isFinancial) {
    return raw
  }

  const cleaned = raw.replace(/\s+/g, '').replace(/,/g, '.')
  const amount = Number.parseFloat(cleaned)

  if (Number.isNaN(amount)) {
    return raw
  }

  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XAF',
    maximumFractionDigits: 0,
  }).format(amount)
}

function MetricCard({ label, value, trend, tone = 'default' }) {
  return (
    <Card sx={{ height: '100%', minHeight: 124, border: '1px solid', borderColor: 'divider', boxShadow: '0 10px 25px rgba(15, 23, 42, 0.06)' }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Stack spacing={0.75}>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="h5">{formatMetricValue(label, value)}</Typography>
          </Stack>
          <Chip
            icon={<TrendingUpOutlinedIcon />}
            label={trend}
            color={tone === 'default' ? 'primary' : tone}
            variant={tone === 'default' ? 'outlined' : 'filled'}
            size="small"
          />
        </Stack>
      </CardContent>
    </Card>
  )
}

export default MetricCard
