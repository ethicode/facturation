import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined'
import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import HistoryTimeline from '../components/HistoryTimeline.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { formatDateTime } from '../utils/facturationWorkflow.js'
import { loadWorkflowTasks } from '../services/workflowTaskService.js'

function TraceabilityPage() {
  const [workflowTasks, setWorkflowTasks] = useState([])
  const [selectedTask, setSelectedTask] = useState(null)
  const [apiError, setApiError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function fetchDashboard() {
      try {
        const tasks = await loadWorkflowTasks()
        if (isMounted) {
          setWorkflowTasks(tasks)
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
        subtitle="Clique sur une tâche workflow pour voir qui a résolu et quelles pièces ont été ajoutées."
      />

      {apiError && <Alert severity="error">{apiError}</Alert>}

      <Card>
        <CardContent>
          <List sx={{ p: 0 }}>
            {workflowTasks.map((task, index) => (
              <Stack key={task.id}>
                <ListItem
                  sx={{ px: 0, cursor: 'pointer' }}
                  onClick={() => setSelectedTask(task)}
                  secondaryAction={(
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        size="small"
                        variant="outlined"
                        label={task.assigned_users.length > 0 ? `${task.assigned_users.length} assigné(s)` : 'Non assignée'}
                      />
                      <Button
                        size="small"
                        variant="contained"
                        onClick={(event) => {
                          event.stopPropagation()
                          setSelectedTask(task)
                        }}
                      >
                        Voir détail
                      </Button>
                    </Stack>
                  )}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <HistoryOutlinedIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={`${task.reference} • ${task.step}`}
                    secondary={`${task.workflow_type} • Résolu par ${task.resolved_by || '-'} • ${task.pieces_jointes.length} pièce(s)`}
                  />
                </ListItem>
                {index < workflowTasks.length - 1 && <Divider />}
              </Stack>
            ))}
            {workflowTasks.length === 0 && (
              <ListItem sx={{ px: 0 }}>
                <ListItemText primary="Aucune tâche workflow disponible." />
              </ListItem>
            )}
          </List>
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedTask)} onClose={() => setSelectedTask(null)} fullWidth maxWidth="md">
        <DialogTitle>Détail tâche workflow</DialogTitle>
        <DialogContent>
          {selectedTask && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Stack spacing={0.5}>
                <Typography variant="body2"><strong>Référence:</strong> {selectedTask.reference}</Typography>
                <Typography variant="body2"><strong>Workflow:</strong> {selectedTask.workflow_type}</Typography>
                <Typography variant="body2"><strong>Étape:</strong> {selectedTask.step}</Typography>
                <Typography variant="body2"><strong>Résolu par:</strong> {selectedTask.resolved_by || '-'}</Typography>
                <Typography variant="body2"><strong>Date:</strong> {selectedTask.resolved_at ? formatDateTime(selectedTask.resolved_at) : '-'}</Typography>
                <Typography variant="body2"><strong>Assigné à:</strong> {selectedTask.assigned_users.length > 0 ? selectedTask.assigned_users.join(', ') : '-'}</Typography>
                <Typography variant="body2"><strong>Pièces jointes:</strong> {selectedTask.pieces_jointes.length > 0 ? selectedTask.pieces_jointes.join(', ') : '-'}</Typography>
              </Stack>

              <Divider />

              <Stack spacing={1}>
                <Typography variant="subtitle2">Historique de la tâche</Typography>
                <HistoryTimeline entries={selectedTask.history} />
              </Stack>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedTask(null)}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

export default TraceabilityPage
