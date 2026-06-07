'use client'

import * as React from 'react'
import {
  IconDashboard,
  IconHelp,
  IconInfoCircle,
  IconInnerShadowTop,
  IconSettings,
  IconShield,
} from '@tabler/icons-react'

import { NavMain } from '@/components/dashboard/nav-main'
import { NavSecondary } from '@/components/dashboard/nav-secondary'
import { NavUser } from '@/components/dashboard/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

export function AppSidebar({
  user,
  locale,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: { name: string; email: string; avatar: string }
  locale: string
}) {
  const navMain = [
    {
      title: 'Dashboard',
      url: `/${locale}/dashboard`,
      icon: IconDashboard,
    },
    {
      title: 'Settings',
      url: `/${locale}/settings/profile`,
      icon: IconSettings,
    },
  ]

  const navSecondary = [
    {
      title: 'Help',
      url: `/${locale}/help`,
      icon: IconHelp,
    },
    {
      title: 'Privacy Policy',
      url: `/${locale}/privacy`,
      icon: IconShield,
    },
    {
      title: 'About',
      url: `/${locale}/about`,
      icon: IconInfoCircle,
    },
  ]

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:p-1.5!">
              <a href={`/${locale}/dashboard`}>
                <IconInnerShadowTop className="size-5!" />
                <span className="text-base font-semibold">AgentDock</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} locale={locale} />
      </SidebarFooter>
    </Sidebar>
  )
}
