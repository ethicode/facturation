import MenuIcon from '@mui/icons-material/Menu'
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined'
import SearchIcon from '@mui/icons-material/Search'
import {
  AppBar,
  Box,
  Button,
  Chip,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useRoleContext } from '../roleContext.js'
import { getStoredAuth, logout } from '../../services/authService.js'

function HeaderBar({ onOpenSidebar }) {
  const navigate = useNavigate()
  const { activeRole, setActiveRole } = useRoleContext()
  const auth = getStoredAuth()


  return (
    <AppBar
      position="sticky"
      elevation={0}
      color="inherit"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        bgcolor: 'rgba(255, 255, 255, 0.94)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #d9dde3',
      }}
    >
      <Toolbar sx={{ gap: 1.5, minHeight: { xs: 56, sm: 64 } }}>
        <IconButton
          aria-label="ouvrir le menu"
          color="inherit"
          onClick={onOpenSidebar}
          sx={{ display: { lg: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        <Stack spacing={0} sx={{ display: { xs: 'none', md: 'flex' }, minWidth: 150 }}>
          <Typography variant="caption" color="text.secondary">
            SGSN Société Générale
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600 }}>
            Suivi operations
          </Typography>
        </Stack>

        <Box sx={{ minWidth: { xs: 0, sm: 220 }, maxWidth: 520, flex: 1, display: { xs: 'none', sm: 'block' } }}>
          <TextField
            size="small"
            fullWidth
            placeholder="Rechercher facturation, approvisionnement, centre de coût"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 99,
                bgcolor: '#f8f9fb',
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton color="inherit" aria-label="notifications">
            <NotificationsOutlinedIcon />
          </IconButton>
          <Box sx={{ display: { xs: 'none', lg: 'flex' }, alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {auth?.user?.full_name || auth?.user?.username || 'Utilisateur'}
            </Typography>
            <Button size="small" variant="outlined" onClick={() => {
              logout()
              navigate('/login', { replace: true })
            }}>
              Déconnexion
            </Button>
          </Box>
          <FormControl size="small" sx={{ minWidth: { xs: 140, sm: 170 } }}>
            <InputLabel id="header-role-select-label">Rôle actif</InputLabel>
            <Select
              labelId="header-role-select-label"
              value={activeRole}
              label="Rôle actif"
              onChange={(event) => setActiveRole(event.target.value)}
              sx={{ borderRadius: 10 }}
            >
              <MenuItem value="administrateur">Administrateur</MenuItem>
              <MenuItem value="utilisateur">Utilisateur</MenuItem>
              <MenuItem value="manageur">Manageur</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Toolbar>
    </AppBar>
  )
}

export default HeaderBar
