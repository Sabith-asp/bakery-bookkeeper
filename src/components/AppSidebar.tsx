import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getNavItems } from "@/config/navItems";
import FynloIcon from "@/components/FynloIcon";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const AppSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isSuperAdmin, hasModule } = useAuth();

  const navItems = getNavItems({ isSuperAdmin, hasModule });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-4">
        <div className="flex items-center gap-2.5">
          <FynloIcon size={32} className="shrink-0" />
          <span className="font-display text-lg font-bold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            Fynlo
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(({ path, label, icon: Icon }) => {
                const isActive =
                  path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);
                return (
                  <SidebarMenuItem key={path}>
                    <SidebarMenuButton isActive={isActive} tooltip={label} onClick={() => navigate(path)}>
                      <Icon />
                      <span>{label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;
