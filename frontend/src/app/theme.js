import { createTheme } from '@mui/material'

export const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#e60028',
      dark: '#b3001f',
      light: '#ff4d68',
    },
    secondary: {
      main: '#1a1a1a',
    },
    background: {
      default: '#f4f5f7',
      paper: '#ffffff',
    },
    text: {
      primary: '#111111',
      secondary: '#53565a',
    },
    success: {
      main: '#00875a',
    },
    warning: {
      main: '#ff8b00',
    },
    error: {
      main: '#d12b2b',
    },
    info: {
      main: '#006bb3',
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: 'Montserrat, sans-serif',
    h4: {
      fontFamily: 'Montserrat, sans-serif',
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h5: {
      fontFamily: 'Montserrat, sans-serif',
      fontWeight: 700,
    },
    h6: {
      fontFamily: 'Montserrat, sans-serif',
      fontWeight: 700,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
        containedPrimary: {
          boxShadow: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          border: '1px solid #d9dde3',
          boxShadow: '0 8px 24px rgba(17, 17, 17, 0.05)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderColor: '#d9dde3',
        },
      },
    },
  },
})
