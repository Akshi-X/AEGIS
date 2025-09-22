
import React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarFooter,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { DashboardNav } from '@/components/dashboard-nav';
import { Header } from '@/components/header';
import { Logo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { logout } from '@/lib/actions';
import { cookies } from 'next/headers';


export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const userCookie = cookieStore.get('admin_user');
  const user = userCookie ? JSON.parse(userCookie.value) : { username: 'Admin', role: 'admin' };

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
                  <AvatarImage src={`https://i.pravatar.cc/150?u=${user.username}`} alt={user.username} />
                  <AvatarFallback>
                    <User className="size-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col overflow-hidden">
                    <span className="truncate text-sm font-medium text-sidebar-foreground">{user.username}</span>
                    <span className="truncate text-xs text-sidebar-foreground/70">{user.role}</span>
                </div>
                <form action={logout} className="ml-auto">
                  <Button variant="ghost" size="icon" className="size-7 shrink-0 text-sidebar-foreground/70">
                      <LogOut className="size-4" />
                  </Button>
                </form>
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
