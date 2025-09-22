import React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { DashboardNav } from '@/components/dashboard-nav';
import { Header } from '@/components/header';
import { Logo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Settings, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <Sidebar variant="sidebar" collapsible="icon">
        <SidebarHeader className="h-16 items-center gap-3 border-b border-sidebar-border p-3">
          <Button variant="ghost" size="icon" className="size-9 shrink-0">
            <Logo className="size-6 text-sidebar-primary" />
          </Button>
          <span className="truncate text-lg font-semibold text-sidebar-foreground">ExamLab</span>
        </SidebarHeader>
        <SidebarContent>
          <DashboardNav />
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border p-2">
            <div className="flex items-center gap-3 rounded-md p-2 hover:bg-sidebar-accent">
                <Avatar className="size-8">
                  <AvatarImage src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="Admin" />
                  <AvatarFallback>
                    <User className="size-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col overflow-hidden">
                    <span className="truncate text-sm font-medium text-sidebar-foreground">Admin</span>
                    <span className="truncate text-xs text-sidebar-foreground/70">admin@examlab.com</span>
                </div>
                <Button variant="ghost" size="icon" className="ml-auto size-7 shrink-0 text-sidebar-foreground/70">
                    <LogOut className="size-4" />
                </Button>
            </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <Header />
        <main className="min-h-[calc(100dvh-4rem)] p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
