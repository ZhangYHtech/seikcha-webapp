// ============================================================
// 保费地图页（2026-10-05 大改版，路由 #/map）：固定两步流程——
//   第一步（#/map） = 报价信息问卷（QuoteForm，季节/货物与装载/运输
//     安排 12 题，按上次所填预填）——每次点"准备好报价/开始保费导航"
//     都先进问卷，确认后才进地图，不因填过而跳过；
//   第二步（#/map/plan） = 地图界面（不再出现上述选择框）：
//     左栏 = 谷歌地图式竖直起终点（带图标）+ 极简路径方案卡
//            （方案N·走廊 + 综合费率 + 里程）+ 返回问卷链接；
//     右栏 = 真实在线底图大地图；选中方案后点地图下方"详细信息"，
//            才展开 途经城市 / 纯保费 / 毛保费 / 逐段明细。
// 步骤由 URL 驱动（#/map ↔ #/map/plan），保证任何入口/时点都符合流程。
// ============================================================
import { useEffect, useMemo, useState } from 'react';
import { QuoteForm, DEFAULT_ANSWERS, type FormAnswers } from './QuoteForm';
import { FactorDrawer } from './FactorDrawer';
import { RateTable } from './RateTable';
import { RateTrendChart } from './RateTrendChart';
import { ContactUs } from './ContactUs';
import { MapLibreMap } from './map/MapLibreMap';
import { enumerateRoutes, OD_CITIES, roadName } from '../lib/routePlanner';
import {
  loadInfoDay,
  loadInfoHistory,
  mergeWorstCorridor,
  quote,
  SEGMENTS,
  todayStr,
} from '../engine';
import type { InfoDay } from '../engine';
import type { DisplayLevels, QuoteResult, Rain, Sv01, Sv02 } from '../engine/types';
import { useLang, useT } from '../i18n';

export interface PanelState {
  origin: string;
  destination: string;
  schemeIdx: number;
  rain: Rain;
  sv01: Sv01;
  sv02: Sv02;
  display: DisplayLevels;
}

const CORR_KEY: Record<string, string> = {
  A: 'map.corr.A', B: 'map.corr.B', C: 'map.corr.C', D: 'map.corr.D',
  E: 'map.corr.E', F: 'map.corr.F', G: 'map.corr.G', H: 'map.corr.H',
};

const FORM_KEY = 'seikcha-quote-form-v1';

// 上次所填（仅用于问卷预填，不做跳过依据）
function loadSaved(): FormAnswers | null {
  try {
    const raw = sessionStorage.getItem(FORM_KEY);
    if (!raw) return null;
    const a = JSON.parse(raw) as FormAnswers;
    if (typeof a.rain !== 'number' || !a.sv01 || !a.sv02 || !a.display) return null;
    return a;
  } catch {
    return null;
  }
}

function panelFrom(a: FormAnswers | null): PanelState {
  return {
    origin: 'myitkyina',
    destination: 'yangon',
    schemeIdx: 0,
    rain: a?.rain ?? DEFAULT_ANSWERS.rain,
    sv01: a?.sv01 ?? DEFAULT_ANSWERS.sv01,
    sv02: a?.sv02 ?? DEFAULT_ANSWERS.sv02,
    display: a?.display ?? DEFAULT_ANSWERS.display,
  };
}

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function MapPage(props: { step: 'form' | 'plan' }) {
  const t = useT();
  const { lang } = useLang();
  // 多语言城市名：中文显示"中文 英文"，英/缅显示英文名（数据里缅甸文名用英文转写）
  const cityName = (c: { zh: string; en: string }) => (lang === 'zh' ? `${c.zh} ${c.en}` : c.en);

  const [panel, setPanel] = useState<PanelState>(() => panelFrom(loadSaved()));

  const [selectedSid, setSelectedSid] = useState<string | null>(null);
  const [mapPickedSid, setMapPickedSid] = useState<string | null>(null);
  const [drawerSid, setDrawerSid] = useState<string | null>(null);
  const [hoverSid, setHoverSid] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const schemes = useMemo(
    () => enumerateRoutes(panel.origin, panel.destination, (c) => (lang === 'zh' ? c.zh : c.en)),
    [panel.origin, panel.destination, lang],
  );
  const schemeIdx = Math.min(panel.schemeIdx, Math.max(0, schemes.length - 1));
  const scheme = schemes[schemeIdx];

  // 每日信息快照：挂载即拉取（同日期会话内只请求一次），失败回退基准档并弱提示
  const [infoDay, setInfoDay] = useState<InfoDay | null>(null);
  const [infoStatus, setInfoStatus] = useState<'loading' | 'live' | 'fallback'>('loading');
  useEffect(() => {
    let alive = true;
    loadInfoDay(todayStr()).then((d) => {
      if (!alive) return;
      setInfoDay(d);
      setInfoStatus(d ? 'live' : 'fallback');
    });
    return () => {
      alive = false;
    };
  }, []);

  // 近30日历史快照（供详细信息里的费率走势图逐日重算；缺失日期自动跳过）
  const [history, setHistory] = useState<InfoDay[] | null>(null);
  useEffect(() => {
    let alive = true;
    loadInfoHistory(30).then((h) => {
      if (alive) setHistory(h);
    });
    return () => {
      alive = false;
    };
  }, []);

  // 按方案报价：跨走廊方案先做最不利合并（INTEGRATION.md §5），
  // ct04 档位由引擎按 CT04 表转系数
  const quoteReq = useMemo(
    () => ({
      schemes,
      rain: panel.rain,
      sv01: panel.sv01,
      sv02: panel.sv02,
      display: panel.display,
      infoDay,
    }),
    [schemes, panel.rain, panel.sv01, panel.sv02, panel.display, infoDay],
  );
  const debouncedReq = useDebounced(quoteReq, 150);
  const loading = quoteReq !== debouncedReq;

  const schemeStats = useMemo(
    () =>
      debouncedReq.schemes.map((s) => {
        const corrs = [...new Set(s.sids.map((sid) => SEGMENTS[sid]?.corr ?? ''))].filter(Boolean);
        const info = mergeWorstCorridor(corrs, debouncedReq.infoDay);
        const q = quote({
          segments: s.sids,
          rain: debouncedReq.rain,
          sv01: debouncedReq.sv01,
          sv02: debouncedReq.sv02,
          display: debouncedReq.display,
          info,
        });
        return { total: q.total, perSegment: q.perSegment };
      }),
    [debouncedReq],
  );

  const current = schemeStats[schemeIdx] ?? null;
  const result: QuoteResult | null = current
    ? { perSegment: current.perSegment, total: current.total, method: 'MC' }
    : null;

  // 费率走势（详细信息里的折线图）：选定方案 × 当前问卷条件 × 每日历史快照逐日重算。
  // 引擎按段固定种子，逐日波动只来自信息因子变化，可复现。
  const trend = useMemo(() => {
    const s = debouncedReq.schemes[schemeIdx];
    if (!history || !s) return null;
    const corrs = [...new Set(s.sids.map((sid) => SEGMENTS[sid]?.corr ?? ''))].filter(Boolean);
    return history.map((day) => {
      const info = mergeWorstCorridor(corrs, day);
      const q = quote({
        segments: s.sids,
        rain: debouncedReq.rain,
        sv01: debouncedReq.sv01,
        sv02: debouncedReq.sv02,
        display: debouncedReq.display,
        info,
      });
      return { date: day.date, rate: q.total.ratePer100km };
    });
  }, [history, debouncedReq, schemeIdx]);

  const drawerSeg = result?.perSegment.find((s) => s.sid === drawerSid) ?? null;
  const drawerOpen = drawerSid != null && (drawerSeg != null || loading);

  const candidateSids = useMemo(
    () => schemes.filter((_, i) => i !== schemeIdx).map((s) => s.sids),
    [schemes, schemeIdx],
  );

  const segName = (sid: string) => roadName(sid, lang);

  /* ---------- 第一步：报价信息问卷（#/map）——每次进入必经 ---------- */
  if (props.step === 'form') {
    return (
      <main>
        <QuoteForm
          initial={{ rain: panel.rain, sv01: panel.sv01, sv02: panel.sv02, display: panel.display }}
          onContinue={(a) => {
            try {
              sessionStorage.setItem(FORM_KEY, JSON.stringify(a));
            } catch {
              /* 隐私模式等场景忽略 */
            }
            setPanel((p) => ({ ...p, rain: a.rain, sv01: a.sv01, sv02: a.sv02, display: a.display }));
            window.location.hash = '#/map/plan';
          }}
        />
        <ContactUs />
      </main>
    );
  }

  /* ---------- 第二步：地图界面 ---------- */
  return (
    <main>
      <section id="map" className="scroll-mt-32 bg-white py-10">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10">
          <div className="grid items-start gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
            {/* 左栏：起终点 + 极简方案卡 */}
            <div className="space-y-6 lg:sticky lg:top-32">
              {/* 谷歌地图式竖直起终点 */}
              <div className="relative">
                <div aria-hidden className="absolute bottom-9 left-[35px] top-9 border-l-2 border-dashed border-slate-300" />
                <label className="relative mb-3 flex items-center gap-3 rounded-xl border border-slate-400 bg-white px-3 py-2.5">
                  <span aria-hidden className="grid w-5 place-items-center">
                    <span className="block h-3 w-3 rounded-full border-[3px] border-seik-500 bg-white" />
                  </span>
                  <span className="sr-only">{t('map.origin')}</span>
                  <select
                    value={panel.origin}
                    onChange={(e) => setPanel((p) => ({ ...p, origin: e.target.value, schemeIdx: 0 }))}
                    className="w-full bg-transparent text-sm font-medium text-slate-800 outline-none"
                  >
                    {OD_CITIES.map((c) => (
                      <option key={c.id} value={c.id}>{cityName(c)}</option>
                    ))}
                  </select>
                </label>
                <label className="relative flex items-center gap-3 rounded-xl border border-slate-400 bg-white px-3 py-2.5">
                  <span aria-hidden className="grid w-5 place-items-center">
                    <svg viewBox="0 0 24 24" className="h-4 w-4 text-seik-500" fill="currentColor">
                      <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5Z" />
                    </svg>
                  </span>
                  <span className="sr-only">{t('map.destination')}</span>
                  <select
                    value={panel.destination}
                    onChange={(e) => setPanel((p) => ({ ...p, destination: e.target.value, schemeIdx: 0 }))}
                    className="w-full bg-transparent text-sm font-medium text-slate-800 outline-none"
                  >
                    {OD_CITIES.map((c) => (
                      <option key={c.id} value={c.id}>{cityName(c)}</option>
                    ))}
                  </select>
                </label>
              </div>

              {/* 信息因子快照状态（弱提示，不打断报价；§6 披露纪律：媒体沉默≠安全） */}
              <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                <span
                  aria-hidden
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    infoStatus === 'live'
                      ? 'bg-emerald-500'
                      : infoStatus === 'fallback'
                        ? 'bg-amber-500'
                        : 'bg-slate-300'
                  }`}
                />
                {infoStatus === 'loading' && <span>{t('map.infoLoading')}</span>}
                {infoStatus === 'live' && <span>{t('map.infoLive', { date: infoDay?.date ?? '' })}</span>}
                {infoStatus === 'fallback' && <span>{t('map.infoFallback')}</span>}
              </div>

              {/* 路径方案（精简：方案N·走廊 + 综合费率 + 里程） */}
              <div>
                <div className="mb-2 flex items-baseline justify-between">
                  <span className="text-sm font-bold text-pg-navy">{t('map.schemes')}</span>
                  {loading && <span className="text-xs text-seik-600">{t('map.recalcing')}</span>}
                </div>
                <div className="space-y-2.5">
                  {schemes.map((s, i) => {
                    const st = schemeStats[i];
                    const selected = i === schemeIdx;
                    return (
                      <button
                        key={s.label}
                        onClick={() => setPanel((p) => ({ ...p, schemeIdx: i }))}
                        className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                          selected
                            ? 'border-seik-500 bg-seik-50 ring-1 ring-seik-500'
                            : 'border-slate-300 bg-white hover:border-seik-400'
                        } ${loading ? 'opacity-70' : ''}`}
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-sm font-bold text-pg-navy">
                            {t('map.plan', { n: i + 1 })} ·{' '}
                            {s.sids.map((sid) => CORR_KEY[SEGMENTS[sid]?.corr ?? '']).filter((v, idx, a) => v && a.indexOf(v) === idx).map((k) => t(k)).join('+') || t('map.direct')}
                          </span>
                          <span className="shrink-0 text-xs text-slate-400">{s.totalKm} km</span>
                        </div>
                        <div className="mt-1 font-mono text-2xl font-black tabular-nums text-seik-700">
                          {st ? `${st.total.ratePer100km.toFixed(4)}%` : '—'}
                          <span className="ml-1.5 text-xs font-semibold text-slate-500">{t('map.rateLabel')}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => {
                    window.location.hash = '#/map';
                  }}
                  className="mt-4 text-xs font-medium text-slate-500 underline underline-offset-2 hover:text-seik-700"
                >
                  {t('map.editInfo')}
                </button>
              </div>
            </div>

            {/* 右栏：大地图 + 详细信息 */}
            <div className="space-y-4">
              <MapLibreMap
                schemeSids={scheme?.sids ?? []}
                candidateSids={candidateSids}
                quote={result}
                selectedSid={selectedSid ?? hoverSid}
                origin={panel.origin}
                destination={panel.destination}
                lang={lang}
                onSelectSid={(sid: string | null) => {
                  setSelectedSid(sid === selectedSid ? null : sid);
                  setMapPickedSid(sid);
                }}
                onHoverSid={setHoverSid}
              />

              {/* 详细信息：选中方案后展开 途经城市/纯保费/毛保费/逐段明细 */}
              <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0 text-xs text-slate-500">
                    {result
                      ? t('map.selected', { n: schemeIdx + 1, km: scheme?.totalKm ?? 0 })
                      : t('map.pickHint')}
                  </div>
                  <button
                    onClick={() => setDetailOpen(!detailOpen)}
                    disabled={!result}
                    className="shrink-0 rounded-md border border-slate-400 px-4 py-2 text-sm font-semibold text-pg-black transition hover:border-pg-black disabled:opacity-40"
                  >
                    {detailOpen ? t('map.detailClose') : t('map.detail')}
                  </button>
                </div>
                {detailOpen && result && scheme && (
                  <>
                    <dl className="grid gap-3 border-t border-slate-100 bg-slate-50/60 px-4 py-3.5 text-sm sm:grid-cols-[1fr_auto_auto]">
                      <div className="sm:col-span-3">
                        <dt className="text-xs font-semibold text-slate-400">{t('map.via')}</dt>
                        <dd className="mt-0.5 font-medium text-pg-navy">{scheme.viaLabel}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold text-slate-400">{t('map.pure')}</dt>
                        <dd className="mt-0.5 font-mono text-lg font-bold text-seik-700">{result.total.pureRate.toFixed(3)}%</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold text-slate-400">{t('map.gross')}</dt>
                        <dd className="mt-0.5 font-mono text-lg font-bold text-seik-700">{result.total.grossRate.toFixed(3)}%</dd>
                      </div>
                    </dl>
                    <div className="border-t border-slate-100 px-4 py-4">
                      <div className="mb-1 flex items-baseline justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-400">{t('map.trend.title')}</span>
                        <span className="text-[10px] text-slate-400">{t('map.trend.note')}</span>
                      </div>
                      {trend === null ? (
                        <p className="py-6 text-center text-xs text-slate-400">{t('map.trend.loading')}</p>
                      ) : (
                        <RateTrendChart points={trend} />
                      )}
                    </div>
                    <RateTable
                      quote={result}
                      selectedSid={selectedSid ?? hoverSid}
                      scrollToSid={mapPickedSid}
                      loading={loading}
                      onPickRate={(sid) => setDrawerSid(sid)}
                      onHoverSid={setHoverSid}
                      onSelectSid={(sid) => setSelectedSid(sid === selectedSid ? null : sid)}
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <FactorDrawer
        open={drawerOpen}
        seg={drawerSeg}
        segName={drawerSeg ? segName(drawerSeg.sid) : ''}
        loading={loading}
        onClose={() => setDrawerSid(null)}
      />
      <ContactUs />
    </main>
  );
}
