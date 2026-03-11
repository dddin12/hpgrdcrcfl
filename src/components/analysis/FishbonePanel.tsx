import { motion } from 'framer-motion';
import { Investigation } from '@/types/investigation';

interface Props {
  investigation: Investigation;
}

const topCategories = [
  { name: 'Equipment', causes: ['Pump seal wear', 'High operating pressure', 'Aging solvent lines'] },
  { name: 'Process', causes: ['No pre-run inspection', 'Batch pressure exceeded spec', 'Manual override used'] },
  { name: 'People', causes: ['Operator unfamiliar with warning signs', 'Shift handover gaps'] },
];

const bottomCategories = [
  { name: 'Maintenance', causes: ['PM overdue 3 weeks', 'No CMMS alerts', 'Spare parts not stocked'] },
  { name: 'Environment', causes: ['High ambient temperature', 'Vibration from nearby equipment'] },
  { name: 'Management', causes: ['No maintenance KPIs tracked', 'Understaffed maintenance team'] },
];

const SPINE_Y = 200;
const SPINE_X_START = 40;
const SPINE_X_END = 820;
const BONE_POSITIONS = [160, 400, 640]; // x positions where bones meet spine
const BONE_LENGTH = 140; // vertical length of each main bone
const SUB_BONE_OFFSET = 20; // horizontal offset for sub-bones

function drawPath(d: string, delay: number, color: string) {
  return (
    <motion.path
      d={d}
      stroke={color}
      strokeWidth={2}
      fill="none"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.5, delay }}
    />
  );
}

export default function FishbonePanel({ investigation }: Props) {
  return (
    <div className="overflow-x-auto">
      <p className="mb-4 text-xs text-muted-foreground">
        Ishikawa (Fishbone) diagram — categorized potential causes for:{' '}
        <span className="font-medium text-foreground">{investigation.equipment}</span>
      </p>

      <div className="relative min-w-[900px]" style={{ height: 440 }}>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 900 440" preserveAspectRatio="xMidYMid meet">
          {/* Main spine */}
          {drawPath(`M ${SPINE_X_START} ${SPINE_Y} L ${SPINE_X_END} ${SPINE_Y}`, 0, 'hsl(var(--border))')}

          {/* Fish head arrow */}
          {drawPath(`M ${SPINE_X_END} ${SPINE_Y} L ${SPINE_X_END - 15} ${SPINE_Y - 12} M ${SPINE_X_END} ${SPINE_Y} L ${SPINE_X_END - 15} ${SPINE_Y + 12}`, 0.3, 'hsl(var(--destructive))')}

          {/* Top bones (angled toward the right) */}
          {BONE_POSITIONS.map((x, i) => {
            const topY = SPINE_Y - BONE_LENGTH;
            const category = topCategories[i];
            return (
              <g key={`top-${i}`}>
                {/* Main diagonal bone */}
                {drawPath(`M ${x} ${SPINE_Y} L ${x + 40} ${topY}`, 0.2 + i * 0.15, 'hsl(var(--primary))')}
                {/* Sub-bones for each cause */}
                {category.causes.map((_, ci) => {
                  const cy = SPINE_Y - ((ci + 1) * (BONE_LENGTH / (category.causes.length + 1)));
                  const cx = x + (40 * (BONE_LENGTH - (SPINE_Y - cy)) / BONE_LENGTH);
                  return drawPath(
                    `M ${cx} ${cy} L ${cx - SUB_BONE_OFFSET - 30} ${cy - 4}`,
                    0.4 + i * 0.15 + ci * 0.08,
                    'hsl(var(--muted-foreground) / 0.5)'
                  );
                })}
              </g>
            );
          })}

          {/* Bottom bones */}
          {BONE_POSITIONS.map((x, i) => {
            const bottomY = SPINE_Y + BONE_LENGTH;
            const category = bottomCategories[i];
            return (
              <g key={`bottom-${i}`}>
                {drawPath(`M ${x} ${SPINE_Y} L ${x + 40} ${bottomY}`, 0.2 + i * 0.15, 'hsl(var(--primary))')}
                {category.causes.map((_, ci) => {
                  const cy = SPINE_Y + ((ci + 1) * (BONE_LENGTH / (category.causes.length + 1)));
                  const cx = x + (40 * (cy - SPINE_Y) / BONE_LENGTH);
                  return drawPath(
                    `M ${cx} ${cy} L ${cx - SUB_BONE_OFFSET - 30} ${cy + 4}`,
                    0.4 + i * 0.15 + ci * 0.08,
                    'hsl(var(--muted-foreground) / 0.5)'
                  );
                })}
              </g>
            );
          })}
        </svg>

        {/* Effect (fish head) label */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="absolute rounded-lg border-2 border-destructive bg-destructive/10 px-3 py-2 text-center"
          style={{ right: 10, top: SPINE_Y - 28, width: 70 }}
        >
          <p className="text-[9px] font-bold uppercase tracking-wider text-destructive">Effect</p>
          <p className="text-[10px] font-semibold leading-tight mt-0.5">Pump Failure</p>
        </motion.div>

        {/* Top category labels + causes */}
        {topCategories.map((cat, i) => {
          const x = BONE_POSITIONS[i];
          const topY = SPINE_Y - BONE_LENGTH;
          return (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.15 }}
              className="absolute"
              style={{ left: x - 10, top: topY - 50, width: 140 }}
            >
              <p className="text-xs font-bold uppercase tracking-wider text-primary text-center">{cat.name}</p>
              <ul className="mt-1 space-y-0.5">
                {cat.causes.map((cause, ci) => (
                  <motion.li
                    key={cause}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 + i * 0.15 + ci * 0.1 }}
                    className="text-[10px] text-muted-foreground leading-tight"
                  >
                    • {cause}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          );
        })}

        {/* Bottom category labels + causes */}
        {bottomCategories.map((cat, i) => {
          const x = BONE_POSITIONS[i];
          const bottomY = SPINE_Y + BONE_LENGTH;
          return (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.15 }}
              className="absolute"
              style={{ left: x - 10, top: bottomY + 10, width: 140 }}
            >
              <p className="text-xs font-bold uppercase tracking-wider text-primary text-center">{cat.name}</p>
              <ul className="mt-1 space-y-0.5">
                {cat.causes.map((cause, ci) => (
                  <motion.li
                    key={cause}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 + i * 0.15 + ci * 0.1 }}
                    className="text-[10px] text-muted-foreground leading-tight"
                  >
                    • {cause}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
