import { motion } from 'framer-motion';
import { Investigation } from '@/types/investigation';

interface Props {
  investigation: Investigation;
}

const categories = [
  { name: 'Equipment', color: 'text-info', causes: ['Pump seal wear', 'High operating pressure', 'Aging solvent lines'] },
  { name: 'Process', color: 'text-primary', causes: ['No pre-run inspection', 'Batch pressure exceeded spec', 'Manual override used'] },
  { name: 'People', color: 'text-success', causes: ['Operator unfamiliar with warning signs', 'Shift handover gaps'] },
  { name: 'Maintenance', color: 'text-critical', causes: ['PM overdue 3 weeks', 'No CMMS alerts', 'Spare parts not stocked'] },
  { name: 'Environment', color: 'text-warning', causes: ['High ambient temperature', 'Vibration from nearby equipment'] },
  { name: 'Management', color: 'text-muted-foreground', causes: ['No maintenance KPIs tracked', 'Understaffed maintenance team'] },
];

export default function FishbonePanel({ investigation }: Props) {
  return (
    <div>
      <p className="mb-4 text-xs text-muted-foreground">Ishikawa (Fishbone) diagram — categorized potential causes for: <span className="font-medium text-foreground">{investigation.equipment}</span></p>

      {/* Simplified fishbone as structured cards */}
      <div className="relative">
        {/* Central spine */}
        <div className="mb-6 rounded-lg border border-critical/30 bg-critical/5 p-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-critical">Effect</p>
          <p className="mt-1 text-sm font-medium">HPLC Pump Failure & Solvent Leak</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-lg border border-border bg-muted/30 p-4"
            >
              <h4 className={`text-xs font-bold uppercase tracking-wider ${cat.color}`}>{cat.name}</h4>
              <ul className="mt-2 space-y-1.5">
                {cat.causes.map((cause) => (
                  <li key={cause} className="flex items-start gap-2 text-sm">
                    <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current ${cat.color}`} />
                    {cause}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
