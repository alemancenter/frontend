import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'الموقع تحت الصيانة | alemanedu',
  description: 'نعمل على تحديث الموقع وتحسين تجربتك. سنعود قريباً.',
  robots: { index: false, follow: false },
};

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}>
      <div className="text-center max-w-lg w-full">

        {/* Gear icon */}
        <div className="w-24 h-24 mx-auto mb-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.12)', border: '2px solid rgba(99,102,241,0.28)' }}>
          <svg
            className="maintenance-spin"
            width="52"
            height="52"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6366f1"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" />
            <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
            <path d="M12 2v2" /><path d="M12 20v2" />
            <path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" />
            <path d="M2 12h2" /><path d="M20 12h2" />
            <path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
          </svg>
        </div>

        {/* Status badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-sm font-semibold" style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.35)', color: '#a5b4fc' }}>
          <span className="maintenance-pulse inline-block w-2 h-2 rounded-full" style={{ background: '#6366f1' }} />
          قيد التحديث الآن
        </div>

        <h1 className="text-4xl font-extrabold mb-4" style={{ color: '#f1f5f9' }}>
          الموقع تحت الصيانة
        </h1>

        <p className="text-base leading-8 mb-8" style={{ color: '#94a3b8' }}>
          نعمل حالياً على تحديث الموقع وتطوير تجربة أفضل لكم.
          <br />
          سيعود الموقع في أقرب وقت ممكن — شكراً لصبركم وتفهمكم.
        </p>

        {/* Divider */}
        <div className="w-14 h-1 rounded-full mx-auto mb-8" style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }} />

        {/* Progress bar */}
        <div className="rounded-full h-1.5 overflow-hidden mb-10" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div className="maintenance-progress h-full rounded-full" style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }} />
        </div>

        <p className="text-xs" style={{ color: '#475569' }}>
          &copy; {new Date().getFullYear()} alemanedu — جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
}
