import { createContext, useContext } from 'react'

const RoleContext = createContext({
  activeRole: 'utilisateur',
  setActiveRole: () => {},
})

export function useRoleContext() {
  return useContext(RoleContext)
}

export default RoleContext
