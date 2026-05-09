'use client';

import { BrainCircuit, CheckCircle2, ShieldAlert, Sparkles, XCircle, type LucideIcon } from 'lucide-react';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { ContentAIDecision, PolicyAuditFinding } from '@/lib/api/services/content-audit';

const decisionConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info'; icon: LucideIcon }> = {
  approved: { label: 'جاهز للنشر', variant: 'success', icon: CheckCircle2 },
  needs_fix: { label: 'يحتاج تصحيح', variant: 'warning', icon: ShieldAlert },
  restricted_ads: { label: 'إعلانات مقيّدة', variant: 'error', icon: ShieldAlert },
  rejected: { label: 'مرفوض', variant: 'error', icon: XCircle },
};

const riskLabels: Record<string, string> = { low: 'منخفض', medium: 'متوسط', high: 'مرتفع', critical: 'حرج' };

function ScoreBar({ label, value }: { label: string; value: number }) {
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">{label}</span><span className="font-semibold">{safeValue}%</span></div>
      <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${safeValue}%` }} /></div>
    </div>
  );
}

export default function AIDecisionCard({ selectedFinding, decision, isAnalyzing, onAnalyze }: { selectedFinding?: PolicyAuditFinding | null; decision?: ContentAIDecision | null; isAnalyzing?: boolean; onAnalyze: () => void }) {
  const config = decision ? decisionConfig[decision.decision] ?? { label: decision.decision, variant: 'info' as const, icon: BrainCircuit } : null;
  const Icon = config?.icon ?? BrainCircuit;
  return (
    <Card className="h-fit">
      <CardHeader>
        <div className="flex items-start justify-between gap-3"><div><CardTitle className="flex items-center gap-2"><BrainCircuit className="h-5 w-5 text-primary" />قرار الذكاء الاصطناعي</CardTitle><p className="mt-2 text-sm text-muted-foreground">تحليل احترافي لمدى جاهزية العنصر للسياسات و AdSense.</p></div>{decision && <Badge variant={config?.variant}>{config?.label}</Badge>}</div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!selectedFinding ? <div className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">اختر نتيجة من الجدول لتشغيل قرار AI عليها.</div> : <div className="rounded-xl border border-border bg-muted/30 p-3 text-sm"><div className="flex items-center justify-between gap-3"><span className="font-semibold">{selectedFinding.title || selectedFinding.url || selectedFinding.id}</span><Badge variant="outline">{selectedFinding.type} #{selectedFinding.id}</Badge></div><p className="mt-2 text-xs text-muted-foreground">{selectedFinding.reason}</p></div>}
        {decision ? <><div className="grid gap-3 sm:grid-cols-[120px_1fr]"><div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-4"><Icon className={cn('mb-2 h-6 w-6', config?.variant === 'success' ? 'text-emerald-600' : config?.variant === 'error' ? 'text-red-600' : 'text-amber-600')} /><span className="text-3xl font-bold">{decision.score}</span><span className="text-xs text-muted-foreground">AI Score</span></div><div className="space-y-2"><ScoreBar label="سياسات AdSense" value={decision.policy_score} /><ScoreBar label="SEO" value={decision.seo_score} /><ScoreBar label="جودة اللغة" value={decision.language_score} /><ScoreBar label="أمان الروابط" value={decision.safety_links_score} /><ScoreBar label="بنية المحتوى" value={decision.structure_score} /></div></div><div className="flex flex-wrap gap-2"><Badge variant={decision.adsense_risk === 'low' ? 'success' : decision.adsense_risk === 'medium' ? 'warning' : 'error'}>خطر AdSense: {riskLabels[decision.adsense_risk] || decision.adsense_risk}</Badge><Badge variant={decision.can_auto_fix ? 'info' : 'outline'}>{decision.can_auto_fix ? 'قابل للتصحيح' : 'غير قابل للتصحيح التلقائي'}</Badge></div><div className="grid gap-2 rounded-xl border border-border bg-muted/30 p-3 text-xs text-muted-foreground sm:grid-cols-2"><div><span className="font-semibold text-foreground">AI Provider:</span> {decision.provider || 'local'}</div><div><span className="font-semibold text-foreground">Model:</span> {decision.model || '-'}</div><div><span className="font-semibold text-foreground">Prompt:</span> {decision.prompt_version || 'content-intelligence-v1'}</div><div><span className="font-semibold text-foreground">Processing:</span> {decision.processing_time_ms ? `${decision.processing_time_ms} ms` : '-'}</div></div>{decision.summary && <p className="rounded-xl bg-muted/50 p-3 text-sm text-muted-foreground">{decision.summary}</p>}</> : <div className="rounded-xl bg-primary/5 p-4 text-sm text-muted-foreground">القرار لم يتم إنشاؤه بعد. شغّل التحليل لإنشاء تقرير محفوظ في الباك اند.</div>}
        <Button type="button" className="w-full" onClick={onAnalyze} disabled={!selectedFinding} isLoading={isAnalyzing} leftIcon={<Sparkles className="h-4 w-4" />}>تحليل العنصر بالذكاء الاصطناعي</Button>
      </CardContent>
    </Card>
  );
}
