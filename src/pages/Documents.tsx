import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Upload, BookOpen, Wrench, ShieldCheck, Settings2, X, CheckCircle2 } from 'lucide-react';
import { mockDocuments } from '@/data/mockData';
import { toast } from 'sonner';
import type { UploadedDocument } from '@/types/investigation';

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

function inferDocType(name: string): UploadedDocument['type'] {
  const lower = name.toLowerCase();
  if (lower.includes('sop') || lower.includes('procedure')) return 'sop';
  if (lower.includes('safety')) return 'safety-manual';
  if (lower.includes('equipment') || lower.includes('manual')) return 'equipment-manual';
  return 'maintenance';
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

const ACCEPTED_TYPES = '.pdf,.docx,.doc,.txt,.xlsx,.xls';
const MAX_SIZE = 20 * 1024 * 1024; // 20MB

export default function Documents() {
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allDocs = [...mockDocuments, ...uploadedDocs];

  const processFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const newDocs: UploadedDocument[] = [];

    for (const file of fileArray) {
      if (file.size > MAX_SIZE) {
        toast.error(`${file.name} exceeds 20MB limit`);
        continue;
      }
      newDocs.push({
        id: `DOC-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: file.name,
        type: inferDocType(file.name),
        size: formatFileSize(file.size),
        uploadedAt: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      });
    }

    if (newDocs.length > 0) {
      setUploadedDocs(prev => [...prev, ...newDocs]);
      toast.success(`${newDocs.length} document${newDocs.length > 1 ? 's' : ''} uploaded successfully`);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragOver(false), []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  }, [processFiles]);

  const removeDoc = useCallback((id: string) => {
    setUploadedDocs(prev => prev.filter(d => d.id !== id));
    toast.info('Document removed');
  }, []);

  return (
    <div className="space-y-6">
      <input ref={fileInputRef} type="file" accept={ACCEPTED_TYPES} multiple hidden onChange={handleFileChange} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Document Intelligence</h1>
          <p className="text-sm text-muted-foreground">Upload and manage SOPs, manuals, and procedures for analysis</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => fileInputRef.current?.click()}
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
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed p-10 transition-colors ${
            isDragOver
              ? 'border-primary bg-primary/10'
              : 'border-border bg-muted/30 hover:border-primary/40'
          }`}
        >
          <div className="text-center">
            <motion.div animate={{ y: isDragOver ? -12 : [0, -8, 0] }} transition={isDragOver ? { duration: 0.2 } : { duration: 2, repeat: Infinity }}>
              <Upload className={`mx-auto h-10 w-10 ${isDragOver ? 'text-primary' : 'text-muted-foreground'}`} />
            </motion.div>
            <p className="mt-3 text-sm font-medium">{isDragOver ? 'Drop files to upload' : 'Drop documents here or click to browse'}</p>
            <p className="mt-1 text-xs text-muted-foreground">SOPs, equipment manuals, safety guides, maintenance procedures</p>
            <p className="mt-1 text-xs text-muted-foreground">PDF, DOCX, TXT — max 20MB each</p>
          </div>
        </div>
      </motion.div>

      <div className="glass-card">
        <div className="border-b border-border p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider">Indexed Documents ({allDocs.length})</h2>
        </div>
        <motion.div variants={container} initial="hidden" animate="show" className="divide-y divide-border">
          <AnimatePresence>
            {allDocs.map((doc) => {
              const Icon = typeIcons[doc.type] || FileText;
              const isUploaded = uploadedDocs.some(d => d.id === doc.id);
              return (
                <motion.div
                  key={doc.id}
                  variants={item}
                  layout
                  exit={{ opacity: 0, x: -20 }}
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
                  <div className="flex items-center gap-2">
                    <span className="status-badge bg-success/15 text-success flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Indexed
                    </span>
                    {isUploaded && (
                      <button onClick={() => removeDoc(doc.id)} className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
