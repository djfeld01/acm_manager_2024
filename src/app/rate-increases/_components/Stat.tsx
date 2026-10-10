import { Card, CardContent } from "@/components/ui/card";

export function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="text-2xl font-bold">{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
      </CardContent>
    </Card>
  );
}

export function TabLoading({ error, isLoading }: { error: unknown; isLoading: boolean }) {
  if (isLoading) return <div className="text-sm text-muted-foreground py-10 text-center">Crunching numbers…</div>;
  if (error)
    return (
      <div className="text-sm text-destructive">
        {error instanceof Error ? error.message : "Something went wrong loading this tab."}
      </div>
    );
  return null;
}
