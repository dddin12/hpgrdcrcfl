import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import type { Investigation, RcfaReport } from '@/types/investigation';
import EmptyAnalysisState from './EmptyAnalysisState';

interface Props {
  investigation: Investigation;
  report?: RcfaReport | null;
}

interface TreeNode {
  label: string;
  type: 'effect' | 'immediate' | 'contributing' | 'root';
  children?: TreeNode[];
}

const styles: Record<string, { border: string; bg: string; dot: string; label: string }> = {
  effect:       { border: 'border-destructive',  bg: 'bg-destructive/10',  dot: 'bg-destructive',  label: 'EFFECT' },
  immediate:    { border: 'border-orange-500',   bg: 'bg-orange-500/10',   dot: 'bg-orange-500',   label: 'IMMEDIATE' },
  contributing: { border: 'border-blue-500',     bg: 'bg-blue-500/10',     dot: 'bg-blue-500',     label: 'CONTRIBUTING' },
  root:         { border: 'border-primary',      bg: 'bg-primary/10',      dot: 'bg-primary',      label: 'ROOT CAUSE' },
};

function Node({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = !!node.children?.length;
  const s = styles[node.type];
  return (
    <div className="flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: depth * 0.1, type: 'spring', stiffness: 200 }}
        onClick={() => hasChildren && setExpanded(!expanded)}
        className={`relative rounded-lg border-2 px-4 py-3 text-center max-w-[240px] ${s.border} ${s.bg} ${hasChildren ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      >
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <span className={`h-2 w-2 rounded-full ${s.dot}`} />
          <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{s.label}</span>
          {hasChildren && (
            <motion.span animate={{ rotate: expanded ? 0 : -90 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </motion.span>
          )}
        </div>
        <p className="text-xs font-medium text-foreground leading-tight">{node.label}</p>
      </motion.div>
      <AnimatePresence>
        {hasChildren && expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }} className="flex flex-col items-center overflow-hidden"
          >
            <div className="w-px h-6 bg-border" />
            {node.children!.length > 1 && (
              <div className="h-px bg-border" style={{ width: `${Math.max((node.children!.length - 1) * 260, 100)}px` }} />
            )}
            <div className="flex gap-6 items-start">
              {node.children!.map((child, i) => (
                <div key={i} className="flex flex-col items-center">
                  {node.children!.length > 1 && <div className="w-px h-4 bg-border" />}
                  <Node node={child} depth={depth + 1} />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function buildTree(inv: Investigation, report: RcfaReport): TreeNode {
  const whys = report.fiveWhys || [];
  // Build a linear chain: effect -> immediate (why#1 because) -> contributing (why#2..n-1) -> root (last)
  const immediate: TreeNode = {
    label: whys[0]?.because || report.immediateCause || 'Immediate cause',
    type: 'immediate',
    children: [],
  };
  let cursor: TreeNode = immediate;
  for (let i = 1; i < whys.length; i++) {
    const isLast = i === whys.length - 1;
    const node: TreeNode = {
      label: whys[i].because,
      type: isLast ? 'root' : 'contributing',
    };
    cursor.children = [node];
    cursor = node;
  }
  // Add sibling contributing branches from keyFactors when available
  const factors = report.keyFactors;
  const extraBranches: TreeNode[] = [];
  (['system','organizational','physical','human'] as const).forEach(k => {
    (factors?.[k] || []).slice(0, 2).forEach(f => {
      extraBranches.push({ label: `[${k}] ${f}`, type: 'contributing' });
    });
  });
  const effect: TreeNode = {
    label: `${inv.equipment} — ${inv.incidentType.replace('-', ' ')}`,
    type: 'effect',
    children: [immediate, ...extraBranches.slice(0, 3)],
  };
  return effect;
}

export default function CauseTreePanel({ investigation, report }: Props) {
  if (!report) return <EmptyAnalysisState label="Cause tree not generated yet" />;
  const tree = buildTree(investigation, report);
  return (
    <div className="overflow-x-auto">
      <p className="mb-2 text-xs text-muted-foreground">Click any node with children to expand or collapse. Hierarchy is derived from the AI 5 Whys chain and key factors.</p>
      <div className="flex justify-center min-w-[700px] pb-4">
        <Node node={tree} />
      </div>
    </div>
  );
}