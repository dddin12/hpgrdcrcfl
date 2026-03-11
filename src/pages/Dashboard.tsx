import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, FileSearch, CheckCircle, Clock, TrendingUp, Plus, ArrowRight, Flame, Zap, FlaskConical } from 'lucide-react';
import { mockInvestigations } from '@/data/mockData';
import { StatusBadge, SeverityBadge } from '@/components/StatusBadge';

const stats = [
  { label: 'Open Incidents', value: '2', icon: AlertTriangle, color: 'text-critical', bg: 'bg-critical/10' },
  { label: 'In Progress', value: '1', icon: Clock, color: 'text-warning', bg: 'bg-warning/10' },
  { label: 'Under Review', value: '1', icon: FileSearch, color: 'text-info', bg: 'bg-info/10' },
  { label: 'Closed (MTD)', value: '12', icon: CheckCircle, color: 'text-success', bg: 'bg-success/10' },
];

const incidentIcons: Record<string, typeof Flame> = {
  'equipment-failure': Zap,
  fire: Flame,
  'chemical-spill': FlaskConical,
  other: AlertTriangle,
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Investigation Dashboard</h1>
          <p className="text-sm text-muted-foreground">Root Cause Failure Analysis — Overview</p>
        </div>
        <Link
          to="/new-investigation"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New Investigation
        </Link>
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <motion.div key={stat.label} variants={item} className="glass-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                <p className="mt-1 text-3xl font-bold">{stat.value}</p>
              </div>
              <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="glass-card">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider">Recent Investigations</h2>
              <Link to="/investigations" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="divide-y divide-border">
              {mockInvestigations.map((inv) => {
                const Icon = incidentIcons[inv.incidentType] || AlertTriangle;
                return (
                  <Link key={inv.id} to={`/investigation/${inv.id}`} className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/50">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground">{inv.id}</span>
                        <SeverityBadge severity={inv.severity} />
                      </div>
                      <p className="mt-0.5 truncate text-sm font-medium">{inv.equipment}</p>
                      <p className="text-xs text-muted-foreground">{inv.labName}</p>
                    </div>
                    <StatusBadge status={inv.status} />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Risk Distribution</h3>
            <div className="mt-4 space-y-3">
              {[
                { label: 'Critical', count: 1, total: 3, color: 'bg-critical' },
                { label: 'High', count: 1, total: 3, color: 'bg-warning' },
                { label: 'Medium', count: 1, total: 3, color: 'bg-info' },
              ].map((r) => (
                <div key={r.label}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{r.label}</span>
                    <span className="font-mono font-medium">{r.count}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-muted">
                    <div className={`h-full rounded-full ${r.color}`} style={{ width: `${(r.count / r.total) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Quick Actions</h3>
            <div className="mt-3 space-y-2">
              <Link to="/new-investigation" className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm transition-colors hover:bg-accent">
                <Plus className="h-4 w-4 text-primary" />
                Start New Investigation
              </Link>
              <Link to="/documents" className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm transition-colors hover:bg-accent">
                <TrendingUp className="h-4 w-4 text-info" />
                Upload Documents
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
