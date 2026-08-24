import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined'
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined'
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'

export const navigationItems = [
  {
    label: 'Vue globale',
    to: '/',
    icon: DashboardOutlinedIcon,
  },
  {
    label: 'Facturation',
    to: '/facturation',
    icon: ReceiptLongOutlinedIcon,
  },
  {
    label: 'Approvisionnement',
    to: '/approvisionnement',
    icon: Inventory2OutlinedIcon,
  },
  {
    label: 'DirFin',
    to: '/dirfin',
    icon: AccountBalanceOutlinedIcon,
  },
  {
    label: 'Budget',
    to: '/budget',
    icon: AccountBalanceWalletOutlinedIcon,
  },
  {
    label: 'Parametrage',
    to: '/parametrages',
    icon: SettingsOutlinedIcon,
  },
]
