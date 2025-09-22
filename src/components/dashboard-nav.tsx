
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ClipboardList, FileQuestion, LayoutDashboard, Monitor, Users, Settings, History } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { SidebarMenuSkeleton } from './ui/sidebar';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/pcs', icon: Monitor, label: 'PCs' },
  { href: '/dashboard/students', icon: Users, label: 'Students' },
  { href: '/dashboard/questions', icon: FileQuestion, label: 'Questions' },
  { href: '/dashboard/exams', icon: ClipboardList, label: 'Exams' },
  { href: '/dashboard/logs', icon: History, label: 'Logs'},
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

export function DashboardNav() {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="flex-1 overflow-auto p-2">
       <SidebarMenu>
        {isClient ? (
          navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref>
                <SidebarMenuButton
                  as="a"
                  variant="default"
                  isActive={pathname === item.href}
                  className={cn(
                    'text-sidebar-foreground/80 hover:text-sidebar-foreground',
                    pathname === item.href &&
                      'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 hover:text-sidebar-primary-foreground'
                  )}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))
        ) : (
          <>
            {navItems.map((item) => <SidebarMenuSkeleton key={item.href} showIcon />)}
          </>
        )}
      </SidebarMenu>
    </div>
  );
}
