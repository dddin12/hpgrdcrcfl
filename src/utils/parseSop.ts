import type { SopExcerpt } from '@/types/investigation';

const MAX_CHARS = 8000;
const MAX_PAGES = 15;
const MAX_FILES = 3;

function clean(text: string): string {
  return text.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '').replace(/\s+/g, ' ').trim().slice(0, MAX_CHARS);
}

async function parsePdf(file: File): Promise<string> {
  const pdfjs: any = await import('pdfjs-dist');
  // Use bundled worker via inline option
  try {
    const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
    pdfjs.GlobalWorkerOptions.workerSrc = (worker as any).default;
  } catch {
    // fallback: disable worker
    pdfjs.GlobalWorkerOptions.workerSrc = '';
  }
  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf, disableWorker: !pdfjs.GlobalWorkerOptions.workerSrc }).promise;
  const pageCount = Math.min(doc.numPages, MAX_PAGES);
  let out = '';
  for (let i = 1; i <= pageCount; i++) {
    const page = await doc.getPage(i);
    const tc = await page.getTextContent();
    out += tc.items.map((it: any) => it.str).join(' ') + '\n';
    if (out.length > MAX_CHARS * 1.5) break;
  }
  return out;
}

async function parseDocx(file: File): Promise<string> {
  const mammoth: any = await import('mammoth/mammoth.browser.js');
  const buf = await file.arrayBuffer();
  const res = await mammoth.extractRawText({ arrayBuffer: buf });
  return res.value || '';
}

async function parseTxt(file: File): Promise<string> {
  return await file.text();
}

export async function parseSopFiles(files: File[]): Promise<SopExcerpt[]> {
  const candidates = files.slice(0, MAX_FILES);
  const out: SopExcerpt[] = [];
  for (const file of candidates) {
    const name = file.name.toLowerCase();
    try {
      let raw = '';
      if (name.endsWith('.pdf')) raw = await parsePdf(file);
      else if (name.endsWith('.docx')) raw = await parseDocx(file);
      else if (name.endsWith('.txt') || name.endsWith('.md')) raw = await parseTxt(file);
      else continue;
      const text = clean(raw);
      if (text) out.push({ name: file.name, text });
    } catch (err) {
      console.warn('parseSop failed for', file.name, err);
    }
  }
  return out;
}