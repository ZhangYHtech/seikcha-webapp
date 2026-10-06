// ============================================================
// 近30日综合费率走势图（T-走势 · 手绘 SVG，零依赖）：
// 横轴=业务日期（等距分类轴，缺快照的日期自动跳过不占位），
// 纵轴=综合费率 %（每百公里）；圆点悬停出原生 title 提示；
// 末点=当前选择（最新快照）加描边高亮。数据由 MapPage 逐日重算。
// ============================================================
import { useT } from '../i18n';

export interface TrendPoint {
  /** 业务日期 YYYY-MM-DD */
  date: string;
  /** 综合费率 %（每百公里） */
  rate: number;
}

const W = 640;
const H = 240;
const PAD = { l: 56, r: 16, t: 14, b: 30 };

export function RateTrendChart({ points }: { points: TrendPoint[] }) {
  const t = useT();
  if (points.length === 0) {
    return <p className="py-6 text-center text-xs text-slate-400">{t('trend.empty')}</p>;
  }
  const rates = points.map((p) => p.rate);
  const lo = Math.min(...rates);
  const hi = Math.max(...rates);
  const span = hi - lo || Math.abs(hi) * 0.2 || 0.01; // 全相等时给 20% 余量防平线
  const yMin = Math.max(0, lo - span * 0.15);
  const yMax = hi + span * 0.15;
  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  const x = (i: number) => PAD.l + (points.length === 1 ? iw / 2 : (i * iw) / (points.length - 1));
  const y = (v: number) => PAD.t + ih - ((v - yMin) / (yMax - yMin)) * ih;
  const ticks = [0, 0.5, 1].map((t) => yMin + t * (yMax - yMin));
  const labelEvery = Math.max(1, Math.ceil(points.length / 8));
  const path = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.rate).toFixed(1)}`)
    .join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-56 w-full" role="img" aria-label={t('trend.aria')}>
      {ticks.map((t, k) => (
        <g key={k}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="#e2e8f0" strokeWidth="1" />
          <text x={PAD.l - 8} y={y(t) + 3.5} textAnchor="end" fontSize="10" className="fill-slate-400">
            {t.toFixed(4)}%
          </text>
        </g>
      ))}
      <path d={path} fill="none" stroke="#eb6424" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => {
        const last = i === points.length - 1;
        return (
          <g key={p.date}>
            <circle
              cx={x(i)}
              cy={y(p.rate)}
              r={last ? 4.5 : 3}
              fill="#eb6424"
              stroke={last ? '#172436' : '#ffffff'}
              strokeWidth={last ? 2 : 1.5}
            >
              <title>{`${p.date} · ${t('map.rateLabel')} ${p.rate.toFixed(4)}%`}</title>
            </circle>
            {(i % labelEvery === 0 || last) && (
              <text x={x(i)} y={H - 10} textAnchor="middle" fontSize="10" className="fill-slate-400">
                {p.date.slice(5)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
