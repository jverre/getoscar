"use client"

import * as React from "react"
import { useRouter } from "next/navigation";
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
import { useApp } from '@/context/appContext';
import { getUserTeams } from "@/../convex/teams";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";

export function NavHeader() {
    const router = useRouter();
    const { isMobile } = useUISidebar()
    const {
        selectedTeamId,
        setSelectedTeamId
    } = useApp()

    const user = useQuery(api.users.viewer);
    const teams = useQuery(api.teams.getUserTeams, { 
        userId: user?._id 
    }) ?? [];

    const handleNewChat = async () => {
        router.push(`/`);
    };

    const selectedTeam = teams.find(team => team._id === selectedTeamId);

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
                            <Button variant="ghost" size="icon" disabled title="Sign in to create a chat">
                                <SquarePen className="size-4" />
                            </Button>
                        </div>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
        )
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
                                            {selectedTeam?.name ?? 'Select Team'}
                                        </span>
                                    </div>
                                    <ChevronsUpDown className="ml-auto size-4 shrink-0 opacity-50" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <Button variant="ghost" size="icon" onClick={handleNewChat}>
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
                                    key={team._id}
                                    onClick={() => setSelectedTeamId(team._id)}
                                    className="gap-2 p-2"
                                >
                                    <div className="flex size-6 items-center justify-center rounded-sm border">
                                        <LifeBuoy className="size-4 shrink-0" />
                                    </div>
                                    {team.name}
                                </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="gap-2 p-2" disabled>
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