import {
  Alert,
  Autocomplete,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControlLabel,
  Grid,
  MenuItem,
  MenuList,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Step,
  StepButton,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useRoleContext } from '../app/roleContext.js'
import HistoryTimeline from '../components/HistoryTimeline.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { getStoredAuth } from '../services/authService.js'
import { loadFacture, updateFactureStatus } from '../services/facturationStorage.js'
import { parseAttachmentReference, uploadAttachments } from '../services/uploadService.js'
import {
  deleteWorkflowAssignment,
  loadAdminUsers,
  loadWorkflowAssignments,
  saveWorkflowAssignment,
  updateWorkflowAssignment,
} from '../services/adminService.js'
import {
  facturationStatuses,
  formatAmount,
  formatDate,
  formatDateTime,
  getAllowedTransitionsForRole,
  getFacturationStepLabel,
  getVisibleFacturationStatuses,
  normalizeFacturationStatus,
  statusColor,
} from '../utils/facturationWorkflow.js'
import { isAdminRole } from '../utils/roles.js'

const roleActorMap = {
  administrateur: 'Administrateur ORFL',
  utilisateur: 'Utilisateur ORFL',
  manageur: 'Manageur ORFL',
}

const linearStatuses = facturationStatuses

function getWorkflowStep(status) {
  if (!status) {
    return 0
  }

  const normalizedStatus = normalizeFacturationStatus(status)

  if (normalizedStatus === 'Initialisation') {
    return 0
  }

  if (normalizedStatus === 'Rejetée') {
    return linearStatuses.indexOf('Rejetée')
  }

  if (normalizedStatus === 'Terminé') {
    return linearStatuses.length - 1
  }

  const idx = linearStatuses.indexOf(normalizedStatus)
  return idx === -1 ? 0 : idx
}

function getWorkflowStepIndex(status) {
  return linearStatuses.indexOf(status)
}

function normalizeText(value) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function slugifyFacturationStep(value) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function getFacturationStepSlug(status) {
  const normalizedStatus = normalizeFacturationStatus(status)
  const stepLabel = getFacturationStepLabel(normalizedStatus)
  return slugifyFacturationStep(stepLabel)
}

function getStatusFromSlug(slug) {
  if (!slug) {
    return ''
  }

  const normalized = slugifyFacturationStep(slug)
  return facturationStatuses.find((status) => getFacturationStepSlug(status) === normalized) || ''
}

const stepKeywordMap = {
  'Saisie de la demande': ['saisie de la demande', 'demande soumise'],
  'Vérification métier': ['verification metier', 'vérification métier'],
  'Validation métier N+1': ['validation metier n+1', 'validation n+1', 'valider n+1'],
  "Demande d'information complémentaire (Validation métier N+1)": ['demande d information complementaire', 'informations complementaires', 'validation metier n+1'],
  "Demande d'information complémentaire (Traitement service approvisionnement)": ['demande d information complementaire', 'informations complementaires', 'traitement service approvisionnement'],
  "Demande d'information complémentaire (Signature LAD 1)": ['demande d information complementaire', 'informations complementaires', 'signature lad 1'],
  'Traitement service approvisionnement': ['traitement service approvisionnement', 'traitement valide'],
  'Signature LAD 1': ['signature lad 1'],
  'Signature LAD 2': ['signature lad 2'],
  'Signature LAD 3': ['signature lad 3'],
  'Règlement en cours': ['reglement en cours', 'passer au reglement'],
  'Paiement effectué': ['paiement effectue', 'confirmer le paiement'],
  Rejetée: ['rejete', 'rejetee'],
  Clôturée: ['cloturee', 'cloturer'],
}

function matchesSelectedStep(entry, step) {
  if (!step) {
    return true
  }

  const haystack = normalizeText(
    [entry?.action, entry?.detail, entry?.commentaire]
    .filter(Boolean)
    .join(' ')
  )

  const normalizedStep = normalizeText(step)
  const keywords = stepKeywordMap[step] || [step]

  return [normalizedStep, ...keywords.map((keyword) => normalizeText(keyword))].some((needle) => haystack.includes(needle))
}

function getSelectedStepActionLabel(step, fallbackAction) {
  return step || fallbackAction || '-'
}

function isCommentOnlyHistoryEntry(entry) {
  return (entry?.action || '').startsWith('Commentaire ajouté depuis ')
}

function getTaskLabelFromHistoryAction(action) {
  const actionText = (action || '').trim()

  if (!actionText) {
    return '-'
  }

  if (actionText.startsWith('Passer à ')) {
    return actionText.slice('Passer à '.length).trim() || '-'
  }

  if (actionText.startsWith('Statut passe a ')) {
    return actionText.slice('Statut passe a '.length).trim() || '-'
  }

  if (actionText === 'Paiement effectué - clôture automatique') {
    return 'Clôturée'
  }

  if (actionText === 'Demande soumise et étape de saisie validée automatiquement') {
    return 'Saisie de la demande'
  }

  return actionText
}

function renderCommentWithMentions(comment) {
  const parts = (comment || '').split(/(@[a-zA-Z0-9._-]+)/g)

  return parts.map((part, index) => {
    if (/^@[a-zA-Z0-9._-]+$/.test(part)) {
      return (
        <Typography
          key={`${part}-${index}`}
          component="span"
          sx={{
            color: 'primary.main',
            fontWeight: 700,
            px: 0.5,
            borderRadius: 0.75,
            bgcolor: 'action.hover',
          }}
        >
          {part}
        </Typography>
      )
    }

    return <span key={`${part}-${index}`}>{part}</span>
  })
}

function FacturationWorkflowStepper({ currentStatus, selectedStep, onStepClick, history = [] }) {
  const visibleStatuses = getVisibleFacturationStatuses(currentStatus, history)
  const normalizedCurrentStatus = normalizeFacturationStatus(currentStatus)
  const activeStep = visibleStatuses.indexOf(normalizedCurrentStatus)

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
        <Chip label={getFacturationStepLabel(currentStatus)} color={statusColor[normalizedCurrentStatus] || 'default'} />
      </Stack>
      <Stepper activeStep={activeStep} alternativeLabel>
        {visibleStatuses.map((status, index) => (
          <Step key={status} completed={index < activeStep}>
            <StepButton
              color="inherit"
              onClick={() => onStepClick(status)}
              sx={{
                '& .MuiStepLabel-label': {
                  fontWeight: selectedStep === status ? 700 : 500,
                },
              }}
            >
              <StepLabel>{getFacturationStepLabel(status)}</StepLabel>
            </StepButton>
          </Step>
        ))}
      </Stepper>
    </Stack>
  )
}

function FacturationDetailPage() {
  const { factureId, taskSlug } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { activeRole } = useRoleContext()
  const [facture, setFacture] = useState(() => location.state?.facture || null)
  const [apiError, setApiError] = useState('')
  const [isLoading, setIsLoading] = useState(() => !location.state?.facture)
  const [transitionForm, setTransitionForm] = useState({ commentaire: '', piecesJointes: [] })
  const [isTransitionSubmitting, setIsTransitionSubmitting] = useState(false)
  const [selectedTransition, setSelectedTransition] = useState(null)
  const [selectedTimelineStep, setSelectedTimelineStep] = useState('')
  const [commentInput, setCommentInput] = useState('')
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false)
  const [adminUsers, setAdminUsers] = useState([])
  const [mentionUsers, setMentionUsers] = useState([])
  const [workflowAssignments, setWorkflowAssignments] = useState([])
  const [showAssigneePicker, setShowAssigneePicker] = useState(false)
  const [currentAuthUserId, setCurrentAuthUserId] = useState('')

  useEffect(() => {
    const auth = getStoredAuth()
    setCurrentAuthUserId(auth?.user?.id || '')
  }, [])

  useEffect(() => {
    let isMounted = true

    async function fetchFactures() {
      try {
        const data = await loadFacture(factureId)
        if (isMounted) {
          setFacture(data)
          setApiError('')
        }
      } catch (error) {
        if (isMounted) {
          setApiError(error.message || 'Impossible de charger la demande de facturation.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchFactures()

    return () => {
      isMounted = false
    }
  }, [factureId])

  const resetTransitionForm = () => {
    setTransitionForm({ commentaire: '', piecesJointes: [] })
  }

  const handleTransition = async (nextStatus, metadata = {}) => {
    try {
      setIsTransitionSubmitting(true)
      const uploadedAttachments = await uploadAttachments(metadata.piecesJointes || [])

      const currentStepAssignment = workflowAssignments.find(
        (assignment) => assignment.workflowType === 'facturation' && assignment.step === facture.statut
      )
      const isCurrentStepUnassigned = !currentStepAssignment || !Array.isArray(currentStepAssignment.userIds) || currentStepAssignment.userIds.length === 0

      if (isAdminRole(activeRole) && currentAuthUserId && isCurrentStepUnassigned) {
        const savedAssignment = currentStepAssignment
          ? await updateWorkflowAssignment(facture.statut, [currentAuthUserId], 'facturation')
          : await saveWorkflowAssignment(facture.statut, [currentAuthUserId], 'facturation')

        setWorkflowAssignments((prev) => {
          const nextAssignments = prev.filter(
            (assignment) => !(assignment.workflowType === 'facturation' && assignment.step === facture.statut)
          )
          return [...nextAssignments, savedAssignment]
        })
      }

      const currentUser = getStoredAuth()?.user || {}
      const updatedFacture = await updateFactureStatus(facture.id, nextStatus, {
        actor: roleActorMap[activeRole] || 'Systeme Workflow',
        email: currentUser.email || '',
        role: activeRole,
        actionLabel: metadata.actionLabel || `Passer à ${getFacturationStepLabel(nextStatus)}`,
        commentaire: metadata.commentaire || '',
        piecesJointes: uploadedAttachments,
      })

      setFacture(updatedFacture)
      setApiError('')
      resetTransitionForm()
    } catch (error) {
      setApiError(error.message || 'Impossible de mettre à jour le statut de la demande de facturation.')
    } finally {
      setIsTransitionSubmitting(false)
    }
  }

  const handleTransitionFileUpload = (event) => {
    const files = Array.from(event.target.files || [])
    setTransitionForm((prev) => ({
      ...prev,
      piecesJointes: files,
    }))
  }

  const currentStepIndex = getWorkflowStepIndex(facture?.statut)
  const canAddTransitionContext = currentStepIndex > 0 && currentStepIndex < linearStatuses.length - 1
  const allowedTransitions = getAllowedTransitionsForRole(facture?.statut, activeRole)
  const taskHistory = (facture?.history || [])
    .filter((entry) => !isCommentOnlyHistoryEntry(entry))
    .map((entry) => ({
      ...entry,
      action: getFacturationStepLabel(getTaskLabelFromHistoryAction(entry?.action)),
    }))
  const selectedStepHistory = (facture?.history || []).filter((entry) => matchesSelectedStep(entry, selectedTimelineStep))
  const selectedStepResolution = selectedStepHistory[0] || null
  const isSelectedStepValidated = Boolean(selectedStepResolution?.actor)
  const selectedStepAssignment = workflowAssignments.find(
    (assignment) => assignment.workflowType === 'facturation' && assignment.step === selectedTimelineStep
  )
  const selectedAssigneeId = selectedStepAssignment?.userIds?.[0] || ''
  const selectedAssignee = adminUsers.find((user) => user.id === selectedAssigneeId) || null
  const canEditSelectedStepAssignee =
    isAdminRole(activeRole) &&
    Boolean(selectedTimelineStep) &&
    selectedTimelineStep === facture?.statut &&
    !isSelectedStepValidated

  const mentionMatch = commentInput.match(/(^|\s)@([a-zA-Z0-9._-]*)$/)
  const mentionQuery = mentionMatch ? mentionMatch[2].toLowerCase() : ''
  const mentionSuggestions = mentionMatch && mentionQuery.length >= 1
    ? mentionUsers
      .filter((user) => {
        const username = (user.username || '').toLowerCase()
        const fullName = (user.name || user.full_name || '').toLowerCase()
        const email = (user.email || '').toLowerCase()
        return username.startsWith(mentionQuery) || fullName.startsWith(mentionQuery) || email.startsWith(mentionQuery)
      })
      .slice(0, 6)
    : []

  useEffect(() => {
    if (!allowedTransitions.length) {
      setSelectedTransition(null)
      return
    }

    setSelectedTransition((currentValue) => {
      if (currentValue && allowedTransitions.some((transition) => transition.to === currentValue.to)) {
        return currentValue
      }
      return allowedTransitions[0]
    })
  }, [allowedTransitions])

  useEffect(() => {
    if (!facture?.statut) {
      setSelectedTimelineStep('')
      return
    }

    const routeStatus = taskSlug ? getStatusFromSlug(taskSlug) : ''
    const normalizedCurrentStatus = normalizeFacturationStatus(facture.statut)
    const normalizedStep = routeStatus || (linearStatuses.includes(normalizedCurrentStatus)
      ? normalizedCurrentStatus
      : linearStatuses[getWorkflowStep(facture.statut)])

    setSelectedTimelineStep(normalizedStep || '')
  }, [facture?.statut, taskSlug])

  const handleSelectedTimelineStepChange = (nextStep) => {
    setSelectedTimelineStep(nextStep)

    if (!facture?.id || !nextStep) {
      return
    }

    const nextSlug = getFacturationStepSlug(nextStep)
    const currentPath = location.pathname
    const basePath = `/facturation/${facture.id}`

    if (currentPath === `${basePath}/${nextSlug}`) {
      return
    }

    navigate(`${basePath}/${nextSlug}`, { replace: false })
  }

  useEffect(() => {
    if (!isAdminRole(activeRole)) {
      return
    }

    let isMounted = true

    async function fetchAssignmentData() {
      try {
        const [users, assignments] = await Promise.all([loadAdminUsers(), loadWorkflowAssignments()])
        if (!isMounted) {
          return
        }
        setAdminUsers(users.filter((user) => user.isActive))
        setWorkflowAssignments(assignments)
      } catch (error) {
        if (!isMounted) {
          return
        }
        setApiError(error.message || 'Impossible de charger les données d assignation workflow.')
      }
    }

    fetchAssignmentData()

    return () => {
      isMounted = false
    }
  }, [activeRole])

  useEffect(() => {
    let isMounted = true

    async function fetchMentionUsers() {
      try {
        const users = await loadAdminUsers()
        if (!isMounted) {
          return
        }
        setMentionUsers(users.filter((user) => user.isActive))
      } catch {
        if (isMounted) {
          setMentionUsers([])
        }
      }
    }

    fetchMentionUsers()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    setShowAssigneePicker(false)
  }, [selectedTimelineStep, selectedAssigneeId])

  const handleAssignUser = async (selectedUser) => {
    if (!canEditSelectedStepAssignee || !selectedTimelineStep || !selectedUser) {
      return
    }

    try {
      setApiError('')
      const currentAssignment = workflowAssignments.find(
        (assignment) => assignment.workflowType === 'facturation' && assignment.step === selectedTimelineStep
      )
      const savedAssignment = currentAssignment
        ? await updateWorkflowAssignment(selectedTimelineStep, [selectedUser.id], 'facturation')
        : await saveWorkflowAssignment(selectedTimelineStep, [selectedUser.id], 'facturation')

      setWorkflowAssignments((prev) => {
        const nextAssignments = prev.filter(
          (assignment) => !(assignment.workflowType === 'facturation' && assignment.step === selectedTimelineStep)
        )
        return [...nextAssignments, savedAssignment]
      })
      setShowAssigneePicker(false)
    } catch (error) {
      setApiError(error.message || 'Impossible d affecter cette tâche à un utilisateur.')
    }
  }

  const handleRemoveAssignment = async () => {
    if (!canEditSelectedStepAssignee || !selectedTimelineStep || !selectedAssigneeId) {
      return
    }

    try {
      setApiError('')
      await deleteWorkflowAssignment(selectedTimelineStep, 'facturation')
      setWorkflowAssignments((prev) =>
        prev.filter(
          (assignment) => !(assignment.workflowType === 'facturation' && assignment.step === selectedTimelineStep)
        )
      )
      setShowAssigneePicker(false)
    } catch (error) {
      setApiError(error.message || 'Impossible de supprimer l affectation pour cette étape.')
    }
  }

  const getCommentSourceStep = (entry) => {
    const actionText = entry?.action || ''
    const marker = 'Commentaire ajouté depuis '

    if (actionText.startsWith(marker)) {
      return actionText.slice(marker.length).trim() || '-'
    }

    return '-'
  }

  const handleAddComment = async () => {
    const commentValue = commentInput.trim()
    if (!facture?.id || !commentValue) {
      return
    }

    try {
      setIsCommentSubmitting(true)
      setApiError('')

      const currentUser = getStoredAuth()?.user || {}
      const sourceStep = getFacturationStepLabel(facture.statut)
      const updatedFacture = await updateFactureStatus(facture.id, facture.statut, {
        actor: roleActorMap[activeRole] || 'Systeme Workflow',
        email: currentUser.email || '',
        role: activeRole,
        actionLabel: `Commentaire ajouté depuis ${sourceStep}`,
        commentaire: commentValue,
        piecesJointes: [],
      })

      setFacture(updatedFacture)
      setCommentInput('')
    } catch (error) {
      setApiError(error.message || 'Impossible d ajouter le commentaire.')
    } finally {
      setIsCommentSubmitting(false)
    }
  }

  const insertMention = (user) => {
    if (!user) {
      return
    }

    const mentionValue = `@${user.email || user.username || user.id}`
    const updated = commentInput.replace(/(^|\s)@[a-zA-Z0-9._-]*$/, `$1${mentionValue} `)
    setCommentInput(updated)
  }

  if (isLoading) {
    return (
      <Stack spacing={2.5}>
        <PageHeader title="Suivi de la facturation" subtitle="Chargement du dossier en cours..." />
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              Chargement de la fiche détail...
            </Typography>
          </CardContent>
        </Card>
      </Stack>
    )
  }

  if (!facture) {
    return (
      <Stack spacing={2.5}>
        <PageHeader
          title="Dossier de facturation introuvable"
          subtitle="La demande de facturation demandée n'existe pas ou a été supprimée."
        />
        <Alert severity="warning">{apiError || 'Impossible de charger la fiche detail.'}</Alert>
      </Stack>
    )
  }

  return (
    <Stack spacing={2.5}>
      <PageHeader title={facture.id || ''} />

      {apiError && <Alert severity="error">{apiError}</Alert>}

      <Card>
        <CardContent>
          <Stack spacing={1.5}>
            <FacturationWorkflowStepper
              currentStatus={facture.statut}
              selectedStep={selectedTimelineStep}
              onStepClick={handleSelectedTimelineStepChange}
              history={facture.history || []}
            />
            <Card variant="outlined">
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="subtitle2">Détail étape sélectionnée</Typography>
                  {!isSelectedStepValidated && (
                    <Typography variant="body2" color="text.secondary">
                      Affecté à:{' '}
                      {selectedAssignee
                        ? selectedAssignee.email || selectedAssignee.name || selectedAssignee.username
                        : (
                          canEditSelectedStepAssignee
                            ? (
                              <Typography
                                component="span"
                                variant="body2"
                                onClick={() => setShowAssigneePicker(true)}
                                sx={{ color: 'primary.main', cursor: 'pointer', textDecoration: 'underline' }}
                              >
                                à sélectionner un utilisateur
                              </Typography>
                            )
                            : '-'
                        )}
                    </Typography>
                  )}
                  {canEditSelectedStepAssignee && showAssigneePicker && (
                    <Autocomplete
                      size="small"
                      options={adminUsers}
                      value={selectedAssignee}
                      getOptionLabel={(option) => option.name || option.email || option.username || option.id}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      onChange={(_, value) => handleAssignUser(value)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Rechercher un utilisateur"
                          placeholder="Nom ou email"
                          autoFocus
                        />
                      )}
                    />
                  )}
                  {isSelectedStepValidated && (
                    <Typography variant="body2" color="text.secondary">
                      Résolu par: {selectedStepHistory[0]?.email || selectedStepHistory[0]?.actor || '-'}
                    </Typography>
                  )}
                  <Typography variant="body2" color="text.secondary">
                    Date de validation: {selectedStepHistory[0]?.at ? formatDateTime(selectedStepHistory[0].at) : '-'}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Stack spacing={2.5}>
            <Card>
              <CardContent>
                <Stack
                  spacing={2}
                  sx={{
                    '& .MuiInputLabel-root': {
                      color: 'text.secondary',
                      fontWeight: 700,
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: 'text.primary',
                    },
                    '& .MuiOutlinedInput-root fieldset': {
                      borderColor: 'rgba(15, 23, 42, 0.28)',
                    },
                    '& .MuiOutlinedInput-root:hover fieldset': {
                      borderColor: 'rgba(15, 23, 42, 0.45)',
                    },
                    '& .MuiOutlinedInput-root.Mui-focused fieldset': {
                      borderColor: 'rgba(15, 23, 42, 0.6)',
                    },
                    '& .MuiOutlinedInput-root.Mui-error fieldset': {
                      borderColor: 'rgba(15, 23, 42, 0.28)',
                    },
                    '& .MuiOutlinedInput-root.Mui-disabled': {
                      backgroundColor: 'rgba(15, 23, 42, 0.04)',
                    },
                    '& .MuiOutlinedInput-root.Mui-disabled fieldset': {
                      borderColor: 'rgba(15, 23, 42, 0.18)',
                    },
                    '& .MuiInputBase-input.Mui-disabled': {
                      WebkitTextFillColor: '#334155',
                      color: '#334155',
                      fontWeight: 500,
                    },
                    '& .MuiInputBase-inputMultiline.Mui-disabled': {
                      WebkitTextFillColor: '#334155',
                      color: '#334155',
                      fontWeight: 500,
                    },
                    '& .MuiInputLabel-root.Mui-disabled': {
                      color: 'text.secondary',
                    },
                  }}
                >
                  <Typography variant="h6">Détails de la demande</Typography>
                  <Divider />

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                      <TextField fullWidth label="Référence" value={facture.id || '-'} disabled />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <TextField fullWidth label="Priorité" value={facture.priorite || '-'} disabled />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField fullWidth label="Direction" value={facture.direction || '-'} disabled />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth label="Résumé" value={facture.resume || '-'} disabled />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth multiline minRows={2} label="Description" value={facture.description || '-'} disabled />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth label="Fournisseur" value={facture.fournisseur || '-'} disabled />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth label="Référence de facturation" value={facture.numeroFacture || '-'} disabled />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField fullWidth label="Montant de la demande" value={formatAmount(facture.montant, facture.devise)} disabled />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField fullWidth label="Compte de charge" value={facture.compteCharge || '-'} disabled />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField fullWidth label="Date de réception" value={formatDate(facture.dateReception)} disabled />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth label="Mode de réception" value={facture.modeReception || '-'} disabled />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Stack spacing={0.5}>
                        <Typography variant="caption" color="text.secondary">Pièces jointes</Typography>
                        {Array.isArray(facture.piecesJointes) && facture.piecesJointes.length > 0 ? (
                          facture.piecesJointes.map((attachmentRef) => {
                            const attachment = parseAttachmentReference(attachmentRef)
                            return attachment.href ? (
                              <Typography key={`${attachmentRef}-${attachment.href}`} variant="body2">
                                <a href={attachment.href} target="_blank" rel="noreferrer">{attachment.label || attachment.href}</a>
                              </Typography>
                            ) : (
                              <Typography key={attachmentRef} variant="body2">{attachment.label || attachmentRef}</Typography>
                            )
                          })
                        ) : (
                          <Typography variant="body2" color="text.secondary">-</Typography>
                        )}
                      </Stack>
                    </Grid>
                  </Grid>
                </Stack>
              </CardContent>
            </Card>

            {canAddTransitionContext && (
              <Card>
                <CardContent>
                  <Stack spacing={2}>
                    <Typography variant="h6">Commentaire et pièces jointes</Typography>
                    <Divider />
                    <TextField
                      fullWidth
                      multiline
                      minRows={4}
                      label="Commentaire"
                      value={transitionForm.commentaire}
                      onChange={(event) => setTransitionForm((prev) => ({ ...prev, commentaire: event.target.value }))}
                    />
                    <Button variant="outlined" component="label" sx={{ alignSelf: 'flex-start' }}>
                      Ajouter des pièces jointes
                      <input hidden type="file" multiple onChange={handleTransitionFileUpload} />
                    </Button>
                    {transitionForm.piecesJointes.length > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        Fichiers sélectionnés: {transitionForm.piecesJointes.map((file) => file.name).join(', ')}
                      </Typography>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            )}
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Stack spacing={2.5}>
            <Card>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="h6">Historique des tâches</Typography>
                  <Divider />
                  <HistoryTimeline entries={taskHistory} dotColor={statusColor[facture.statut] || 'primary'} />
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Stack spacing={1.5}>
                  <Typography variant="h6">Commentaires</Typography>
                  <Divider />
                  <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    label="Commentaire"
                    value={commentInput}
                    onChange={(event) => setCommentInput(event.target.value)}
                    placeholder="Saisir un commentaire"
                  />
                  {mentionMatch && mentionSuggestions.length > 0 && (
                    <Paper variant="outlined" sx={{ maxHeight: 180, overflowY: 'auto' }}>
                      <MenuList dense>
                        {mentionSuggestions.map((user) => (
                          <MenuItem key={user.id} onClick={() => insertMention(user)}>
                            {user.email || user.username || user.id}
                          </MenuItem>
                        ))}
                      </MenuList>
                    </Paper>
                  )}
                  <Button
                    variant="contained"
                    onClick={handleAddComment}
                    disabled={isCommentSubmitting || !commentInput.trim()}
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    Ajouter commentaire
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Stack spacing={1.5}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between">
              <Typography variant="h6">Actions</Typography>
            </Stack>
            {allowedTransitions.length > 0 ? (
              <>
                <RadioGroup
                  value={selectedTransition?.to || ''}
                  onChange={(event) => {
                    const nextTransition = allowedTransitions.find((transition) => transition.to === event.target.value)
                    setSelectedTransition(nextTransition || null)
                  }}
                >
                  {allowedTransitions.map((transition) => (
                    <FormControlLabel
                      key={transition.to}
                      value={transition.to}
                      control={<Radio />}
                      label={getFacturationStepLabel(transition.to)}
                    />
                  ))}
                </RadioGroup>
                <Button
                  variant="contained"
                  onClick={() => selectedTransition && handleTransition(selectedTransition.to, {
                    ...transitionForm,
                    actionLabel: getFacturationStepLabel(selectedTransition.to),
                  })}
                  disabled={isTransitionSubmitting || !selectedTransition}
                  sx={{
                    alignSelf: 'flex-start',
                    bgcolor: 'common.black',
                    color: 'common.white',
                    '&:hover': { bgcolor: 'grey.900' },
                  }}
                >
                  Valider
                </Button>
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Aucune action disponible pour ce statut.
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  )
}

export default FacturationDetailPage
