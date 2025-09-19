
import { useState } from "react"
import { NavLink, useLocation } from "react-router-dom"
import { 
  Settings, 
  Calculator,
  ChevronDown,
  Eye,
  BarChart,
  FileText,
  ShoppingCart,
  MapPin,
  Package,
  Home
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
    title: "Início",
    url: "/",
    icon: Home,
  },
  {
    title: "Vendas",
    url: "/vendas",
    icon: ShoppingCart,
  },
  // {
  //   title: "Solicitação Token",
  //   url: "/solicitacao-tokens",
  //   icon: FileText,
  // },
  {
    title: "Aprovação Token",
    url: "/aprovacao-token",
    icon: Calculator,
  },
  {
    title: "Conf. Desconto Token",
    url: "/configuracao-desconto-token",
    icon: Settings,
    items: [
      // {
      //   title: "Estado",
      //   url: "/configuracao-desconto-token",
      // }, REMOVER
      {
        title: "Loja",
        url: "/configuracao-token-loja",
      },
      {
        title: "Subgrupo",
        url: "/configuracao-desconto-subgrupo",
      },
      // {
      //   title: "Produto",
      //   url: "/configuracao-desconto-token",
      // }, CUIDADO
      {
        title: "Token Estado",
        url: "/token-estado",
      },
      {
        title: "Desconto Produto Estado",
        url: "/desconto-produto-estado",
      },
      {
        title: "Desconto Produto Loja",
        url: "/desconto-produto-loja",
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
