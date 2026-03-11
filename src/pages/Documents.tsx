import { motion } from 'framer-motion';
import { FileText, Upload, BookOpen, Wrench, ShieldCheck, Settings2 } from 'lucide-react';
import { mockDocuments } from '@/data/mockData';
import rndLogo from '@/assets/rnd-logo.png';

const typeIcons: Record<string, typeof FileText> = {
  sop: BookOpen,
  'equipment-manual': Wrench,
  'safety-manual': ShieldCheck,
  maintenance: Settings2,
};

const typeLabels: Record<string, string> = {
  sop: 'SOP',
  'equipment-manual': 'Equipment Manual',
  'safety-manual': 'Safety Manual',
  maintenance: 'Maintenance',
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

export default function Documents() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={rndLogo} alt="R&D" className="h-8 w-auto" />
          <div>
            <h1 className="text-2xl font-bold">Document Intelligence</h1>
            <p className="text-sm text-muted-foreground">Upload and manage SOPs, manuals, and procedures for AI-powered analysis</p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          <Upload className="h-4 w-4" />
          Upload Document
        </motion.button>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card"
      >
        <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 p-10 transition-colors hover:border-primary/40">
          <div className="text-center">
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }}>
              <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
            </motion.div>
            <p className="mt-3 text-sm font-medium">Drop documents here to upload</p>
            <p className="mt-1 text-xs text-muted-foreground">SOPs, equipment manuals, safety guides, maintenance procedures</p>
            <p className="mt-1 text-xs text-muted-foreground">PDF, DOCX, TXT — max 20MB each</p>
          </div>
        </div>
      </motion.div>

      <div className="glass-card">
        <div className="border-b border-border p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider">Indexed Documents</h2>
        </div>
        <motion.div variants={container} initial="hidden" animate="show" className="divide-y divide-border">
          {mockDocuments.map((doc) => {
            const Icon = typeIcons[doc.type] || FileText;
            return (
              <motion.div
                key={doc.id}
                variants={item}
                whileHover={{ x: 4, backgroundColor: 'hsl(215 20% 18% / 0.3)' }}
                className="flex items-center gap-4 p-4 cursor-default"
              >
                <motion.div whileHover={{ rotate: 10 }} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </motion.div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">{typeLabels[doc.type]} • {doc.size} • Uploaded {doc.uploadedAt}</p>
                </div>
                <span className="status-badge bg-success/15 text-success">Indexed</span>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
