import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, Flame, Zap, FlaskConical } from 'lucide-react';
import { mockInvestigations } from '@/data/mockData';
import { StatusBadge, SeverityBadge } from '@/components/StatusBadge';
import hpLogo from '@/assets/hp-logo.png';

const incidentIcons: Record<string, typeof Flame> = {
  'equipment-failure': Zap,
  fire: Flame,
  'chemical-spill': FlaskConical,
  other: AlertTriangle,
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } };

export default function Investigations() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <img src={hpLogo} alt="HP" className="h-8 w-auto" />
        <h1 className="text-2xl font-bold">All Investigations</h1>
      </div>
      <motion.div variants={container} initial="hidden" animate="show" className="glass-card divide-y divide-border">
        {mockInvestigations.map((inv) => {
          const Icon = incidentIcons[inv.incidentType] || AlertTriangle;
          return (
            <motion.div key={inv.id} variants={item}>
              <Link to={`/investigation/${inv.id}`} className="flex items-center gap-4 p-4 transition-all hover:bg-muted/50 hover:pl-5">
                <motion.div whileHover={{ rotate: 15, scale: 1.1 }} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </motion.div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{inv.id}</span>
                    <SeverityBadge severity={inv.severity} />
                  </div>
                  <p className="mt-0.5 text-sm font-medium">{inv.equipment}</p>
                  <p className="text-xs text-muted-foreground">{inv.labName} • {inv.operator} • {new Date(inv.dateTime).toLocaleDateString()}</p>
                </div>
                <StatusBadge status={inv.status} />
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
