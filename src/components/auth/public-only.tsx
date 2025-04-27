import { ReactNode } from 'react'
import { useUser } from '@/context/user-context'

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
  const { user, isLoading } = useUser()

  if (isLoading) {
    return <>{loadingComponent}</>
  }

  if (user) {
    return <>{fallback}</>
  }

  return <>{children}</>
}