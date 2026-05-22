import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Plus, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import hpLogo from '@/assets/hp-logo.png';
import rndLogo from '@/assets/rnd-logo.png';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/new-investigation', icon: Plus, label: 'New Investigation' },
];

export default function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border bg-sidebar">
      <div className="flex h-20 items-center gap-3 border-b border-border px-4">
        <img src={hpLogo} alt="HP Logo" className="h-12 w-auto object-contain" />
        <div className="h-10 w-px bg-border" />
        <img src={rndLogo} alt="HP Green R&D Centre" className="h-12 w-auto object-contain" />
      </div>

      <div className="px-4 py-3 border-b border-border">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">RCFA Investigation System</p>
        <p className="text-[9px] text-muted-foreground">Root Cause Failure Analysis</p>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item, i) => {
          const isActive = location.pathname === item.to;
          return (
            <motion.div
              key={item.to}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <NavLink
                to={item.to}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-sidebar-accent text-primary glow-amber scale-[1.02]'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground hover:translate-x-1'
                )}
              >
                <item.icon className={cn('h-4 w-4 transition-colors', isActive && 'text-primary')} />
                {item.label}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-indicator"
                    className="ml-auto h-1.5 w-1.5 rounded-full bg-primary"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </NavLink>
            </motion.div>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <NavLink
          to="/settings"
          className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          <Settings className="h-4 w-4" />
          Settings
        </NavLink>
      </div>
    </aside>
  );
}
