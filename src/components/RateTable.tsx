// ============================================================
// 费率一览表（T404 · W4 · 需求5）
// 数据全部实时来自引擎（组件内零硬编码数值，红线1+T404审计）；
// 因子调节完成→逐段费率/百公里+全程纯/毛保费+巨灾占比；
// 点表行 ↔ 点地图双向联动；[封顶]/暂停标记。
// ============================================================
import { useEffect, useRef } from 'react';
import { SEGMENTS } from '../engine';
import { roadName } from '../lib/routePlanner';
import { tokens } from '../styles/tokens';
import { useLang, useT } from '../i18n';
import type { QuoteResult } from '../engine/types';

export function RateTable(props: {
  quote: QuoteResult | null;
  selectedSid: string | null;
  scrollToSid: string | null; // 仅地图点击来源的选中才滚动（hover 不滚动，避免页面漂移）
  loading: boolean;
  onPickRate: (sid: string) => void; // 点费率 → 抽屉
  onHoverSid: (sid: string | null) => void; // hover → 地图
  onSelectSid: (sid: string) => void; // 点行 → 地图高亮
}) {
  const { quote, selectedSid, scrollToSid, loading, onPickRate, onHoverSid, onSelectSid } = props;
  const t = useT();
  const { lang } = useLang();
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

  // 地图点段 → 表滚到该段
  useEffect(() => {
    if (scrollToSid && rowRefs.current[scrollToSid]) {
      rowRefs.current[scrollToSid]!.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [scrollToSid]);

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center gap-3 rounded-2xl bg-white text-xs text-slate-400 ring-1 ring-slate-200">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-seik-200 border-t-seik-600" />
        {t('table.recalcing')}
      </div>
    );
  }
  if (!quote || quote.perSegment.length === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-2xl bg-white text-xs text-slate-400 ring-1 ring-slate-200">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M3 9h18M9 9v11" />
        </svg>
        {t('table.pickHint')}
      </div>
    );
  }

  const segName = (sid: string) => roadName(sid, lang);

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-xs">
          <thead>
            <tr className="bg-slate-50 text-left text-[11px] text-slate-500">
              <th className="px-3 py-2 font-semibold">{t('table.road')}</th>
              <th className="px-2 py-2 font-semibold">{t('table.status')}</th>
              <th className="px-2 py-2 text-right font-semibold">{t('table.km')}</th>
              <th className="px-2 py-2 text-right font-semibold">{t('table.rate')}</th>
              <th className="px-2 py-2 text-right font-semibold">{t('table.pure')}</th>
              <th className="px-2 py-2 text-right font-semibold">{t('table.cat')}</th>
              <th className="px-2 py-2 text-right font-semibold">{t('table.freq')}</th>
              <th className="px-2 py-2 text-right font-semibold">{t('table.gross')}</th>
              <th className="px-2 py-2 font-semibold">{t('table.mark')}</th>
            </tr>
          </thead>
          <tbody>
            {quote.perSegment.map((s) => {
              const paused = s.paused || s.st === 3;
              return (
                <tr
                  key={s.sid}
                  ref={(el) => {
                    rowRefs.current[s.sid] = el;
                  }}
                  onMouseEnter={() => onHoverSid(s.sid)}
                  onMouseLeave={() => onHoverSid(null)}
                  onClick={() => onSelectSid(s.sid)}
                  className={`cursor-pointer border-t border-slate-100 transition hover:bg-seik-50/50 ${
                    selectedSid === s.sid ? 'bg-seik-50' : ''
                  }`}
                >
                  <td className="px-3 py-2">
                    <div className="font-semibold text-slate-700">{s.sid}</div>
                    <div className="text-[10px] text-slate-400">{segName(s.sid)}</div>
                  </td>
                  <td className="px-2 py-2">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                      s.st === 3 ? 'bg-red-100 text-red-700' : s.st === 2 ? 'bg-amber-100 text-amber-700' : 'bg-pg-greenLightest text-pg-green'
                    }`}>
                    {t(`st.${s.st}`)}
                  </span>
                </td>
                  <td className="px-2 py-2 text-right font-mono text-slate-500">{segKm(s.sid)}</td>
                  <td className="px-2 py-2 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPickRate(s.sid);
                      }}
                      className={`rounded px-1.5 py-0.5 font-mono font-bold ${
                        paused ? 'text-slate-300 line-through' : 'text-seik-700 hover:bg-seik-100'
                      }`}
                      title={t('table.clickRate')}
                    >
                      {paused ? '——' : `${s.rate.toFixed(4)}%`}
                    </button>
                  </td>
                  <td className="px-2 py-2 text-right font-mono text-slate-600">{paused ? '——' : `${s.pure.toFixed(3)}%`}</td>
                  <td className="px-2 py-2 text-right font-mono text-slate-500">{paused ? '——' : `${s.catShare.toFixed(3)}%`}</td>
                  <td className="px-2 py-2 text-right font-mono text-slate-500">
                    {s.freq == null ? '—' : `${(s.freq * 100).toFixed(1)}%`}
                  </td>
                  <td className="px-2 py-2 text-right font-mono text-slate-600">
                    {paused ? '——' : `${(s.pure / (1 - 0.35)).toFixed(3)}%`}
                  </td>
                  <td className="px-2 py-2">
                    {paused && <Mark color={tokens.color.paused}>{t('map.paused')}</Mark>}
                    {!paused && s.capped && <Mark color={tokens.color.cap}>{t('map.capped')}</Mark>}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-200 bg-seik-50/60 text-[12px]">
              <td className="px-3 py-2.5 font-bold text-slate-800" colSpan={3}>
                {t('table.total', { n: quote.perSegment.length })}
              </td>
              <td className="px-2 py-2.5 text-right font-mono font-bold text-seik-800">
                {quote.total.ratePer100km.toFixed(4)}%
              </td>
              <td className="px-2 py-2.5 text-right font-mono font-bold text-slate-800">{quote.total.pureRate.toFixed(3)}%</td>
              <td className="px-2 py-2.5 text-right font-mono text-slate-600">
                {catSharePct(quote)}%
              </td>
              <td className="px-2 py-2.5" />
              <td className="px-2 py-2.5 text-right font-mono font-bold text-slate-800">{quote.total.grossRate.toFixed(3)}%</td>
              <td className="px-2 py-2.5 text-[10px] text-slate-400">{quote.method === 'quick' ? t('table.quick') : 'MC@200k'}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="border-t border-slate-100 bg-white px-3 py-2 text-[10px] text-slate-400">
        {t('table.note')}
        {quote.method === 'quick' ? t('table.noteQuick') : ''}
      </div>
    </div>
  );
}

function Mark(props: { color: string; children: React.ReactNode }) {
  return (
    <span
      className="rounded px-1.5 py-0.5 text-[10px] font-bold text-white"
      style={{ backgroundColor: props.color }}
    >
      {props.children}
    </span>
  );
}

/** 段里程（segments.json 段档案，非硬编码） */
function segKm(sid: string): string {
  return `${SEGMENTS[sid]?.d ?? 0} km`;
}

function catSharePct(quote: QuoteResult): string {
  const cat = quote.perSegment.reduce((a, s) => a + s.catShare, 0);
  const pure = quote.total.pureRate;
  if (pure <= 0) return '0.0';
  return ((cat / pure) * 100).toFixed(1);
}
