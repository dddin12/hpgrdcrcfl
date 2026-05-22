import { Sparkles } from 'lucide-react';

export default function EmptyAnalysisState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
        <Sparkles className="h-5 w-5 text-primary" />
      </div>
      <p className="text-sm font-medium">{label}</p>
      <p className="text-xs text-muted-foreground max-w-sm">
        Click <span className="font-semibold text-foreground">Generate RCFA Report</span> above to run the AI analysis on the incident details you entered.
      </p>
    </div>
  );
}