
import { useState } from "react"
import { NavLink, useLocation } from "react-router-dom"
import { 
  Settings, 
  Calculator,
  ChevronDown,
  Eye
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

const menuItems = [
  {
    title: "Emulador",
    url: "/emulador",
    icon: Calculator,
  },
  {
    title: "Conf. Desconto Token",
    icon: Settings,
    items: [
      {
        title: "Desconto Subgrupo",
        url: "/configuracao-desconto-subgrupo",
      },
      {
        title: "Token Loja",
        url: "/configuracao-token-loja",
      },
    ],
  },
  {
    title: "Visualização Tokens",
    url: "/visualizacao-tokens",
    icon: Eye,
  },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname
  const [openGroups, setOpenGroups] = useState<string[]>([])

  const isActive = (path: string) => currentPath === path

  const toggleGroup = (groupTitle: string) => {
    setOpenGroups(prev => 
      prev.includes(groupTitle) 
        ? prev.filter(g => g !== groupTitle)
        : [...prev, groupTitle]
    )
  }

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70">
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.items ? (
                    <Collapsible
                      open={openGroups.includes(item.title)}
                      onOpenChange={() => toggleGroup(item.title)}
                    >
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton 
                          className="w-full justify-between hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        >
                          <div className="flex items-center gap-2">
                            <item.icon className="w-4 h-4" />
                            {state !== "collapsed" && <span>{item.title}</span>}
                          </div>
                          {state !== "collapsed" && (
                            <ChevronDown 
                              className={`w-4 h-4 transition-transform ${
                                openGroups.includes(item.title) ? 'rotate-180' : ''
                              }`} 
                            />
                          )}
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild isActive={isActive(subItem.url)}>
                                <NavLink 
                                  to={subItem.url}
                                  className={({ isActive }) => 
                                    `flex items-center gap-2 ${isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''}`
                                  }
                                >
                                  <span>{subItem.title}</span>
                                </NavLink>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </Collapsible>
                  ) : (
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <NavLink 
                        to={item.url} 
                        className={({ isActive }) => 
                          `flex items-center gap-2 ${isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''}`
                        }
                      >
                        <item.icon className="w-4 h-4" />
                        {state !== "collapsed" && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
