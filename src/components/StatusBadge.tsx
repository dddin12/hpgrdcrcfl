import { cn } from '@/lib/utils';
import { IncidentStatus, IncidentSeverity } from '@/types/investigation';

const statusStyles: Record<IncidentStatus, string> = {
  open: 'bg-critical/15 text-critical',
  'in-progress': 'bg-warning/15 text-warning',
  review: 'bg-info/15 text-info',
  closed: 'bg-success/15 text-success',
};

const severityStyles: Record<IncidentSeverity, string> = {
  low: 'bg-success/15 text-success',
  medium: 'bg-warning/15 text-warning',
  high: 'bg-critical/15 text-critical',
  critical: 'bg-critical/20 text-critical font-semibold',
};

export function StatusBadge({ status }: { status: IncidentStatus }) {
  return (
    <span className={cn('status-badge', statusStyles[status])}>
      <span className={cn('h-1.5 w-1.5 rounded-full', status === 'open' ? 'bg-critical animate-pulse-amber' : status === 'in-progress' ? 'bg-warning' : status === 'review' ? 'bg-info' : 'bg-success')} />
      {status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: IncidentSeverity }) {
  return (
    <span className={cn('status-badge', severityStyles[severity])}>
      {severity.toUpperCase()}
    </span>
  );
}
