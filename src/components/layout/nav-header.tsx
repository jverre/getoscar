"use client"

import * as React from "react"
import {
    ChevronsUpDown,
    Plus,
    SquarePen,
    LifeBuoy,
    UserPen
} from "lucide-react"
import {
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuShortcut
} from "@/components/ui/dropdown-menu"
import { Button } from "../ui/button"
import { useSidebar as useUISidebar } from "@/components/ui/sidebar";
import { useApp } from '@/context/appContext'

export function NavHeader() {
    const { isMobile } = useUISidebar()
    const {
        user,
        isLoadingUser,
        teams,
        isLoadingTeams,
        teamsError,
        selectedTeamId,
        setSelectedTeamId
    } = useApp()

    if (isLoadingTeams || isLoadingUser) {
        return <SidebarHeader>Loading...</SidebarHeader>
    }

    if (!user) {
        return (
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <div className="flex items-center gap-2">
                            <SidebarMenuButton
                                size="lg"
                                className="h-8 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground focus:outline-none focus-visible:ring-0"
                            >
                                <div className="flex aspect-square size-6 items-center justify-center rounded-sm bg-sidebar-primary text-sidebar-primary-foreground">
                                    <UserPen className="size-4 shrink-0" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">
                                        Oscar
                                    </span>
                                </div>
                            </SidebarMenuButton>
                            <Button variant="ghost" size="icon">
                                <SquarePen className="size-4" />
                            </Button>
                        </div>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
        )
    }

    if (teamsError) {
        console.error(teamsError)
        return <SidebarHeader>Error loading teams</SidebarHeader>
    }

    if (!teams.length) {
        return <SidebarHeader>No teams available</SidebarHeader>
    }

    return (
        <SidebarHeader>
            <SidebarMenu>
                <SidebarMenuItem>
                    <DropdownMenu>
                        <div className="flex items-center gap-2">
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                    size="lg"
                                    className="h-8 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground focus:outline-none focus-visible:ring-0"
                                >
                                    <div className="flex aspect-square size-6 items-center justify-center rounded-sm bg-sidebar-primary text-sidebar-primary-foreground">
                                        <LifeBuoy className="size-4 shrink-0" />
                                    </div>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-semibold">
                                            {teams.find(team => team.id === selectedTeamId)?.name}
                                        </span>
                                    </div>
                                    <ChevronsUpDown className="ml-auto" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <Button variant="ghost" size="icon">
                                <SquarePen className="size-4" />
                            </Button>
                        </div>
                        <DropdownMenuContent
                            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                            align="start"
                            side={isMobile ? "bottom" : "right"}
                            sideOffset={4}
                        >
                            <DropdownMenuLabel className="text-xs text-muted-foreground">
                                Teams
                            </DropdownMenuLabel>
                            {teams.map((team, index) => (
                                <DropdownMenuItem
                                    key={team.name}
                                    onClick={() => setSelectedTeamId(team.id)}
                                    className="gap-2 p-2"
                                >
                                    <div className="flex size-6 items-center justify-center rounded-sm border">
                                        <LifeBuoy className="size-4 shrink-0" />
                                    </div>
                                    {team.name}
                                    <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                                </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="gap-2 p-2">
                                <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                                    <Plus className="size-4" />
                                </div>
                                <div className="font-medium text-muted-foreground">Add team</div>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarHeader>
    )
}