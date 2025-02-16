import { ChartCandlestick, HandCoins, Home, Landmark } from "lucide-react";
import NextLink from "next/link";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "./ui/sidebar";

const items = [
  {
    title: "Home",
    href: "/",
    icon: Home,
  },
  {
    title: "Stablecoin Yields",
    href: "/stablecoin-yields",
    icon: Landmark,
  },
  {
    title: "DEX Prices",
    href: "/dex-prices",
    icon: ChartCandlestick,
  },
  {
    title: "Arbitrage Paths",
    href: "/arbitrage-paths",
    icon: HandCoins,
  },
];

export const AppSidebar = () => {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild={true}>
                    <NextLink href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </NextLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
