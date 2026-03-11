import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileSearch, Plus, FileText, Shield, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/investigations', icon: FileSearch, label: 'Investigations' },
  { to: '/new-investigation', icon: Plus, label: 'New Investigation' },
  { to: '/documents', icon: FileText, label: 'Documents' },
  { to: '/risk-matrix', icon: Shield, label: 'Risk Matrix' },
];

export default function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border bg-sidebar">
      <div className="flex h-16 items-center gap-3 border-b border-border px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <Shield className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-wide text-foreground">RCFA</h1>
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Investigation System</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-primary glow-amber'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground'
              )}
            >
              <item.icon className={cn('h-4 w-4', isActive && 'text-primary')} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <NavLink
          to="/settings"
          className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <Settings className="h-4 w-4" />
          Settings
        </NavLink>
      </div>
    </aside>
  );
}
