
import { SidebarTrigger } from "@/components/ui/sidebar"

export function AppHeader() {
  return (
    <header className="h-16 bg-primary flex items-center justify-between px-4 border-b border-primary/20">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="text-primary-foreground hover:bg-primary/80" />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-foreground/20 rounded-full flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">SF</span>
          </div>
          <h1 className="text-primary-foreground font-semibold text-lg">
            FARMÁCIAS São João
          </h1>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <span className="text-primary-foreground text-sm">ramirez.veneral1</span>
        <div className="w-8 h-8 bg-primary-foreground/20 rounded-full flex items-center justify-center">
          <span className="text-primary-foreground text-xs">?</span>
        </div>
        <div className="w-6 h-6 grid grid-cols-3 gap-px">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="w-1 h-1 bg-primary-foreground/60 rounded-sm" />
          ))}
        </div>
        <div className="w-6 h-6 bg-primary-foreground/20 rounded flex items-center justify-center">
          <span className="text-primary-foreground text-xs">→</span>
        </div>
      </div>
    </header>
  )
}
