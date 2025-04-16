import { href, Link, NavLink } from "react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "~/components/ui/sidebar";

const NAV_LINKS = [
  { to: href("/"), label: "Home" },
  { to: href("/resource"), label: "Resource Search" },
  { to: href("/subject"), label: "Subject Search" },
  { to: href("/action"), label: "Action Search" },
];

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>AuthZEN Search</SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {NAV_LINKS.map(({ to, label }) => (
            <SidebarMenuItem key={to}>
              <NavLink to={to}>
                {({ isActive }) => (
                  <SidebarMenuButton asChild isActive={isActive}>
                    <Link to={to}>{label}</Link>
                  </SidebarMenuButton>
                )}
              </NavLink>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <NavLink to={href("/data")}>
              {({ isActive }) => (
                <SidebarMenuButton asChild isActive={isActive}>
                  <Link to={href("/data")}>Sample Data</Link>
                </SidebarMenuButton>
              )}
            </NavLink>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
