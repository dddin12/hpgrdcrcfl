import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Investigation } from '@/types/investigation';

interface Props {
  investigation: Investigation;
}

interface TreeNode {
  label: string;
  type: 'root' | 'contributing' | 'immediate' | 'effect';
  children?: TreeNode[];
}

const causeTree: TreeNode = {
  label: 'Transient Dyno Failure & Emergency Shutdown',
  type: 'effect',
  children: [
    {
      label: 'Eddy current absorber overheated',
      type: 'immediate',
      children: [
        {
          label: 'Coolant flow insufficient',
          type: 'contributing',
          children: [
            { label: 'Coolant flow sensor drift — uncalibrated for 6 months', type: 'root' },
            { label: 'Coolant pump impeller cavitation', type: 'root' },
          ],
        },
        {
          label: 'Absorber load exceeded rated capacity',
          type: 'contributing',
          children: [
            { label: 'WLTC cycle torque demand exceeded absorber spec', type: 'root' },
            { label: 'Manual torque override bypassed safety limiter', type: 'root' },
          ],
        },
      ],
    },
    {
      label: 'Abnormal torque oscillations detected',
      type: 'immediate',
      children: [
        {
          label: 'Drive shaft coupling misalignment',
          type: 'contributing',
          children: [
            { label: 'Coupling not re-aligned after engine swap (SOP-DYNO-003 not followed)', type: 'root' },
          ],
        },
      ],
    },
  ],
};

const nodeStyles: Record<string, { border: string; bg: string; dot: string; label: string }> = {
  effect: { border: 'border-destructive', bg: 'bg-destructive/10', dot: 'bg-destructive', label: 'EFFECT' },
  immediate: { border: 'border-orange-500', bg: 'bg-orange-500/10', dot: 'bg-orange-500', label: 'IMMEDIATE' },
  contributing: { border: 'border-blue-500', bg: 'bg-blue-500/10', dot: 'bg-blue-500', label: 'CONTRIBUTING' },
  root: { border: 'border-primary', bg: 'bg-primary/10', dot: 'bg-primary', label: 'ROOT CAUSE' },
};

function TreeNodeComponent({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  const style = nodeStyles[node.type];

  return (
    <div className="flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: depth * 0.15, type: 'spring', stiffness: 200 }}
        onClick={() => hasChildren && setExpanded(!expanded)}
        className={`relative rounded-lg border-2 px-4 py-3 text-center max-w-[220px] ${style.border} ${style.bg} ${hasChildren ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      >
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <span className={`h-2 w-2 rounded-full ${style.dot}`} />
          <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
            {style.label}
          </span>
          {hasChildren && (
            <motion.span
              animate={{ rotate: expanded ? 0 : -90 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </motion.span>
          )}
        </div>
        <p className="text-xs font-medium text-foreground leading-tight">{node.label}</p>
      </motion.div>

      <AnimatePresence>
        {hasChildren && expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center overflow-hidden"
          >
            <div className="w-px h-6 bg-border" />

            {node.children!.length > 1 && (
              <div
                className="h-px bg-border"
                style={{ width: `${Math.max((node.children!.length - 1) * 240, 100)}px` }}
              />
            )}

            <div className="flex gap-6 items-start">
              {node.children!.map((child, i) => (
                <div key={i} className="flex flex-col items-center">
                  {node.children!.length > 1 && <div className="w-px h-4 bg-border" />}
                  <TreeNodeComponent node={child} depth={depth + 1} />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CauseTreePanel({ investigation }: Props) {
  return (
    <div className="overflow-x-auto">
      <p className="mb-2 text-xs text-muted-foreground">Click any node with children to expand/collapse. Structured cause hierarchy from effect to root causes.</p>
      <div className="flex justify-center min-w-[700px] pb-4">
        <TreeNodeComponent node={causeTree} />
      </div>
    </div>
  );
}
