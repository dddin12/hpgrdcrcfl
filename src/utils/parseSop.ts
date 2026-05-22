import type { SopExcerpt } from '@/types/investigation';

const MAX_PAGES = 15;
const MAX_FILES = 3;
const MAX_CHARS_PER_PAGE = 800;
const MAX_TOTAL_CHARS = 10000;

function clean(text: string, max = MAX_CHARS_PER_PAGE): string {
  return text.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
}

async function parsePdf(file: File): Promise<{ page: number; text: string }[]> {
  const pdfjs: any = await import('pdfjs-dist');
  try {
    const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
    pdfjs.GlobalWorkerOptions.workerSrc = (worker as any).default;
  } catch {
    pdfjs.GlobalWorkerOptions.workerSrc = '';
  }
  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf, disableWorker: !pdfjs.GlobalWorkerOptions.workerSrc }).promise;
  const pageCount = Math.min(doc.numPages, MAX_PAGES);
  const pages: { page: number; text: string }[] = [];
  let total = 0;
  for (let i = 1; i <= pageCount; i++) {
    const page = await doc.getPage(i);
    const tc = await page.getTextContent();
    const raw = tc.items.map((it: any) => it.str).join(' ');
    const text = clean(raw);
    if (text) {
      pages.push({ page: i, text });
      total += text.length;
      if (total > MAX_TOTAL_CHARS) break;
    }
  }
  return pages;
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

function chunkBySections(raw: string): { page: string; text: string }[] {
  const cleaned = raw.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '').replace(/[ \t]+/g, ' ').trim();
  const chunkSize = 1200;
  const chunks: { page: string; text: string }[] = [];
  let total = 0;
  for (let i = 0; i < cleaned.length && total < MAX_TOTAL_CHARS; i += chunkSize) {
    const text = cleaned.slice(i, i + chunkSize).trim();
    if (text) {
      chunks.push({ page: `section ${chunks.length + 1}`, text });
      total += text.length;
    }
  }
  return chunks;
}

export async function parseSopFiles(files: File[]): Promise<SopExcerpt[]> {
  const candidates = files.slice(0, MAX_FILES);
  const out: SopExcerpt[] = [];
  for (const file of candidates) {
    const name = file.name.toLowerCase();
    try {
      if (name.endsWith('.pdf')) {
        const pages = await parsePdf(file);
        if (pages.length) out.push({ name: file.name, pages });
      } else if (name.endsWith('.docx')) {
        const raw = await parseDocx(file);
        const pages = chunkBySections(raw);
        if (pages.length) out.push({ name: file.name, pages });
      } else if (name.endsWith('.txt') || name.endsWith('.md')) {
        const raw = await parseTxt(file);
        const pages = chunkBySections(raw);
        if (pages.length) out.push({ name: file.name, pages });
      }
    } catch (err) {
      console.warn('parseSop failed for', file.name, err);
    }
  }
  return out;
}
