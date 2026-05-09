'use client';

import { AlertTriangle, Lightbulb } from 'lucide-react';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import type { ContentAIDecision } from '@/lib/api/services/content-audit';

function severityVariant(severity: string): 'success' | 'warning' | 'error' | 'info' | 'outline' {
  if (['critical', 'high'].includes(severity)) return 'error';
  if (severity === 'medium') return 'warning';
  if (severity === 'low') return 'info';
  return 'outline';
}

export default function AIIssuesList({ decision }: { decision?: ContentAIDecision | null }) {
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-600" />المشاكل والاقتراحات</CardTitle></CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3"><h4 className="font-semibold">المشاكل المكتشفة</h4>{!decision?.issues?.length ? <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">لا توجد مشاكل AI محفوظة.</div> : decision.issues.map((issue, index) => <div key={issue.id ?? index} className="rounded-xl border border-border p-4"><div className="mb-2 flex flex-wrap items-center gap-2"><Badge variant={severityVariant(issue.severity)}>{issue.severity}</Badge><Badge variant="outline">{issue.type}</Badge>{issue.action && <Badge variant="info">{issue.action}</Badge>}</div><p className="text-sm">{issue.message}</p>{issue.evidence && <p className="mt-2 text-xs text-muted-foreground">الدليل: {issue.evidence}</p>}</div>)}</div>
        <div className="space-y-3"><h4 className="flex items-center gap-2 font-semibold"><Lightbulb className="h-4 w-4" />اقتراحات التصحيح</h4>{!decision?.suggestions?.length ? <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">لا توجد اقتراحات محفوظة.</div> : decision.suggestions.map((suggestion, index) => <div key={suggestion.id ?? index} className="rounded-xl border border-border bg-muted/30 p-4"><div className="mb-2 flex flex-wrap items-center gap-2"><Badge variant={suggestion.priority === 'high' ? 'warning' : 'info'}>{suggestion.priority}</Badge><Badge variant="outline">{suggestion.type}</Badge></div><p className="text-sm">{suggestion.message}</p></div>)}</div>
      </CardContent>
    </Card>
  );
}
