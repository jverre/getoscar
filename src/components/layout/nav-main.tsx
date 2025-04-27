import {
  Collapsible
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from "@/components/ui/sidebar"
import { useApp } from '@/context/appContext'

export function NavMain() {
  const { user, isLoadingUser } = useApp()
  
  if (isLoadingUser) {
    return <SidebarGroupLabel>Loading...</SidebarGroupLabel>
  }

  if (user === null) {
    return (
      <SidebarGroup>
      <SidebarGroupLabel>Recent chats</SidebarGroupLabel>
      <SidebarMenu>
        <Collapsible>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Login to view your chats">
                <a href="/login">
                  <span>Login to view your chats</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </Collapsible>
      </SidebarMenu>
    </SidebarGroup>
    )
  }

  const items = [
    {
      title: "Bathing 2 week old baby",
      url: "/",
      isActive: true
    },
    {
      title: "Run VS code Browser",
      url: "/skills"
    }
  ]

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Recent chats</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible key={item.title} asChild defaultOpen={item.isActive}>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={item.title}>
                <a href={item.url}>
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
