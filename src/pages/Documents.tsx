import { motion } from 'framer-motion';
import { FileText, Upload, BookOpen, Wrench, ShieldCheck, Settings2 } from 'lucide-react';
import { mockDocuments } from '@/data/mockData';

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

export default function Documents() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Document Intelligence</h1>
          <p className="text-sm text-muted-foreground">Upload and manage SOPs, manuals, and procedures for AI-powered analysis</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">
          <Upload className="h-4 w-4" />
          Upload Document
        </button>
      </div>

      <div className="glass-card">
        <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 p-10 transition-colors hover:border-primary/40">
          <div className="text-center">
            <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">Drop documents here to upload</p>
            <p className="mt-1 text-xs text-muted-foreground">SOPs, equipment manuals, safety guides, maintenance procedures</p>
            <p className="mt-1 text-xs text-muted-foreground">PDF, DOCX, TXT — max 20MB each</p>
          </div>
        </div>
      </div>

      <div className="glass-card">
        <div className="border-b border-border p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider">Indexed Documents</h2>
        </div>
        <div className="divide-y divide-border">
          {mockDocuments.map((doc, i) => {
            const Icon = typeIcons[doc.type] || FileText;
            return (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-4 p-4 hover:bg-muted/30"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">{typeLabels[doc.type]} • {doc.size} • Uploaded {doc.uploadedAt}</p>
                </div>
                <span className="status-badge bg-success/15 text-success">Indexed</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
