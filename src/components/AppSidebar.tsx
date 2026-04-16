import { Calendar, Users, LogOut, User as UserIcon, Trophy } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { signOut, user, isAdmin, isProfileComplete } = useAuth();

  const menuItems = [
    ...(!isAdmin ? [{ title: "Profile", url: "/profile", icon: UserIcon, alwaysEnabled: true }] : []),
    { title: "Events", url: "/", icon: Calendar, alwaysEnabled: false },
    ...(!isAdmin ? [{ title: "My Race", url: "/my-race", icon: Trophy, alwaysEnabled: false }] : []),
    ...(isAdmin ? [{ title: "Participants", url: "/participants", icon: Users, alwaysEnabled: true }] : []),
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {!collapsed && (isAdmin ? "Admin Manager" : "Event Portal")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isDisabled = !isAdmin && !isProfileComplete && !item.alwaysEnabled;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild disabled={isDisabled}>
                      <NavLink
                        to={isDisabled ? "#" : item.url}
                        end={item.url === "/"}
                        className={cn(
                          "hover:bg-muted/50",
                          isDisabled && "opacity-50 cursor-not-allowed pointer-events-none"
                        )}
                        activeClassName="bg-muted text-primary font-medium"
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => signOut()}>
              <LogOut className="mr-2 h-4 w-4" />
              {!collapsed && <span>Log Out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
          {!collapsed && user && (
            <div className="px-3 py-2 text-xs text-muted-foreground truncate">
              {user.email}
            </div>
          )}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
