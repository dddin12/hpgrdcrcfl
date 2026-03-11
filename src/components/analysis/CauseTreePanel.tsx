import { motion } from 'framer-motion';
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
  label: 'HPLC Pump Failure & Solvent Leak',
  type: 'effect',
  children: [
    {
      label: 'Pump seal cracked',
      type: 'immediate',
      children: [
        {
          label: 'Seal exceeded service life',
          type: 'contributing',
          children: [
            { label: 'PM schedule not followed (SOP-MAINT-005)', type: 'root' },
            { label: 'No CMMS automated alerts', type: 'root' },
          ],
        },
        {
          label: 'High operating pressure',
          type: 'contributing',
          children: [
            { label: 'Batch parameters exceeded spec', type: 'root' },
          ],
        },
      ],
    },
  ],
};

const nodeColors = {
  effect: 'border-critical bg-critical/10 text-critical',
  immediate: 'border-warning bg-warning/10 text-warning',
  contributing: 'border-info bg-info/10 text-info',
  root: 'border-primary bg-primary/10 text-primary',
};

const nodeLabels = {
  effect: 'EFFECT',
  immediate: 'IMMEDIATE',
  contributing: 'CONTRIBUTING',
  root: 'ROOT CAUSE',
};

function TreeNodeComponent({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: depth * 0.15 }}
      className="relative"
    >
      <div className={`rounded-lg border p-3 ${nodeColors[node.type]}`}>
        <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">{nodeLabels[node.type]}</p>
        <p className="mt-0.5 text-sm font-medium text-foreground">{node.label}</p>
      </div>
      {node.children && (
        <div className="ml-6 mt-2 space-y-2 border-l-2 border-border pl-4">
          {node.children.map((child, i) => (
            <TreeNodeComponent key={i} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default function CauseTreePanel({ investigation }: Props) {
  return (
    <div>
      <p className="mb-4 text-xs text-muted-foreground">Structured cause hierarchy from effect to root causes</p>
      <TreeNodeComponent node={causeTree} />
    </div>
  );
}
