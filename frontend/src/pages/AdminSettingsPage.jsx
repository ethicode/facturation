import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined'
import PlaylistAddOutlinedIcon from '@mui/icons-material/PlaylistAddOutlined'
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined'
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
  MenuItem,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import TableActionMenu from '../components/TableActionMenu.jsx'
import {
  createAdminDirection,
  createAdminRole,
  createAdminUser,
  deleteAdminDirection,
  deleteAdminRole,
  deleteAdminUser,
  deleteWorkflowAssignment,
  loadAdminDirections,
  loadAdminRoles,
  loadAdminUsers,
  loadWorkflowAssignments,
  saveWorkflowAssignment,
  updateAdminDirection,
  updateAdminRole,
  updateAdminUser,
  updateWorkflowAssignment,
} from '../services/adminService.js'
import { approStatuses, facturationStatuses } from '../utils/invoiceWorkflow.js'

const tabKeys = ['directions', 'utilisateurs', 'workflows', 'roles']

function AdminSettingsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [tab, setTab] = useState('directions')
  const [directions, setDirections] = useState([])
  const [roles, setRoles] = useState([])
  const [users, setUsers] = useState([])
  const [workflowAssignments, setWorkflowAssignments] = useState([])

  const [directionInput, setDirectionInput] = useState('')
  const [roleCode, setRoleCode] = useState('')
  const [roleLabel, setRoleLabel] = useState('')
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [newUserRoles, setNewUserRoles] = useState(['administrateur'])
  const [newUserWorkflowSteps, setNewUserWorkflowSteps] = useState([])
  const [directionDrafts, setDirectionDrafts] = useState({})
  const [roleDrafts, setRoleDrafts] = useState({})
  const [userDrafts, setUserDrafts] = useState({})
  const [currentUserRole, setCurrentUserRole] = useState('')
  const [apiError, setApiError] = useState('')
  const [directionModal, setDirectionModal] = useState({ open: false, mode: 'edit', name: '', value: '' })
  const [roleModal, setRoleModal] = useState({ open: false, mode: 'edit', code: '', label: '' })
  const [userModal, setUserModal] = useState({
    open: false,
    mode: 'edit',
    id: '',
    username: '',
    name: '',
    email: '',
    roles: [],
    workflowSteps: [],
    isActive: true,
  })
  const [assignmentModal, setAssignmentModal] = useState({ open: false, step: '', workflowType: 'facturation' })
  const [workflowEditorModal, setWorkflowEditorModal] = useState({ open: false, step: '', userIds: [], workflowType: 'facturation' })

  const isAdmin = currentUserRole === 'admin' || currentUserRole === 'administrateur'

  const handleAdminError = (prefix, error) => {
    const message = error?.message || 'Erreur inconnue'
    setApiError(`${prefix}: ${message}`)
    console.error(prefix, error)
  }

  useEffect(() => {
    const key = location.hash.replace('#', '').toLowerCase()
    if (tabKeys.includes(key)) {
      setTab(key)
      return
    }

    if (!location.hash) {
      navigate(`${location.pathname}#directions`, { replace: true })
      setTab('directions')
    }
  }, [location.hash, location.pathname, navigate])

  useEffect(() => {
    try {
      const auth = JSON.parse(localStorage.getItem('facturation.auth') || 'null')
      setCurrentUserRole(auth?.user?.role || '')
    } catch {
      setCurrentUserRole('')
    }

    async function loadAdminData() {
      try {
        setApiError('')
        const [nextDirections, nextRoles, nextUsers, nextWorkflowAssignments] = await Promise.all([
          loadAdminDirections(),
          loadAdminRoles(),
          loadAdminUsers(),
          loadWorkflowAssignments(),
        ])
        setDirections(nextDirections)
        setRoles(nextRoles)
        setUsers(nextUsers)
        setWorkflowAssignments(nextWorkflowAssignments)
        setDirectionDrafts(Object.fromEntries(nextDirections.map((direction) => [direction, direction])))
        setRoleDrafts(Object.fromEntries(nextRoles.map((role) => [role.code, role.label])))
        setUserDrafts(
          Object.fromEntries(
            nextUsers.map((user) => [
              user.id,
              {
                name: user.name,
                email: user.email,
                roles: user.roles?.length ? user.roles : [user.role],
                workflowSteps: getUserWorkflowSteps(user.id, nextWorkflowAssignments),
                isActive: user.isActive,
              },
            ])
          )
        )
        setNewUserRoles((currentValue) => (currentValue.length > 0 ? currentValue : [nextRoles[0]?.code || 'administrateur']))
        setNewUserWorkflowSteps((currentValue) =>
          currentValue.length > 0 ? currentValue : [nextWorkflowAssignments[0]?.step || facturationStatuses[0] || '']
        )
      } catch (error) {
        handleAdminError('Impossible de charger les données d administration', error)
      }
    }

    loadAdminData()
  }, [])

  const handleTabChange = (_, nextTab) => {
    setTab(nextTab)
    navigate(`${location.pathname}#${nextTab}`, { replace: true })
  }

  const roleOptions = useMemo(() => roles.map((role) => role.code), [roles])
  const userLookup = useMemo(() => Object.fromEntries(users.map((user) => [user.id, user])), [users])
  const workflowAssignmentLookup = useMemo(
    () => Object.fromEntries(workflowAssignments.map((assignment) => [`${assignment.workflowType}:${assignment.step}`, assignment])),
    [workflowAssignments]
  )

  const getAssignment = (step, workflowType) => workflowAssignmentLookup[`${workflowType}:${step}`]

  const getUserWorkflowSteps = (userId, assignments = workflowAssignments) =>
    assignments.filter((assignment) => assignment.userIds.includes(userId)).map((assignment) => assignment.step)

  const openWorkflowEditor = (step, workflowType) => {
    setWorkflowEditorModal({
      open: true,
      step,
      workflowType,
      userIds: getAssignment(step, workflowType)?.userIds || [],
    })
  }

  const submitWorkflowEditor = async () => {
    const { step, userIds, workflowType } = workflowEditorModal
    const normalizedUserIds = Array.from(new Set(userIds))

    try {
      setApiError('')
      const currentAssignment = getAssignment(step, workflowType)
      let nextAssignments = workflowAssignments.filter(
        (assignment) => !(assignment.step === step && assignment.workflowType === workflowType)
      )

      if (normalizedUserIds.length > 0) {
        const savedAssignment = currentAssignment
          ? await updateWorkflowAssignment(step, normalizedUserIds, workflowType)
          : await saveWorkflowAssignment(step, normalizedUserIds, workflowType)
        nextAssignments = [...nextAssignments, savedAssignment]
      } else if (currentAssignment) {
        await deleteWorkflowAssignment(step, workflowType)
      }

      setWorkflowAssignments(nextAssignments)
      setUserDrafts((prev) => {
        const nextDrafts = { ...prev }
        Object.entries(nextDrafts).forEach(([userId, draft]) => {
          const nextWorkflowSteps = new Set(draft.workflowSteps || [])
          if (normalizedUserIds.includes(userId)) {
            nextWorkflowSteps.add(step)
          } else {
            nextWorkflowSteps.delete(step)
          }
          nextDrafts[userId] = {
            ...draft,
            workflowSteps: Array.from(nextWorkflowSteps),
          }
        })
        return nextDrafts
      })
    } catch (error) {
      handleAdminError('Impossible de mettre à jour les utilisateurs de cette étape', error)
      return
    }

    setWorkflowEditorModal({ open: false, step: '', userIds: [], workflowType: 'facturation' })
  }

  const addDirection = async () => {
    const trimmed = directionInput.trim()
    if (!trimmed) return
    if (directions.some((item) => item.toLowerCase() === trimmed.toLowerCase())) return

    try {
      setApiError('')
      const nextDirections = await createAdminDirection(trimmed)
      setDirections(nextDirections)
      setDirectionDrafts(Object.fromEntries(nextDirections.map((direction) => [direction, direction])))
      setDirectionInput('')
    } catch (error) {
      handleAdminError('Impossible de créer la direction', error)
    }
  }

  const addRole = async () => {
    const code = roleCode.trim().toLowerCase()
    const label = roleLabel.trim()
    if (!code || !label) return
    if (roles.some((role) => role.code === code)) return

    try {
      setApiError('')
      const nextRoles = await createAdminRole(code, label)
      setRoles(nextRoles)
      setRoleDrafts(Object.fromEntries(nextRoles.map((role) => [role.code, role.label])))
      setRoleCode('')
      setRoleLabel('')
    } catch (error) {
      handleAdminError('Impossible de créer le rôle', error)
    }
  }

  const addUser = async () => {
    const name = userName.trim()
    const email = userEmail.trim().toLowerCase()
    if (!name || !email || newUserRoles.length === 0) return
    if (users.some((user) => user.email === email)) return

    try {
      setApiError('')
      const createdUser = await createAdminUser({
        username: email.split('@')[0],
        password: `${email.split('@')[0]}123`,
        full_name: name,
        role: newUserRoles[0],
        roles: newUserRoles,
        email,
      })
      const updatedAssignments = new Map(workflowAssignments.map((assignment) => [assignment.step, assignment]))
      for (const step of newUserWorkflowSteps) {
        const currentAssignment = updatedAssignments.get(step)
        const nextUserIds = Array.from(new Set([...(currentAssignment?.userIds || []), createdUser.id]))
        const nextAssignment = currentAssignment
          ? await updateWorkflowAssignment(step, nextUserIds)
          : await saveWorkflowAssignment(step, nextUserIds)
        updatedAssignments.set(step, nextAssignment)
      }
      setUsers((prev) => [...prev, createdUser])
      setUserDrafts((prev) => ({
        ...prev,
        [createdUser.id]: {
          name: createdUser.name,
          email: createdUser.email,
          roles: createdUser.roles?.length ? createdUser.roles : [createdUser.role],
          workflowSteps: newUserWorkflowSteps,
          isActive: createdUser.isActive,
        },
      }))
      setWorkflowAssignments(Array.from(updatedAssignments.values()))
      setUserName('')
      setUserEmail('')
      setNewUserRoles([roleOptions[0] || 'administrateur'])
      setNewUserWorkflowSteps([])
    } catch (error) {
      handleAdminError('Impossible de créer l utilisateur', error)
    }
  }

  const removeDirection = async (name) => {
    try {
      setApiError('')
      const nextDirections = await deleteAdminDirection(name)
      setDirections(nextDirections)
      setDirectionDrafts(Object.fromEntries(nextDirections.map((direction) => [direction, direction])))
    } catch (error) {
      handleAdminError('Impossible de supprimer la direction', error)
    }
  }

  const saveDirection = async (name) => {
    const nextName = (directionDrafts[name] || '').trim()
    if (!nextName) return
    try {
      setApiError('')
      const nextDirections = await updateAdminDirection(name, nextName)
      setDirections(nextDirections)
      setDirectionDrafts(Object.fromEntries(nextDirections.map((direction) => [direction, direction])))
    } catch (error) {
      handleAdminError('Impossible de mettre à jour la direction', error)
    }
  }

  const removeRole = async (code) => {
    try {
      setApiError('')
      const nextRoles = await deleteAdminRole(code)
      setRoles(nextRoles)
      setRoleDrafts(Object.fromEntries(nextRoles.map((role) => [role.code, role.label])))
      const nextUsers = await loadAdminUsers()
      setUsers(nextUsers)
      setUserDrafts(
        Object.fromEntries(
          nextUsers.map((user) => [
            user.id,
            {
              name: user.name,
              email: user.email,
              roles: user.roles?.length ? user.roles : [user.role],
              workflowSteps: getUserWorkflowSteps(user.id, workflowAssignments),
              isActive: user.isActive,
            },
          ])
        )
      )
    } catch (error) {
      handleAdminError('Impossible de supprimer le rôle', error)
    }
  }

  const saveRole = async (code) => {
    const nextLabel = (roleDrafts[code] || '').trim()
    if (!nextLabel) return
    try {
      setApiError('')
      const nextRoles = await updateAdminRole(code, nextLabel)
      setRoles(nextRoles)
      setRoleDrafts(Object.fromEntries(nextRoles.map((role) => [role.code, role.label])))
    } catch (error) {
      handleAdminError('Impossible de mettre à jour le rôle', error)
    }
  }

  const removeUser = async (id) => {
    try {
      setApiError('')
      await deleteAdminUser(id)
      const updatedAssignments = await Promise.all(
        workflowAssignments.map(async (assignment) => {
          const nextUserIds = assignment.userIds.filter((userId) => userId !== id)
          if (nextUserIds.length === assignment.userIds.length) {
            return assignment
          }
          return updateWorkflowAssignment(assignment.step, nextUserIds)
        })
      )
      setUsers((prev) => prev.filter((user) => user.id !== id))
      setUserDrafts((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      setWorkflowAssignments(updatedAssignments.filter((assignment) => assignment.userIds.length > 0))
    } catch (error) {
      handleAdminError('Impossible de supprimer l utilisateur', error)
    }
  }

  const saveUser = async (userId) => {
    const draft = userDrafts[userId]
    if (!draft) return
    if (!draft.roles || draft.roles.length === 0) return

    try {
      setApiError('')
      const updatedUser = await updateAdminUser(userId, {
        full_name: draft.name,
        email: draft.email,
        role: draft.roles[0],
        roles: draft.roles,
        is_active: draft.isActive,
      })

      const selectedSteps = new Set(draft.workflowSteps || [])
      const allStatuses = [...approStatuses, ...facturationStatuses]
      const updatedAssignments = new Map(workflowAssignments.map((assignment) => [`${assignment.workflowType}:${assignment.step}`, assignment]))
      for (const step of allStatuses) {
        const wfType = approStatuses.includes(step) ? 'appro' : 'facturation'
        const key = `${wfType}:${step}`
        const currentAssignment = updatedAssignments.get(key)
        const currentUserIds = currentAssignment?.userIds || []
        const hasUser = currentUserIds.includes(userId)
        const shouldHaveUser = selectedSteps.has(step)

        if (hasUser === shouldHaveUser) {
          continue
        }

        const nextUserIds = shouldHaveUser
          ? Array.from(new Set([...currentUserIds, userId]))
          : currentUserIds.filter((item) => item !== userId)

        if (nextUserIds.length === 0) {
          if (currentAssignment) {
            await deleteWorkflowAssignment(step, wfType)
          }
          updatedAssignments.delete(key)
          continue
        }

        const nextAssignment = currentAssignment
          ? await updateWorkflowAssignment(step, nextUserIds, wfType)
          : await saveWorkflowAssignment(step, nextUserIds, wfType)
        updatedAssignments.set(key, nextAssignment)
      }

      setUsers((prev) => prev.map((item) => (item.id === userId ? updatedUser : item)))
      setUserDrafts((prev) => ({
        ...prev,
        [userId]: {
          name: updatedUser.name,
          email: updatedUser.email,
          roles: updatedUser.roles?.length ? updatedUser.roles : [updatedUser.role],
          workflowSteps: Array.from(selectedSteps),
          isActive: updatedUser.isActive,
        },
      }))
      setWorkflowAssignments(Array.from(updatedAssignments.values()))
    } catch (error) {
      handleAdminError('Impossible de mettre à jour l utilisateur', error)
    }
  }

  const removeAssignment = async (step, workflowType) => {
    try {
      setApiError('')
      const nextAssignments = await deleteWorkflowAssignment(step, workflowType)
      setWorkflowAssignments(nextAssignments)
    } catch (error) {
      handleAdminError('Impossible de supprimer l assignation workflow', error)
    }
  }

  const openEditDirectionModal = (name) => {
    setDirectionModal({ open: true, mode: 'edit', name, value: directionDrafts[name] || name })
  }

  const openDeleteDirectionModal = (name) => {
    setDirectionModal({ open: true, mode: 'delete', name, value: name })
  }

  const submitDirectionModal = async () => {
    if (directionModal.mode === 'delete') {
      await removeDirection(directionModal.name)
    } else {
      setDirectionDrafts((prev) => ({ ...prev, [directionModal.name]: directionModal.value }))
      await saveDirection(directionModal.name)
    }
    setDirectionModal({ open: false, mode: 'edit', name: '', value: '' })
  }

  const openEditRoleModal = (code) => {
    setRoleModal({ open: true, mode: 'edit', code, label: roleDrafts[code] || '' })
  }

  const openDeleteRoleModal = (code) => {
    setRoleModal({ open: true, mode: 'delete', code, label: roleDrafts[code] || '' })
  }

  const submitRoleModal = async () => {
    if (roleModal.mode === 'delete') {
      await removeRole(roleModal.code)
    } else {
      setRoleDrafts((prev) => ({ ...prev, [roleModal.code]: roleModal.label }))
      await saveRole(roleModal.code)
    }
    setRoleModal({ open: false, mode: 'edit', code: '', label: '' })
  }

  const openEditUserModal = (user) => {
    const draft = userDrafts[user.id] || {}
    setUserModal({
      open: true,
      mode: 'edit',
      id: user.id,
      username: user.username,
      name: draft.name || user.name,
      email: draft.email || user.email,
      roles: draft.roles || user.roles || [user.role],
      workflowSteps: draft.workflowSteps || getUserWorkflowSteps(user.id),
      isActive: draft.isActive ?? user.isActive,
    })
  }

  const openDeleteUserModal = (user) => {
    setUserModal({
      open: true,
      mode: 'delete',
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      roles: user.roles || [user.role],
      workflowSteps: getUserWorkflowSteps(user.id),
      isActive: user.isActive,
    })
  }

  const submitUserModal = async () => {
    if (userModal.mode === 'delete') {
      await removeUser(userModal.id)
    } else {
      setUserDrafts((prev) => ({
        ...prev,
        [userModal.id]: {
          name: userModal.name,
          email: userModal.email,
          roles: userModal.roles,
          workflowSteps: userModal.workflowSteps,
          isActive: userModal.isActive,
        },
      }))
      await saveUser(userModal.id)
    }

    setUserModal({
      open: false,
      mode: 'edit',
      id: '',
      username: '',
      name: '',
      email: '',
      roles: [],
      workflowSteps: [],
      isActive: true,
    })
  }

  const openDeleteAssignmentModal = (step, workflowType) => {
    setAssignmentModal({ open: true, step, workflowType })
  }

  const submitAssignmentDelete = async () => {
    await removeAssignment(assignmentModal.step, assignmentModal.workflowType)
    setAssignmentModal({ open: false, step: '', workflowType: 'facturation' })
  }

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title="Parametrage Admin"
        subtitle="Gerer les directions, les utilisateurs et les roles d'acces de la plateforme."
      />

      <Card>
        <CardContent>
          {!isAdmin && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Accès administrateur requis: connecte-toi avec un compte admin pour modifier les paramètres.
            </Alert>
          )}

          {apiError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setApiError('')}>
              {apiError}
            </Alert>
          )}

          <Tabs value={tab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            <Tab value="directions" label="Directions" />
            <Tab value="utilisateurs" label="Utilisateurs" />
            <Tab value="workflows" label="Workflows" />
            <Tab value="roles" label="Roles" />
          </Tabs>
          <Divider sx={{ my: 2 }} />

          {tab === 'directions' && (
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <TextField
                  fullWidth
                  label="Nouvelle direction"
                  value={directionInput}
                  disabled={!isAdmin}
                  onChange={(event) => setDirectionInput(event.target.value)}
                />
                <Button variant="contained" startIcon={<PlaylistAddOutlinedIcon />} onClick={addDirection} disabled={!isAdmin}>
                  Ajouter
                </Button>
              </Stack>

              <TableContainer component={Paper} variant="outlined">
                <Table size="small" sx={{ '& .MuiTableCell-root': { py: 1.25 } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Direction</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {directions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={2}>
                          <Typography variant="body2" color="text.secondary">Aucune direction trouvée.</Typography>
                        </TableCell>
                      </TableRow>
                    )}

                    {directions.map((direction) => (
                      <TableRow key={direction} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{direction}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <TableActionMenu
                            buttonLabel={`Actions direction ${direction}`}
                            actions={[
                              {
                                key: 'edit',
                                label: 'Modifier',
                                icon: <EditOutlinedIcon fontSize="small" />,
                                onClick: () => openEditDirectionModal(direction),
                                disabled: !isAdmin,
                              },
                              {
                                key: 'delete',
                                label: 'Supprimer',
                                icon: <DeleteOutlineOutlinedIcon fontSize="small" />,
                                onClick: () => openDeleteDirectionModal(direction),
                                disabled: !isAdmin,
                              },
                            ]}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
          )}

          {tab === 'utilisateurs' && (
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                <TextField
                  fullWidth
                  label="Nom complet"
                  value={userName}
                  disabled={!isAdmin}
                  onChange={(event) => setUserName(event.target.value)}
                />
                <TextField
                  fullWidth
                  label="Email"
                  value={userEmail}
                  disabled={!isAdmin}
                  onChange={(event) => setUserEmail(event.target.value)}
                />
                <TextField
                  select
                  label="Roles"
                  value={newUserRoles}
                  disabled={!isAdmin}
                  onChange={(event) => {
                    const value = event.target.value
                    setNewUserRoles(typeof value === 'string' ? value.split(',') : value)
                  }}
                  sx={{ minWidth: 180 }}
                  SelectProps={{
                    multiple: true,
                    renderValue: (selected) => selected.join(', '),
                  }}
                >
                  {roles.map((role) => (
                    <MenuItem key={role.code} value={role.code}>
                      {role.label}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="Etapes workflow"
                  value={newUserWorkflowSteps}
                  disabled={!isAdmin}
                  onChange={(event) => {
                    const value = event.target.value
                    setNewUserWorkflowSteps(typeof value === 'string' ? value.split(',') : value)
                  }}
                  sx={{ minWidth: 220 }}
                  SelectProps={{
                    multiple: true,
                    renderValue: (selected) => selected.join(', '),
                  }}
                >
                  {[...approStatuses, ...facturationStatuses].map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </TextField>
                <Button variant="contained" startIcon={<PersonAddAltOutlinedIcon />} onClick={addUser} disabled={!isAdmin}>
                  Ajouter
                </Button>
              </Stack>

              <TableContainer component={Paper} variant="outlined">
                <Table size="small" sx={{ '& .MuiTableCell-root': { py: 1.25 } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Identifiant</TableCell>
                      <TableCell>Nom</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Rôle</TableCell>
                      <TableCell>Statut</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6}>
                          <Typography variant="body2" color="text.secondary">Aucun utilisateur trouvé.</Typography>
                        </TableCell>
                      </TableRow>
                    )}

                    {users.map((user) => (
                      <TableRow key={user.id} hover>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            {(user.roles?.length ? user.roles : [user.role]).map((roleCode) => (
                              <Chip
                                key={`${user.id}-${roleCode}`}
                                size="small"
                                label={roles.find((role) => role.code === roleCode)?.label || roleCode}
                              />
                            ))}
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            color={user.isActive ? 'success' : 'default'}
                            label={user.isActive ? 'Actif' : 'Inactif'}
                            variant={user.isActive ? 'filled' : 'outlined'}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <TableActionMenu
                            buttonLabel={`Actions utilisateur ${user.username}`}
                            actions={[
                              {
                                key: 'edit',
                                label: 'Modifier',
                                icon: <EditOutlinedIcon fontSize="small" />,
                                onClick: () => openEditUserModal(user),
                                disabled: !isAdmin,
                              },
                              {
                                key: 'delete',
                                label: 'Supprimer',
                                icon: <DeleteOutlineOutlinedIcon fontSize="small" />,
                                onClick: () => openDeleteUserModal(user),
                                disabled: !isAdmin,
                              },
                            ]}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

            </Stack>
          )}

          {tab === 'workflows' && (
            <Stack spacing={3}>
              <Typography variant="body2" color="text.secondary">
                Clique sur une étape pour ajouter ou retirer des utilisateurs assignés à cette étape.
              </Typography>

              {/* ── Workflow Approvisionnement ───────────────────────────────── */}
              <Stack spacing={1.5}>
                <Typography variant="subtitle2">Workflow Approvisionnement</Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small" sx={{ '& .MuiTableCell-root': { py: 1.25 } }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Étape</TableCell>
                        <TableCell>Utilisateurs assignés</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {approStatuses.map((step) => {
                        const assignment = getAssignment(step, 'appro')
                        const assignedUserIds = assignment?.userIds || []
                        return (
                          <TableRow
                            key={step}
                            hover
                            sx={{ cursor: isAdmin ? 'pointer' : 'default' }}
                            onClick={() => isAdmin && openWorkflowEditor(step, 'appro')}
                          >
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{step}</Typography>
                            </TableCell>
                            <TableCell>
                              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                {assignedUserIds.length > 0 ? (
                                  assignedUserIds.map((userId) => (
                                    <Chip key={userId} size="small" label={userLookup[userId]?.email || userId} />
                                  ))
                                ) : (
                                  <Typography variant="caption" color="text.secondary">Aucun utilisateur assigné</Typography>
                                )}
                              </Stack>
                            </TableCell>
                            <TableCell align="right">
                              <TableActionMenu
                                buttonLabel={`Actions appro ${step}`}
                                actions={[
                                  {
                                    key: 'delete',
                                    label: 'Supprimer',
                                    icon: <DeleteOutlineOutlinedIcon fontSize="small" />,
                                    onClick: () => openDeleteAssignmentModal(step, 'appro'),
                                    disabled: !isAdmin,
                                  },
                                ]}
                              />
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Stack>

              {/* ── Workflow Facturation ─────────────────────────────────────── */}
              <Stack spacing={1.5}>
                <Typography variant="subtitle2">Workflow Facturation</Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small" sx={{ '& .MuiTableCell-root': { py: 1.25 } }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Étape</TableCell>
                        <TableCell>Utilisateurs assignés</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {facturationStatuses.map((step) => {
                        const assignment = getAssignment(step, 'facturation')
                        const assignedUserIds = assignment?.userIds || []
                        return (
                          <TableRow
                            key={step}
                            hover
                            sx={{ cursor: isAdmin ? 'pointer' : 'default' }}
                            onClick={() => isAdmin && openWorkflowEditor(step, 'facturation')}
                          >
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{step}</Typography>
                            </TableCell>
                            <TableCell>
                              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                {assignedUserIds.length > 0 ? (
                                  assignedUserIds.map((userId) => (
                                    <Chip key={userId} size="small" label={userLookup[userId]?.email || userId} />
                                  ))
                                ) : (
                                  <Typography variant="caption" color="text.secondary">Aucun utilisateur assigné</Typography>
                                )}
                              </Stack>
                            </TableCell>
                            <TableCell align="right">
                              <TableActionMenu
                                buttonLabel={`Actions facturation ${step}`}
                                actions={[
                                  {
                                    key: 'delete',
                                    label: 'Supprimer',
                                    icon: <DeleteOutlineOutlinedIcon fontSize="small" />,
                                    onClick: () => openDeleteAssignmentModal(step, 'facturation'),
                                    disabled: !isAdmin,
                                  },
                                ]}
                              />
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Stack>
            </Stack>
          )}

          {tab === 'roles' && (
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <TextField
                  label="Code role"
                  value={roleCode}
                  disabled={!isAdmin}
                  onChange={(event) => setRoleCode(event.target.value)}
                  sx={{ minWidth: 180 }}
                />
                <TextField
                  fullWidth
                  label="Libelle role"
                  value={roleLabel}
                  disabled={!isAdmin}
                  onChange={(event) => setRoleLabel(event.target.value)}
                />
                <Button variant="contained" startIcon={<ShieldOutlinedIcon />} onClick={addRole} disabled={!isAdmin}>
                  Ajouter
                </Button>
              </Stack>

              <TableContainer component={Paper} variant="outlined">
                <Table size="small" sx={{ '& .MuiTableCell-root': { py: 1.25 } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Code</TableCell>
                      <TableCell>Libellé</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {roles.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3}>
                          <Typography variant="body2" color="text.secondary">Aucun rôle trouvé.</Typography>
                        </TableCell>
                      </TableRow>
                    )}

                    {roles.map((role) => (
                      <TableRow key={role.code} hover>
                        <TableCell>
                          <Chip size="small" variant="outlined" label={role.code} />
                        </TableCell>
                        <TableCell>{role.label}</TableCell>
                        <TableCell align="right">
                          <TableActionMenu
                            buttonLabel={`Actions role ${role.code}`}
                            actions={[
                              {
                                key: 'edit',
                                label: 'Modifier',
                                icon: <EditOutlinedIcon fontSize="small" />,
                                onClick: () => openEditRoleModal(role.code),
                                disabled: !isAdmin,
                              },
                              {
                                key: 'delete',
                                label: 'Supprimer',
                                icon: <DeleteOutlineOutlinedIcon fontSize="small" />,
                                onClick: () => openDeleteRoleModal(role.code),
                                disabled: !isAdmin || role.code === 'admin' || role.code === 'administrateur',
                              },
                            ]}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
          )}

          <Dialog open={directionModal.open} onClose={() => setDirectionModal({ open: false, mode: 'edit', name: '', value: '' })} fullWidth maxWidth="sm">
            <DialogTitle>{directionModal.mode === 'delete' ? 'Supprimer la direction' : 'Modifier la direction'}</DialogTitle>
            <DialogContent>
              {directionModal.mode === 'delete' ? (
                <Typography variant="body2">Confirmer la suppression de la direction "{directionModal.name}" ?</Typography>
              ) : (
                <TextField
                  autoFocus
                  fullWidth
                  margin="dense"
                  label="Nom de la direction"
                  value={directionModal.value}
                  onChange={(event) => setDirectionModal((prev) => ({ ...prev, value: event.target.value }))}
                />
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDirectionModal({ open: false, mode: 'edit', name: '', value: '' })}>Annuler</Button>
              <Button color={directionModal.mode === 'delete' ? 'error' : 'primary'} variant="contained" onClick={submitDirectionModal}>
                {directionModal.mode === 'delete' ? 'Supprimer' : 'Enregistrer'}
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog open={roleModal.open} onClose={() => setRoleModal({ open: false, mode: 'edit', code: '', label: '' })} fullWidth maxWidth="sm">
            <DialogTitle>{roleModal.mode === 'delete' ? 'Supprimer le rôle' : 'Modifier le rôle'}</DialogTitle>
            <DialogContent>
              {roleModal.mode === 'delete' ? (
                <Typography variant="body2">Confirmer la suppression du rôle "{roleModal.code}" ?</Typography>
              ) : (
                <TextField
                  autoFocus
                  fullWidth
                  margin="dense"
                  label="Libellé du rôle"
                  value={roleModal.label}
                  onChange={(event) => setRoleModal((prev) => ({ ...prev, label: event.target.value }))}
                />
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setRoleModal({ open: false, mode: 'edit', code: '', label: '' })}>Annuler</Button>
              <Button color={roleModal.mode === 'delete' ? 'error' : 'primary'} variant="contained" onClick={submitRoleModal}>
                {roleModal.mode === 'delete' ? 'Supprimer' : 'Enregistrer'}
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog
            open={userModal.open}
            onClose={() =>
              setUserModal({ open: false, mode: 'edit', id: '', username: '', name: '', email: '', roles: [], workflowSteps: [], isActive: true })
            }
            fullWidth
            maxWidth="sm"
          >
            <DialogTitle>{userModal.mode === 'delete' ? 'Supprimer l utilisateur' : 'Modifier l utilisateur'}</DialogTitle>
            <DialogContent>
              {userModal.mode === 'delete' ? (
                <Typography variant="body2">Confirmer la suppression de l utilisateur "{userModal.username}" ?</Typography>
              ) : (
                <Stack spacing={1.5} sx={{ mt: 1 }}>
                  <TextField label="Identifiant" value={userModal.username} disabled />
                  <TextField
                    label="Nom complet"
                    value={userModal.name}
                    onChange={(event) => setUserModal((prev) => ({ ...prev, name: event.target.value }))}
                  />
                  <TextField
                    label="Email"
                    value={userModal.email}
                    onChange={(event) => setUserModal((prev) => ({ ...prev, email: event.target.value }))}
                  />
                  <TextField
                    select
                    label="Roles"
                    value={userModal.roles}
                    onChange={(event) => {
                      const value = event.target.value
                      setUserModal((prev) => ({ ...prev, roles: typeof value === 'string' ? value.split(',') : value }))
                    }}
                    SelectProps={{
                      multiple: true,
                      renderValue: (selected) => selected.join(', '),
                    }}
                  >
                    {roles.map((role) => (
                      <MenuItem key={role.code} value={role.code}>
                        {role.label}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    select
                    label="Etapes workflow"
                    value={userModal.workflowSteps}
                    onChange={(event) => {
                      const value = event.target.value
                      setUserModal((prev) => ({ ...prev, workflowSteps: typeof value === 'string' ? value.split(',') : value }))
                    }}
                    SelectProps={{
                      multiple: true,
                      renderValue: (selected) => selected.join(', '),
                    }}
                  >
                  {[...approStatuses, ...facturationStatuses].map((status) => (
                      <MenuItem key={status} value={status}>
                        {status}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    select
                    label="Statut"
                    value={String(userModal.isActive)}
                    onChange={(event) => setUserModal((prev) => ({ ...prev, isActive: event.target.value === 'true' }))}
                  >
                    <MenuItem value="true">Actif</MenuItem>
                    <MenuItem value="false">Inactif</MenuItem>
                  </TextField>
                </Stack>
              )}
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() =>
                  setUserModal({ open: false, mode: 'edit', id: '', username: '', name: '', email: '', roles: [], workflowSteps: [], isActive: true })
                }
              >
                Annuler
              </Button>
              <Button color={userModal.mode === 'delete' ? 'error' : 'primary'} variant="contained" onClick={submitUserModal}>
                {userModal.mode === 'delete' ? 'Supprimer' : 'Enregistrer'}
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog open={assignmentModal.open} onClose={() => setAssignmentModal({ open: false, step: '', workflowType: 'facturation' })} fullWidth maxWidth="xs">
            <DialogTitle>Supprimer l assignation</DialogTitle>
            <DialogContent>
              <Typography variant="body2">Confirmer la suppression de l assignation pour l étape "{assignmentModal.step}" ?</Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setAssignmentModal({ open: false, step: '', workflowType: 'facturation' })}>Annuler</Button>
              <Button color="error" variant="contained" onClick={submitAssignmentDelete}>Supprimer</Button>
            </DialogActions>
          </Dialog>

          <Dialog
            open={workflowEditorModal.open}
            onClose={() => setWorkflowEditorModal({ open: false, step: '', userIds: [], workflowType: 'facturation' })}
            fullWidth
            maxWidth="sm"
          >
            <DialogTitle>Ajouter des utilisateurs à l étape</DialogTitle>
            <DialogContent>
              <Stack spacing={1.5} sx={{ mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Étape sélectionnée: {workflowEditorModal.step}
                </Typography>
                <TextField
                  select
                  label="Utilisateurs"
                  value={workflowEditorModal.userIds}
                  onChange={(event) => {
                    const value = event.target.value
                    setWorkflowEditorModal((prev) => ({
                      ...prev,
                      userIds: typeof value === 'string' ? value.split(',') : value,
                    }))
                  }}
                  SelectProps={{
                    multiple: true,
                    renderValue: (selected) =>
                      selected
                        .map((userId) => userLookup[userId]?.email || userId)
                        .join(', '),
                  }}
                >
                  {users.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.email || user.id}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setWorkflowEditorModal({ open: false, step: '', userIds: [], workflowType: 'facturation' })}>Annuler</Button>
              <Button variant="contained" onClick={submitWorkflowEditor}>
                Enregistrer
              </Button>
            </DialogActions>
          </Dialog>
        </CardContent>
      </Card>
    </Stack>
  )
}

export default AdminSettingsPage