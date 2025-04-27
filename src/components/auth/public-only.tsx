import { ReactNode } from 'react'
import { useApp } from '@/context/appContext'

interface PublicOnlyProps {
  children: ReactNode
  fallback?: ReactNode
  loadingComponent?: ReactNode
}

export function PublicOnly({
  children,
  fallback = null,
  loadingComponent = <div>Loading...</div>
}: PublicOnlyProps) {
  const { user, isLoadingUser } = useApp()

  if (isLoadingUser) {
    return <>{loadingComponent}</>
  }

  if (user) {
    return <>{fallback}</>
  }

  return <>{children}</>
}