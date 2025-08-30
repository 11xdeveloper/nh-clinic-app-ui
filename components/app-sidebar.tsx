"use client";

import type * as React from "react";
import { User, Users, QrCode, LogOut, UserCheck, Activity } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "./ui/sidebar";
import { Button } from "./ui/button";
import { logout } from "../lib/actions";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: {
    id: number;
    name: string;
    email: string;
    role: "ADMIN" | "VOLUNTEER";
  };
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const pathname = usePathname();

  const generalPages = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Activity,
    },
    {
      title: "Scan Patient",
      url: "/dashboard/scan",
      icon: QrCode,
    },
    {
      title: "Patients",
      url: "/dashboard/patients",
      icon: Users,
    },
  ];

  const adminPages = [
    {
      title: "Verify Users",
      url: "/admin/verify-users",
      icon: UserCheck,
    },
  ];

  const handleLogout = async () => {
    await logout();
  };

  return (
    <Sidebar {...props}>
      <SidebarHeader className="border-sidebar-border flex items-center border-b p-4">
        <div className="flex items-center gap-3">
          <span className="text-xl font-semibold">
            <span className="text-red-600">NH</span> Clinic
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>General</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {generalPages.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user.role === "ADMIN" && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminPages.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={pathname === item.url}>
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-sidebar-border border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex flex-col gap-2 p-2">
              <div className="flex items-center gap-2">
                <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-full">
                  <User className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{user.name}</span>
                  <span className="text-muted-foreground text-xs">
                    {user.email.length < 30
                      ? user.email
                      : `${user.email.slice(0, 27)}...`}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                    user.role === "ADMIN"
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  }`}
                >
                  {user.role}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="h-8 w-8 p-0"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="sr-only">Logout</span>
                </Button>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
