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

const nodeColors: Record<string, string> = {
  effect: 'border-destructive bg-destructive/10',
  immediate: 'border-warning bg-warning/10',
  contributing: 'border-info bg-info/10',
  root: 'border-primary bg-primary/10',
};

const nodeLabels: Record<string, string> = {
  effect: 'EFFECT',
  immediate: 'IMMEDIATE',
  contributing: 'CONTRIBUTING',
  root: 'ROOT CAUSE',
};

const nodeDotColors: Record<string, string> = {
  effect: 'bg-destructive',
  immediate: 'bg-warning',
  contributing: 'bg-info',
  root: 'bg-primary',
};

function TreeNodeComponent({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="flex flex-col items-center">
      {/* Node card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: depth * 0.2, type: 'spring', stiffness: 200 }}
        className={`relative rounded-lg border-2 px-4 py-3 text-center max-w-[200px] ${nodeColors[node.type]}`}
      >
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <span className={`h-2 w-2 rounded-full ${nodeDotColors[node.type]}`} />
          <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
            {nodeLabels[node.type]}
          </span>
        </div>
        <p className="text-xs font-medium text-foreground leading-tight">{node.label}</p>
      </motion.div>

      {/* Connector lines + children */}
      {hasChildren && (
        <>
          {/* Vertical line down from parent */}
          <motion.div
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: depth * 0.2 + 0.15, duration: 0.3 }}
            className="w-px h-6 bg-border origin-top"
          />

          {/* Horizontal line spanning children */}
          {node.children!.length > 1 && (
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: depth * 0.2 + 0.25, duration: 0.3 }}
              className="h-px bg-border origin-center"
              style={{ width: `calc(${(node.children!.length - 1) * 100}% / ${node.children!.length} + 50%)` }}
            />
          )}

          {/* Children row */}
          <div className="flex gap-4 items-start">
            {node.children!.map((child, i) => (
              <div key={i} className="flex flex-col items-center">
                {/* Vertical line down to child (only when multiple children) */}
                {node.children!.length > 1 && (
                  <motion.div
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ delay: (depth + 1) * 0.2, duration: 0.2 }}
                    className="w-px h-4 bg-border origin-top"
                  />
                )}
                <TreeNodeComponent node={child} depth={depth + 1} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function CauseTreePanel({ investigation }: Props) {
  return (
    <div className="overflow-x-auto">
      <p className="mb-6 text-xs text-muted-foreground">Structured cause hierarchy from effect to root causes</p>
      <div className="flex justify-center min-w-[600px] pb-4">
        <TreeNodeComponent node={causeTree} />
      </div>
    </div>
  );
}
