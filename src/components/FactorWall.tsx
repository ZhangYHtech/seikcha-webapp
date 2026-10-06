// ============================================================
// 26因子卡片墙（T301 · W3 · 需求2/4）
// 读 factor_tables.json 渲染 26 卡（零手抄数值，红线1）；
// 徽章=内置13/展示7/信息6；内置卡联动当前路径显示各段档位；
// 信息卡标"AI数据捕捉·即将上线"+当前默认快照。
// ============================================================
import { useMemo, useState } from 'react';
import tablesJson from '../data/factor_tables.json';
import { CATEGORY_BADGE, FACTOR_META, type FactorMeta } from '../data/factorMeta';
import { SEGMENTS, INFO_DEFAULTS } from '../engine';
import { SV02 } from '../engine/core';
import { ST_LABEL } from '../styles/tokens';

const T = tablesJson as unknown as import('../engine/schema').FactorTablesJson;

/** 档位→系数表渲染（对象值可能是数 [事故,磨损] / [速,险] 等） */
function CoefTable({ rows }: { rows: [string, string][] }) {
  if (rows.length === 0) return null;
  return (
    <table className="mt-2 w-full text-[10.5px] leading-tight">
      <tbody>
        {rows.map(([k, v]) => (
          <tr key={k} className="border-t border-slate-100">
            <td className="py-0.5 pr-1 text-slate-500">{k}</td>
            <td className="py-0.5 text-right font-mono text-slate-700">{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function rowsFromTableKey(meta: FactorMeta): [string, string][] {
  const out: [string, string][] = [];
  for (const key of meta.tableKeys ?? []) {
    const tbl = T[key] as Record<string, number | number[] | null> | undefined;
    if (!tbl) continue;
    for (const [level, val] of Object.entries(tbl)) {
      if (val === null || val === undefined) {
        out.push([`${key}·${level}`, '关闭→暂停']);
      } else if (Array.isArray(val)) {
        out.push([`${key}·${level}`, val.map((x) => fmt(x)).join(' / ')]);
      } else {
        out.push([`${key}·${level}`, fmt(val)]);
      }
    }
  }
  if (meta.code === 'SV-02') {
    for (const [k, v] of Object.entries(SV02)) {
      out.push([`SV-02·${k}`, v.map((x) => fmt(x)).join(' / ') + '（SPEC§4）']);
    }
  }
  return out;
}

function fmt(x: number): string {
  if (Math.abs(x) >= 1e-5 && Math.abs(x) < 1e5) return String(Number(x.toFixed(4)));
  return x.toExponential(1);
}

/** 内置卡：当前路径各段档位联动 */
function SegmentLevels({ sid }: { sid: string }) {
  const s = SEGMENTS[sid];
  if (!s) return null;
  return (
    <span className="ml-1 rounded bg-pg-greenLightest px-1 py-0.5 text-[10px] font-medium text-pg-green">
      {s.name.split(' ')[0]}·S{s.st}
    </span>
  );
}

export function FactorWall(props: { routeSids: string[] }) {
  const { routeSids } = props;
  const [filter, setFilter] = useState<'全部' | '内置' | '展示' | '信息'>('全部');
  const counts = useMemo(() => {
    const c = { 内置: 0, 展示: 0, 信息: 0 } as Record<string, number>;
    for (const f of FACTOR_META) c[f.category]++;
    return c;
  }, []);

  const cards = FACTOR_META.filter((f) => filter === '全部' || f.category === filter);

  return (
    <section id="factors" className="scroll-mt-16 py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-serif text-2xl font-bold tracking-tight text-pg-navy sm:text-3xl">26 因子全景</h2>
            <p className="mt-1 text-sm text-slate-500">
              三层结构：内置因子随路自动（段档案），展示因子由您自报，信息因子由 AI 数据捕捉系统按日评分（上线前按基准档）。
            </p>
          </div>
          <div className="flex gap-1 rounded-full bg-slate-100 p-1 text-xs font-semibold">
            {(['全部', '内置', '展示', '信息'] as const).map((k) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`rounded-full px-3 py-1.5 transition ${
                  filter === k ? 'bg-white text-seik-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {k} {k === '全部' ? 26 : counts[k]}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cards.map((f) => {
            const badge = CATEGORY_BADGE[f.category];
            return (
              <article key={f.code} className="flex flex-col rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">{f.name}</h3>
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ring-1 ${badge.cls}`}>{badge.label}</span>
                  <span className="ml-auto text-[10px] text-slate-300">{f.code}</span>
                </div>
                <p className="mt-1 text-[11px] font-medium text-slate-400">{f.source}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{f.meaning}</p>

                {/* 内置：当前路径档位联动 */}
                {f.category === '内置' && routeSids.length > 0 && (
                  <div className="mt-2 rounded-lg bg-slate-50 px-2 py-1.5">
                    <div className="text-[10px] font-semibold text-slate-400">当前路径</div>
                    <div className="mt-0.5 flex flex-wrap gap-1">
                      {routeSids.map((sid) => (
                        <SegmentLevels key={sid} sid={sid} />
                      ))}
                    </div>
                  </div>
                )}

                {/* 信息：默认快照 */}
                {f.category === '信息' && (
                  <div className="mt-2 rounded-lg bg-amber-50 px-2 py-1.5 text-[10px] text-amber-700 ring-1 ring-amber-100">
                    当前默认快照：{defaultSnapshot(f.code)}（{ST_LABEL[1]} 之外按段档案）
                  </div>
                )}

                <div className="mt-auto">
                  <CoefTable rows={rowsFromTableKey(f)} />
                  {f.ratingCard && (
                    <p className="mt-1.5 border-t border-slate-100 pt-1.5 text-[10px] leading-snug text-slate-400">
                      评分卡：{T.rating_cards[f.ratingCard]}
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function defaultSnapshot(code: string): string {
  switch (code) {
    case 'FR-03':
      return '段基准';
    case 'FR-15':
      return INFO_DEFAULTS.fr15;
    case 'CT-04':
      return `ct04=${INFO_DEFAULTS.ct04}`;
    case 'CT-05':
      return INFO_DEFAULTS.ct05;
    case 'CT-06':
      return INFO_DEFAULTS.ct06;
    case 'ST-01':
      return '随段档案';
    default:
      return '基准档';
  }
}
