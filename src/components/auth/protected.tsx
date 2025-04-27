import { ReactNode } from 'react'
import { useApp } from '@/context/appContext'

interface ProtectedProps {
  children: ReactNode
  fallback?: ReactNode
  role?: string | string[]
  loadingComponent?: ReactNode
}

export function Protected({
  children,
  fallback = null,
  role,
  loadingComponent = <div>Loading...</div>
}: ProtectedProps) {
  const { user, isLoadingUser } = useApp()

  if (isLoadingUser) {
    return <>{loadingComponent}</>
  }

  if (!user) {
    return <>{fallback}</>
  }

  if (role && user.user_metadata?.role) {
    const userRole = user.user_metadata.role
    const requiredRoles = Array.isArray(role) ? role : [role]
    
    if (!requiredRoles.includes(userRole)) {
      return <>{fallback}</>
    }
  }

  return <>{children}</>
}