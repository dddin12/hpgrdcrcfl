import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Investigation, CorrectiveAction } from '@/types/investigation';

interface Props {
  investigation: Investigation;
}

const mockActions: CorrectiveAction[] = [
  { id: 'CA-001', description: 'Configure automated PM alerts in CMMS for all HPLC systems per SOP-MAINT-005 Section 4.2', priority: 'high', assignee: 'Maintenance Lead', dueDate: '2026-03-12', status: 'in-progress', sopReference: 'SOP-MAINT-005' },
  { id: 'CA-002', description: 'Replace pump seals on all Agilent 1260 units in Lab B (3 units)', priority: 'high', assignee: 'Service Engineer', dueDate: '2026-03-13', status: 'pending', sopReference: 'Agilent 1260 Service Manual Ch. 7' },
  { id: 'CA-003', description: 'Review and update batch pressure parameters — max PSI should not exceed 400 bar', priority: 'medium', assignee: 'Dr. Sarah Chen', dueDate: '2026-03-15', status: 'pending' },
  { id: 'CA-004', description: 'Conduct refresher training on HPLC pre-run inspection checklist', priority: 'medium', assignee: 'Lab Manager', dueDate: '2026-03-20', status: 'pending' },
  { id: 'CA-005', description: 'Stock critical spare parts (pump seals, check valves) in lab inventory', priority: 'low', assignee: 'Procurement', dueDate: '2026-03-25', status: 'pending' },
];

const statusIcons = {
  pending: <AlertCircle className="h-4 w-4 text-muted-foreground" />,
  'in-progress': <Clock className="h-4 w-4 text-warning" />,
  completed: <CheckCircle className="h-4 w-4 text-success" />,
};

const priorityStyles = {
  high: 'bg-critical/15 text-critical',
  medium: 'bg-warning/15 text-warning',
  low: 'bg-info/15 text-info',
};

export default function CorrectiveActionsPanel({ investigation }: Props) {
  return (
    <div>
      <p className="mb-4 text-xs text-muted-foreground">AI-proposed corrective actions based on root cause analysis and referenced SOPs</p>

      <div className="space-y-3">
        {mockActions.map((action) => (
          <div key={action.id} className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 p-4">
            {statusIcons[action.status]}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">{action.id}</span>
                <span className={`status-badge ${priorityStyles[action.priority]}`}>{action.priority.toUpperCase()}</span>
              </div>
              <p className="mt-1 text-sm">{action.description}</p>
              <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                {action.assignee && <span>Assignee: <span className="text-foreground">{action.assignee}</span></span>}
                {action.dueDate && <span>Due: <span className="text-foreground">{action.dueDate}</span></span>}
                {action.sopReference && <span>Ref: <span className="text-primary">{action.sopReference}</span></span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
