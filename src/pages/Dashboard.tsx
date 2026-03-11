import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, FileSearch, CheckCircle, Clock, TrendingUp, Plus, ArrowRight, Flame, Zap, FlaskConical } from 'lucide-react';
import { mockInvestigations } from '@/data/mockData';
import { StatusBadge, SeverityBadge } from '@/components/StatusBadge';

const incidentIcons: Record<string, typeof Flame> = {
  'equipment-failure': Zap,
  fire: Flame,
  'chemical-spill': FlaskConical,
  other: AlertTriangle,
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

function computeStats() {
  const counts = { open: 0, inProgress: 0, review: 0, closed: 0 };
  mockInvestigations.forEach((inv) => {
    if (inv.status === 'open') counts.open++;
    else if (inv.status === 'in-progress') counts.inProgress++;
    else if (inv.status === 'review') counts.review++;
    else if (inv.status === 'closed') counts.closed++;
  });
  return [
    { label: 'Open Incidents', value: String(counts.open), icon: AlertTriangle, color: 'text-critical', bg: 'bg-critical/10' },
    { label: 'In Progress', value: String(counts.inProgress), icon: Clock, color: 'text-warning', bg: 'bg-warning/10' },
    { label: 'Under Review', value: String(counts.review), icon: FileSearch, color: 'text-info', bg: 'bg-info/10' },
    { label: 'Closed', value: String(counts.closed), icon: CheckCircle, color: 'text-success', bg: 'bg-success/10' },
  ];
}

export default function Dashboard() {
  const stats = computeStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-r from-card via-card to-muted/50 p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Investigation Dashboard</h1>
            <p className="text-sm text-muted-foreground">Root Cause Failure Analysis — HP Green R&D Centre</p>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              to="/new-investigation"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              New Investigation
            </Link>
          </motion.div>
        </div>
        <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-info/10 blur-3xl" />
      </motion.div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <motion.div
            key={stat.label}
            variants={item}
            whileHover={{ scale: 1.03, y: -4 }}
            className="glass-card p-5 cursor-default transition-shadow hover:shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                <motion.p
                  className="mt-1 text-3xl font-bold"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, type: 'spring' }}
                >
                  {stat.value}
                </motion.p>
              </div>
              <motion.div
                className={`flex h-11 w-11 items-center justify-center rounded-lg ${stat.bg}`}
                whileHover={{ rotate: 10 }}
              >
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </motion.div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="glass-card">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider">Recent Investigations</h2>
              <Link to="/investigations" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="divide-y divide-border">
              {mockInvestigations.map((inv, i) => {
                const Icon = incidentIcons[inv.incidentType] || AlertTriangle;
                return (
                  <motion.div
                    key={inv.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                  >
                    <Link to={`/investigation/${inv.id}`} className="flex items-center gap-4 p-4 transition-all hover:bg-muted/50 hover:pl-5">
                      <motion.div
                        whileHover={{ rotate: 15 }}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted"
                      >
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      </motion.div>
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
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>

        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Risk Distribution</h3>
            <div className="mt-4 space-y-3">
              {(() => {
                const total = mockInvestigations.length;
                const critical = mockInvestigations.filter(i => i.severity === 'critical').length;
                const high = mockInvestigations.filter(i => i.severity === 'high').length;
                const medium = mockInvestigations.filter(i => i.severity === 'medium').length;
                return [
                  { label: 'Critical', count: critical, total, color: 'bg-critical' },
                  { label: 'High', count: high, total, color: 'bg-warning' },
                  { label: 'Medium', count: medium, total, color: 'bg-info' },
                ];
              })().map((r) => (
                <div key={r.label}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{r.label}</span>
                    <span className="font-mono font-medium">{r.count}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${r.color}`}
                      initial={{ width: 0 }}
                      animate={{ width: r.total > 0 ? `${(r.count / r.total) * 100}%` : '0%' }}
                      transition={{ delay: 0.8, duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Quick Actions</h3>
            <div className="mt-3 space-y-2">
              {[
                { to: '/new-investigation', icon: Plus, label: 'Start New Investigation', color: 'text-primary' },
                { to: '/documents', icon: TrendingUp, label: 'Upload Documents', color: 'text-info' },
              ].map((action) => (
                <motion.div key={action.to} whileHover={{ x: 4 }}>
                  <Link to={action.to} className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm transition-colors hover:bg-accent">
                    <action.icon className={`h-4 w-4 ${action.color}`} />
                    {action.label}
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
