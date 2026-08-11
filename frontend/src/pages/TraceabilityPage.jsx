import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined'
import {
  Alert,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
} from '@mui/material'
import { useEffect, useState } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import { loadDashboard } from '../services/dashboardService.js'

function TraceabilityPage() {
  const [traceEvents, setTraceEvents] = useState([])
  const [apiError, setApiError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function fetchDashboard() {
      try {
        const data = await loadDashboard()
        if (isMounted) {
          setTraceEvents(Array.isArray(data?.trace_events) ? data.trace_events : [])
          setApiError('')
        }
      } catch (error) {
        if (isMounted) {
          setApiError(error.message || 'Impossible de charger la traçabilité.')
        }
      }
    }

    fetchDashboard()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title="Tracabilite"
        subtitle="Garantir l historique des actions pour audit et conformite."
      />

      {apiError && <Alert severity="error">{apiError}</Alert>}

      <Card>
        <CardContent>
          <List sx={{ p: 0 }}>
            {traceEvents.map((event, index) => (
              <Stack key={`${event.date}-${event.action}`}>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <HistoryOutlinedIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary={event.action} secondary={`${event.date} • ${event.actor}`} />
                </ListItem>
                {index < traceEvents.length - 1 && <Divider />}
              </Stack>
            ))}
          </List>
        </CardContent>
      </Card>
    </Stack>
  )
}

export default TraceabilityPage
