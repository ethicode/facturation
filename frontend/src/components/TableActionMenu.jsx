import MoreHorizOutlinedIcon from '@mui/icons-material/MoreHorizOutlined'
import { IconButton, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material'
import { useState } from 'react'

function TableActionMenu({ actions = [], buttonLabel = 'Actions' }) {
  const [anchorEl, setAnchorEl] = useState(null)
  const open = Boolean(anchorEl)

  const handleOpen = (event) => {
    event.stopPropagation()
    setAnchorEl(event.currentTarget)
  }

  const handleClose = (event) => {
    event?.stopPropagation?.()
    setAnchorEl(null)
  }

  if (!actions.length) {
    return null
  }

  return (
    <>
      <IconButton
        size="small"
        aria-label={buttonLabel}
        aria-haspopup="menu"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleOpen}
      >
        <MoreHorizOutlinedIcon fontSize="small" />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={(event) => event.stopPropagation()}
        MenuListProps={{ 'aria-labelledby': buttonLabel }}
      >
        {actions.map((action) => (
          <MenuItem
            key={action.key}
            onClick={(event) => {
              event.stopPropagation()
              handleClose()
              action.onClick?.(event)
            }}
            disabled={action.disabled}
          >
            {action.icon ? <ListItemIcon>{action.icon}</ListItemIcon> : null}
            <ListItemText>{action.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}

export default TableActionMenu
