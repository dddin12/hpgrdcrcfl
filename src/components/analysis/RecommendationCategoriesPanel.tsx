import { RECOMMENDATION_CATEGORIES } from '@/types/investigation';

export default function RecommendationCategoriesPanel({
  selected, onChange,
}: {
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const toggle = (c: string) => {
    if (selected.includes(c)) onChange(selected.filter(x => x !== c));
    else onChange([...selected, c]);
  };
  return (
    <div>
      <p className="mb-2 text-xs text-muted-foreground">Select the categories applicable to this incident. AI recommendations will only be drafted within these categories.</p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {RECOMMENDATION_CATEGORIES.map(c => (
          <label key={c} className={`flex cursor-pointer items-center gap-2 rounded border px-3 py-2 text-xs transition ${selected.includes(c) ? 'border-primary bg-primary/10' : 'border-border bg-muted/30 hover:bg-muted'}`}>
            <input type="checkbox" checked={selected.includes(c)} onChange={() => toggle(c)} className="h-3.5 w-3.5 accent-primary" />
            <span>{c}</span>
          </label>
        ))}
      </div>
    </div>
  );
}