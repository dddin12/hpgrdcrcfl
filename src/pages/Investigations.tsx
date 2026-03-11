import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, Flame, Zap, FlaskConical } from 'lucide-react';
import { mockInvestigations } from '@/data/mockData';
import { StatusBadge, SeverityBadge } from '@/components/StatusBadge';

const incidentIcons: Record<string, typeof Flame> = {
  'equipment-failure': Zap,
  fire: Flame,
  'chemical-spill': FlaskConical,
  other: AlertTriangle,
};

export default function Investigations() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">All Investigations</h1>
      <div className="glass-card divide-y divide-border">
        {mockInvestigations.map((inv, i) => {
          const Icon = incidentIcons[inv.incidentType] || AlertTriangle;
          return (
            <motion.div key={inv.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
              <Link to={`/investigation/${inv.id}`} className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/50">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
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
      </div>
    </div>
  );
}
