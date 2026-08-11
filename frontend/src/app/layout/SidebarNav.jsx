import { NavLink } from 'react-router-dom'
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material'
import { navigationItems } from '../navigation.js'

function SidebarNav({ onNavigate }) {
  return (
    <Box
      sx={{
        p: 2.5,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 1,
        color: '#f3f5f7',
      }}
    >
      <Box sx={{ display: 'flex', height: 6, borderRadius: 1, overflow: 'hidden', mb: 2 }}>
        <Box sx={{ flex: 1, bgcolor: 'primary.main' }} />
        <Box sx={{ flex: 1, bgcolor: '#f3f5f7' }} />
      </Box>

      <Stack spacing={0.25} sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ color: '#f3f5f7' }}>
          FACTURATION Process
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(243, 245, 247, 0.72)' }}>
          Pilotage finance et missions
        </Typography>
      </Stack>

      <List sx={{ p: 0, display: 'grid', gap: 0.9 }}>
        {navigationItems.map((item) => (
          <ListItemButton
            key={item.to}
            component={NavLink}
            to={item.to}
            onClick={onNavigate}
            sx={{
              borderRadius: 1.5,
              px: 1.25,
              py: 1,
              color: 'rgba(243, 245, 247, 0.88)',
              transition: 'all 0.18s ease',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.08)',
                color: '#ffffff',
                '& .MuiListItemIcon-root': { color: '#ffffff' },
              },
              '&.active': {
                borderRadius: 1.5,
                bgcolor: 'primary.main',
                color: 'white',
                '& .MuiListItemIcon-root': { color: 'white' },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36, color: 'rgba(243, 245, 247, 0.72)' }}>
              <item.icon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  )
}

export default SidebarNav
