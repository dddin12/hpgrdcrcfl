import { motion } from 'framer-motion';
import { Investigation } from '@/types/investigation';

interface Props {
  investigation: Investigation;
}

interface Category {
  name: string;
  causes: string[];
  color: string;
  bgColor: string;
  borderColor: string;
  dotColor: string;
}

const topCategories: Category[] = [
  {
    name: 'Equipment',
    causes: ['Eddy current absorber wear', 'Coolant flow sensor drift', 'Aging drive shaft coupling'],
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/40',
    dotColor: 'bg-red-500',
  },
  {
    name: 'Process',
    causes: ['No pre-test calibration check', 'WLTC cycle parameters exceeded spec', 'Manual torque override used'],
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/40',
    dotColor: 'bg-blue-500',
  },
  {
    name: 'People',
    causes: ['Operator unfamiliar with thermal warning signs', 'Shift handover gaps on dyno status'],
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/40',
    dotColor: 'bg-green-500',
  },
];

const bottomCategories: Category[] = [
  {
    name: 'Maintenance',
    causes: ['PM overdue 3 weeks on absorber', 'No CMMS alerts for dyno', 'Coolant hoses not inspected'],
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/40',
    dotColor: 'bg-orange-500',
  },
  {
    name: 'Environment',
    causes: ['High ambient cell temperature', 'Vibration from adjacent test cell'],
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/10',
    borderColor: 'border-teal-500/40',
    dotColor: 'bg-teal-500',
  },
  {
    name: 'Management',
    causes: ['No dyno utilization KPIs', 'Understaffed test cell team', 'Budget cuts on spare parts'],
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/40',
    dotColor: 'bg-purple-500',
  },
];

function CategoryBone({ cat, index, side }: { cat: Category; index: number; side: 'top' | 'bottom' }) {
  const delay = 0.2 + index * 0.15;

  return (
    <motion.div
      initial={{ opacity: 0, y: side === 'top' ? 20 : -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="flex-1 min-w-[140px] flex flex-col items-center gap-2"
    >
      {side === 'bottom' && (
        <div className={`w-px h-8 ${cat.dotColor} opacity-40`} />
      )}
      <div className={`rounded-lg border-2 ${cat.borderColor} ${cat.bgColor} px-3 py-2 w-full max-w-[180px]`}>
        <div className="flex items-center gap-1.5 mb-2">
          <span className={`h-2.5 w-2.5 rounded-full ${cat.dotColor}`} />
          <span className={`text-[10px] font-bold uppercase tracking-widest ${cat.color}`}>
            {cat.name}
          </span>
        </div>
        <div className="space-y-1">
          {cat.causes.map((cause, ci) => (
            <motion.div
              key={cause}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + 0.1 + ci * 0.08 }}
              className={`text-[10px] leading-tight px-2 py-1 rounded ${cat.bgColor} border ${cat.borderColor} text-muted-foreground`}
            >
              {cause}
            </motion.div>
          ))}
        </div>
      </div>
      {side === 'top' && (
        <div className={`w-px h-8 ${cat.dotColor} opacity-40`} />
      )}
    </motion.div>
  );
}

export default function FishbonePanel({ investigation }: Props) {
  return (
    <div className="overflow-x-auto">
      <p className="mb-4 text-xs text-muted-foreground">
        Ishikawa (Fishbone) diagram — categorized potential causes for:{' '}
        <span className="font-medium text-foreground">{investigation.equipment}</span>
      </p>

      <div className="min-w-[600px] pb-4">
        {/* Top categories */}
        <div className="flex gap-3 justify-center px-4">
          {topCategories.map((cat, i) => (
            <CategoryBone key={cat.name} cat={cat} index={i} side="top" />
          ))}
        </div>

        {/* Central spine */}
        <div className="relative flex items-center mx-4 my-0">
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.6 }}
            className="flex-1 h-1 bg-gradient-to-r from-muted via-primary/60 to-destructive rounded-full origin-left"
          />
          {/* Fish head / Effect */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="ml-2 shrink-0 rounded-lg border-2 border-destructive bg-destructive/10 px-4 py-2 text-center"
          >
            <p className="text-[9px] font-bold uppercase tracking-wider text-destructive">Effect</p>
            <p className="text-xs font-semibold leading-tight mt-0.5 text-foreground">
              Dyno Failure
            </p>
          </motion.div>
        </div>

        {/* Bottom categories */}
        <div className="flex gap-3 justify-center px-4">
          {bottomCategories.map((cat, i) => (
            <CategoryBone key={cat.name} cat={cat} index={i} side="bottom" />
          ))}
        </div>
      </div>
    </div>
  );
}
