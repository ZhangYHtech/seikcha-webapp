// ============================================================
// STUB 引擎（阶段一）：返回 04_rate_results.md 表1 基线费率。
// 依据工单书 §3"stub解耦"：W3/W4 对本引擎开发，接口=src/engine/types.ts §0契约，
// 阶段二 src/engine/index.ts 切换到真引擎（calculator.py 移植），UI 零改动。
// 表1数值为工单书明文授权的 stub 数据源（本文件是唯一允许出现该组基线数字的地方）。
// 展示因子调节按 factor_tables.json 系数做方向性缩放（保证 T302/T601 的重算流与风险方向验证）。
// ============================================================
import segmentsJson from '../data/segments.json';
import assumedJson from '../data/segments_assumed.json';
import tablesJson from '../data/factor_tables.json';
import type {
  QuoteInput,
  QuoteResult,
  SegmentQuote,
  St,
  TraceItem,
} from './types';

/**
 * 段档案视图 = 权威段（segments.json，calculator.py 导出）+ 假设联络段（segments_assumed.json）。
 * 假设段 RT-16~19（卑谬线/敏建线/东岸公路/东枝线）系用户授权的演示用联络段：
 * 内置因子按同类权威段类比推档（[E]推定·[L]待确认），使多方案对比成立；
 * 15 个权威段及其 04 表 1 基线、T501 差分矩阵不受影响（均只覆盖权威段）。
 */
export const SEGMENTS = { ...segmentsJson, ...assumedJson } as Record<
  string,
  {
    id: string;
    corr: string;
    name: string;
    d: number;
    fr01: number;
    fr03: string;
    fr04: string;
    ct: number;
    st: St;
    port_tau: number;
    bmult: number;
    hawkes: boolean;
    Lflag: boolean;
    fr06: string;
    fr07: number;
    fr08: number;
    ct03: string;
    nodes: number[];
  }
>;

const T = tablesJson as unknown as FactorTables;
type FactorTables = {
  RAIN_WEAR: Record<string, number>;
  RAIN_V: Record<string, number>;
  W_WATER: Record<string, number>;
  FR01_C: Record<string, number>;
  FR03_C: Record<string, number>;
  FR04_C: Record<string, number>;
  FR05_C: Record<string, number>;
  FR06: Record<string, number[]>;
  FR07: Record<string, number>;
  FR08: Record<string, number>;
  FR09: Record<string, number>;
  FR10: Record<string, number[]>;
  FR11: Record<string, number>;
  FR12: Record<string, number>;
  FR13: Record<string, number>;
  FR14: Record<string, number>;
  FR15: Record<string, number[]>;
  SV01: Record<string, number[]>;
  SV03: Record<string, number>;
  SV04: Record<string, number[]>;
  CT03: Record<string, number>;
  constants: { loading: number; deductible: number };
};

/** 04_rate_results.md 表1（2026-10-02快照 · 旱季基准 · 纸箱 · 全基准档） */
const BASELINE: Record<string, { pure: number; cat: number; freq: number; rate: number }> = {
  'RT-01': { pure: 0.227, cat: 0.04, freq: 3.5, rate: 0.151 },
  'RT-02': { pure: 0.032, cat: 0.003, freq: 0.5, rate: 0.0318 },
  'RT-03': { pure: 0.045, cat: 0.004, freq: 0.8, rate: 0.0377 },
  'RT-04': { pure: 0.01, cat: 0.001, freq: 0.2, rate: 0.0198 },
  'RT-05': { pure: 0.043, cat: 0.004, freq: 0.8, rate: 0.0114 },
  'RT-06': { pure: 0.008, cat: 0.002, freq: 0.1, rate: 0.0072 },
  'RT-07': { pure: 0.076, cat: 0.008, freq: 1.7, rate: 0.0302 },
  'RT-08': { pure: 0.643, cat: 0.078, freq: 31.3, rate: 0.1669 },
  'RT-09': { pure: 0.367, cat: 0.044, freq: 5.9, rate: 0.2448 },
  'RT-10': { pure: 2.077, cat: 0.997, freq: 30.2, rate: 0.7419 },
  'RT-11': { pure: 0.502, cat: 0.114, freq: 7.2, rate: 0.335 },
  'RT-12': { pure: 0.058, cat: 0.004, freq: 1.1, rate: 0.0303 },
  'RT-13': { pure: 4.593, cat: 0.268, freq: 99.8, rate: 0.3828 },
  'RT-14': { pure: 2.885, cat: 1.399, freq: 44.7, rate: 0.7213 },
  'RT-15': { pure: 0.651, cat: 0.055, freq: 15.3, rate: 0.2829 },
};

/** 契约 sv01 业务值 → factor_tables.json SV01 键 */
const SV01_KEY = { 纸箱: '纸箱', 帆布: '防雨帆布', 托盘: '防雨+托盘' } as const;

/** 展示/包装选择 → 方向性缩放乘数（基准档=1.0；真实封顶与交互项由真引擎负责） */
function displayMultiplier(input: QuoteInput): { mult: number; trace: TraceItem[] } {
  const d = input.display;
  const trace: TraceItem[] = [];
  let m = 1;
  const pick = (factor: string, table: Record<string, number>, level?: string) => {
    if (!level) return;
    const c = table[level];
    if (c === undefined) return;
    m *= c;
    trace.push({ factor, level, coef: c });
  };
  pick('FR-05承运商', T.FR05_C, d.fr05);
  pick('FR-09司机', T.FR09, d.fr09);
  pick('FR-12出险记录', T.FR12, d.fr12);
  pick('FR-13货值', T.FR13, d.fr13);
  pick('FR-14发车时段', T.FR14, d.fr14);
  if (d.fr10) {
    m *= T.FR10[d.fr10][0] * T.FR10[d.fr10][1]; // 事故维×磨损维
    trace.push({ factor: 'FR-10车况', level: d.fr10, coef: T.FR10[d.fr10][0] * T.FR10[d.fr10][1] });
  }
  if (d.fr11) {
    m *= T.FR11[d.fr11];
    trace.push({ factor: 'FR-11押运', level: d.fr11, coef: T.FR11[d.fr11] });
  }
  // 易损/装载/包装/货物：按雨季水损权重混合（w_water 口径与 SPEC §3 同构，方向一致）
  const ww = T.W_WATER[String(input.rain)];
  const sv3 = T.SV03[d.sv03 ?? '普通服装'];
  const sv4 = T.SV04[d.sv04 ?? '篷布车'];
  const sv1 = T.SV01[SV01_KEY[input.sv01]];
  const blend = (cw: number, cm: number) => ww * cw + (1 - ww) * cm;
  const mSv03 = blend(sv3, sv3);
  const mSv04 = blend(sv4[0], sv4[1]);
  const mSv01 = blend(sv1[0], sv1[1]);
  m *= mSv03 * mSv04 * mSv01;
  if (d.sv03) trace.push({ factor: 'SV-03易损', level: d.sv03, coef: mSv03 });
  if (d.sv04) trace.push({ factor: 'SV-04装载', level: d.sv04, coef: mSv04 });
  trace.push({ factor: 'SV-01包装', level: input.sv01, coef: mSv01 });
  trace.push({ factor: 'SV-02货物', level: input.sv02, coef: input.sv02 === '杂货' ? 0.5 : 1 });
  if (input.sv02 === '杂货') m *= 0.5; // SV-02 杂货：水损维×0.5（SPEC §4；引擎内常量，JSON 未导出该表）
  return { mult: m, trace };
}

/** 段档案内置因子追踪（只读展示用） */
function builtInTrace(sid: string): TraceItem[] {
  const s = SEGMENTS[sid];
  if (!s) return [];
  return [
    { factor: 'FR-01道路等级', level: `${s.fr01}级`, coef: T.FR01_C[String(s.fr01)] },
    { factor: 'FR-03治安热度', level: s.fr03, coef: T.FR03_C[s.fr03] },
    { factor: 'FR-04查验滞留', level: s.fr04, coef: T.FR04_C[s.fr04] },
    { factor: 'FR-06地形', level: s.fr06, coef: T.FR06[s.fr06][0] },
    { factor: 'FR-07路宽', level: `${s.fr07}m`, coef: T.FR07[String(s.fr07)] },
    { factor: 'FR-08夜禁', level: `档${s.fr08}`, coef: T.FR08[String(s.fr08)] },
    { factor: 'CT-01冲突等级', level: `L${s.ct}`, coef: 1 },
    { factor: 'CT-03替代路线', level: s.ct03, coef: T.CT03[s.ct03] },
    { factor: 'ST-01态势', level: `S${s.st}`, coef: 1 },
  ];
}

export function quote(input: QuoteInput): QuoteResult {
  const perSegment: SegmentQuote[] = [];
  let sumPure = 0;
  let sumD = 0;
  for (const sid of input.segments) {
    const seg = SEGMENTS[sid];
    const base = BASELINE[sid];
    if (!seg || !base) continue;
    const { mult, trace } = displayMultiplier(input);
    const pure = base.pure * mult;
    perSegment.push({
      sid,
      rate: base.rate * mult,
      pure,
      catShare: base.cat * mult,
      freq: base.freq / 100,
      paused: false,
      capped: false,
      trace: [...builtInTrace(sid), ...trace],
      vEff: null,
      t: null,
      dWear: null,
      lamAcc: null,
      lamCat: null,
      regPart: (base.pure - base.cat) * mult,
      st: input.st ?? seg.st,
    });
    sumPure += pure;
    sumD += seg.d;
  }
  return {
    perSegment,
    total: {
      pureRate: sumPure,
      grossRate: sumPure / (1 - T.constants.loading),
      ratePer100km: sumD > 0 ? (sumPure / sumD) * 100 : 0,
    },
  };
}
