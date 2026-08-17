import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Box, Drawer } from '@mui/material'
import HeaderBar from './HeaderBar.jsx'
import SidebarNav from './SidebarNav.jsx'
import RoleContext from '../roleContext.js'
import { normalizeRole } from '../../utils/roles.js'

const drawerWidth = 280
const mobileHeaderHeight = 56
const desktopHeaderHeight = 64

function AppLayout() {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [activeRole, setActiveRole] = useState(() => {
    if (typeof window === 'undefined') {
      return 'utilisateur'
    }

    const auth = JSON.parse(localStorage.getItem('facturation.auth') || 'null')
    return normalizeRole(auth?.user?.role)
  })

  const handleOpen = () => {
    setIsMobileOpen(true)
  }

  const handleClose = () => {
    setIsMobileOpen(false)
  }

  return (
    <RoleContext.Provider value={{ activeRole, setActiveRole }}>
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <HeaderBar onOpenSidebar={handleOpen} />

        <Box sx={{ display: 'flex' }}>
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', lg: 'block' },
            width: drawerWidth,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              borderRight: '1px solid rgba(255, 255, 255, 0.12)',
              bgcolor: '#0f1218',
              top: `${desktopHeaderHeight}px`,
              height: `calc(100% - ${desktopHeaderHeight}px)`,
            },
          }}
        >
          <SidebarNav />
        </Drawer>

        <Drawer
          variant="temporary"
          open={isMobileOpen}
          onClose={handleClose}
          sx={{
            display: { xs: 'block', lg: 'none' },
            '& .MuiBackdrop-root': {
              top: `${mobileHeaderHeight}px`,
              height: `calc(100% - ${mobileHeaderHeight}px)`,
            },
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              bgcolor: '#0f1218',
              top: `${mobileHeaderHeight}px`,
              height: `calc(100% - ${mobileHeaderHeight}px)`,
            },
          }}
          ModalProps={{ keepMounted: true }}
        >
          <SidebarNav onNavigate={handleClose} />
        </Drawer>

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            minWidth: 0,
            p: { xs: 2, sm: 3 },
            pb: { xs: 3, sm: 4 },
            maxWidth: { xs: '100%', xl: 1600 },
          }}
        >
          <Outlet />
          </Box>
        </Box>
      </Box>
    </RoleContext.Provider>
  )
}

export default AppLayout
