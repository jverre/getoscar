"use client";

import Link from 'next/link';
import { TrashIcon } from 'lucide-react';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from "@/components/ui/sidebar"
import { useApp } from '@/context/appContext'
import { Button } from "@/components/ui/button"
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";

type NavItem = {
  id: string;
  title: string;
  url: string;
  isActive?: boolean;
};

export function NavMain() {
  const { selectedTeamId } = useApp();
  
  const conversations = useQuery(
    api.conversations.getTeamConversations, 
    selectedTeamId ? { teamId: selectedTeamId as Id<"teams"> } : "skip"
  );

  const deleteConversation = useMutation(api.conversations.deleteConversation);

  const handleDeleteConversation = async (idToDelete: Id<"conversations">) => {
    await deleteConversation({ conversationId: idToDelete });
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Recent chats</SidebarGroupLabel>
      <SidebarMenu>
        {(conversations ?? []).map((item) => (
          <SidebarMenuItem key={item._id}>
            <div className="relative hover:[&>button]:opacity-100">
              <SidebarMenuButton asChild tooltip={item.title} className="flex-grow pr-8">
                <Link href={`c/${item._id}`} className="flex items-center justify-between w-full">
                  <span className="truncate">{item.title}</span>
                </Link>
              </SidebarMenuButton>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDeleteConversation(item._id);
                }}
                aria-label={`Delete chat ${item.title}`}
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
