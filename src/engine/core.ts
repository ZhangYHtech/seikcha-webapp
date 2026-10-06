// ============================================================
// SEIKCHA 确定性核心（T201 · W2）
// 对 calculator.py 逐函数移植（口径自查表见文件尾注释）。
// 一切系数来自 src/data/factor_tables.json（=calculator.py export-json 产物），
// 唯一例外：SV-02 货物表（SPEC.md §4 明文给出，JSON 未导出），见 SV02 常量。
// ============================================================
import factorTables from '../data/factor_tables.json';
import { SEGMENTS } from './stub'; // 段档案（与 segments.json 同源的类型化视图）
import type { DisplayLevels, InfoSnapshot, St } from './types';
import type { FactorTablesJson } from './schema';

export const T = factorTables as unknown as FactorTablesJson;

// ---- 全局常量（calculator.py L25-29, L42-45, L76-80；权威=factor_tables.json constants） ----
export const SEED = T.constants.seed; // 42
export const DEFAULT_N = T.constants.n_mc; // 200000
export const DED = T.constants.deductible; // 免赔额 1% 货值
export const LOADING = T.constants.loading; // 35%
export const GROSS = 1 / (1 - LOADING);
const W_KM = T.constants.w_km; // 6e-6 /km
const LAMBDA_ACC_BASE = T.constants.lambda_acc_base; // 3e-4 /h
const WEAR_CV = T.constants.wear_cv; // 0.4
export const MU_W = T.constants.mu_w; // 水损维均值 18%
export const CV_W = T.constants.cv_w; // 0.6
export const MU_M = T.constants.mu_m; // 机械维均值 4%
export const CV_M = T.constants.cv_m; // 0.5
const V_MIN = T.constants.v_min; // 15 km/h
const CAP_DISPLAY = T.constants.caps.display; // 展示乘积封顶 2.0
const CAP_INFO_FREQ = T.constants.caps.info_freq; // 信息频率偏离封顶 2.0
const CAP_INFO_CAT = T.constants.caps.info_cat; // 信息巨灾乘积封顶 2.0
export const CAP_TRIP = T.constants.caps.trip; // 单票 12%
export const CAP_RATE = T.constants.caps.rate100; // 费率/百公里 3%
const TAU_BRIDGE = 0.5; // 桥梁滞留 h（calculator.py TAU_N）
const TAU_FERRY = 2.0; // 渡口滞留 h
const HAWKES_MULT = 1.5; // 证实遇袭走廊（SPEC §4）
export const CAT_SEV_CV = 0.4; // 巨灾部分损失 CV（calculator.py L336）

/** SV-02 货物 (c_w, c_m)——SPEC.md §4 明文；factor_tables.json 未导出该表 */
export const SV02: Record<string, [number, number]> = { 服装: [1.0, 1.0], 杂货: [0.5, 1.0] };

// ---- calculator.py L135-137 phi(x)：标准正态CDF ----
/** 高精度 erf：|x|<2.2 幂级数，否则 erfc 连分式（双精度级，对齐 Python math.erf） */
export function erf(x: number): number {
  const ax = Math.abs(x);
  const s = x >= 0 ? 1 : -1;
  if (ax < 2.2) {
    // erf(x) = 2/√π · Σ (-1)^n·x^(2n+1)/(n!·(2n+1))
    const x2 = x * x;
    let sum = 0;
    let num = x; // x^(2n+1)（带符号）
    let fact = 1; // n!
    for (let n = 0; n < 200; n++) {
      const term = num / (fact * (2 * n + 1));
      sum += n % 2 === 0 ? term : -term;
      num *= x2;
      fact *= n + 1;
      if (Math.abs(term) < 1e-18) break;
    }
    return (s * (2 / Math.sqrt(Math.PI)) * sum) / 1;
  }
  // erfc(x) 连分式（Lentz 改进型）
  const z = ax;
  let f = z;
  let c = 1e300;
  let d = 0;
  for (let k = 1; k < 300; k++) {
    const a = k % 2 === 1 ? k / 2 : z + k / 2;
    d = a + d;
    d = 1 / d;
    c = a + 1 / c;
    const del = c * d;
    f *= del;
    if (Math.abs(del - 1) < 1e-16) break;
  }
  const erfc = Math.exp(-z * z) / (Math.sqrt(Math.PI) * f);
  return x >= 0 ? 1 - erfc : -(1 - erfc);
}

export function phi(x: number): number {
  return 0.5 * (1 + erf(x / Math.SQRT2));
}

// ---- calculator.py L140-142 lognorm_params(m, cv) ----
export function lognormParams(m: number, cv: number): [number, number] {
  const s = Math.sqrt(Math.log(1 + cv * cv));
  return [Math.log(m) - (s * s) / 2, s];
}

// ---- calculator.py L145-154 clamp_prod：乘数封顶幂回拉 ----
export function clampProd(factors: (number | null | undefined)[], cap: number): number[] {
  const fs: number[] = [];
  for (const f of factors) {
    if (f !== null && f !== undefined) fs.push(Number(f));
  }
  let p = 1;
  for (const f of fs) p *= f;
  if (p <= cap) return fs;
  const k = Math.log(cap) / Math.log(p);
  return fs.map((f) => Math.pow(f, k));
}

// ---- calculator.py L157-166 clamp_dev：相对基准偏离封顶幂回拉 ----
export function clampDev(values: number[], benchmarks: number[], cap: number): number[] {
  const devs = values.map((v, i) => v / benchmarks[i]);
  let p = 1;
  for (const d of devs) p *= d;
  if (p <= cap) return values;
  const k = Math.log(cap) / Math.log(p);
  return benchmarks.map((b, i) => b * Math.pow(devs[i], k));
}

/** 展示因子解析（calculator.py L169-188 display_factors）：档位→系数；sv03/sv04 保留档位字符串 */
export interface DisplayFactors {
  fr05: number;
  fr09: number;
  fr10: [number, number]; // [事故, 磨损]
  fr11: number;
  fr12: number;
  fr13: number;
  fr14: number;
  sv03?: string;
  sv04?: string;
}

export function displayFactors(disp?: DisplayLevels): DisplayFactors {
  const d: DisplayFactors = { fr05: 1, fr09: 1, fr10: [1, 1], fr11: 1, fr12: 1, fr13: 1, fr14: 1 };
  if (!disp) return d;
  if (disp.fr05) d.fr05 = T.FR05_C[disp.fr05];
  if (disp.fr09) d.fr09 = T.FR09[disp.fr09];
  if (disp.fr10) d.fr10 = [T.FR10[disp.fr10][0], T.FR10[disp.fr10][1]];
  if (disp.fr11) d.fr11 = T.FR11[disp.fr11];
  if (disp.fr12) d.fr12 = T.FR12[disp.fr12];
  if (disp.fr13) d.fr13 = T.FR13[disp.fr13];
  if (disp.fr14) d.fr14 = T.FR14[disp.fr14];
  if (disp.sv03) d.sv03 = disp.sv03;
  if (disp.sv04) d.sv04 = disp.sv04;
  return d;
}

/** 信息因子解析（calculator.py L191-196 info_factors）：fr03 '段基准'→段档案档 */
export function infoFactors(info: InfoSnapshot, segFr03: string): {
  fr03: number;
  fr15: string;
  ct04: number;
  ct05: string;
  ct06: string;
} {
  const fr03Level = info.fr03 === '段基准' ? segFr03 : info.fr03;
  return {
    fr03: T.FR03_C[fr03Level],
    fr15: info.fr15,
    ct04: info.ct04,
    ct05: info.ct05,
    ct06: info.ct06,
  };
}

export interface SegLike {
  d: number;
  fr01: number;
  fr03: string;
  fr04: string;
  ct: number;
  st: St;
  nodes: number[]; // [检查站, 桥梁, 渡口, 口岸]
  port_tau: number;
  bmult: number;
  hawkes: boolean;
  fr06: string;
  fr07: number;
  fr08: number;
  ct03: string;
}

export function getSeg(sid: string): SegLike | undefined {
  const s = SEGMENTS[sid];
  if (!s) return undefined;
  return {
    d: s.d,
    fr01: s.fr01,
    fr03: s.fr03,
    fr04: s.fr04,
    ct: s.ct,
    st: s.st as St,
    nodes: s.nodes,
    port_tau: s.port_tau,
    bmult: s.bmult,
    hawkes: s.hawkes,
    fr06: s.fr06,
    fr07: s.fr07,
    fr08: s.fr08,
    ct03: s.ct03,
  };
}

// ---- calculator.py L200-220 lambda_acc：事故通道强度 + 暴露 ----
export interface LambdaAccResult {
  lam: number;
  fr15V: number;
  fr15W: number;
  T: number;
  vEff: number;
  c5: number;
  c9: number;
  c10a: number;
  c11: number;
  c12: number;
  c13: number;
  c14: number;
  f3: number;
  fB: number;
  fr01Haz: number;
}

export function lambdaAcc(
  seg: SegLike,
  rain: number,
  st: St,
  disp: DisplayLevels | undefined,
  info: InfoSnapshot,
): LambdaAccResult {
  const df = displayFactors(disp);
  const inf = infoFactors(info, seg.fr03);
  // 展示乘积封顶（fr05,fr09,fr10事故维,fr11,fr12,fr13,fr14）×2.0
  const [c5, c9, c10a, c11, c12, c13, c14] = clampProd(
    [df.fr05, df.fr09, df.fr10[0], df.fr11, df.fr12, df.fr13, df.fr14],
    CAP_DISPLAY,
  );
  const fr03B = T.FR03_C[seg.fr03];
  const [fr15V0, fr15W0] = T.FR15[inf.fr15];
  const equiv = Math.max(1 / fr15V0, fr15W0);
  // 信息频率偏离封顶：[fr03/段基准, equiv/1.0] 乘积×2.0 幂回拉
  const [f3, eq] = clampDev([inf.fr03, equiv], [fr03B, 1.0], CAP_INFO_FREQ);
  const k = equiv > 1 ? Math.log(eq) / Math.log(equiv) : 1.0;
  const fr15V = 1 / eq;
  const fr15W = Math.pow(fr15W0, k);
  const vEff = Math.max(V_MIN, T.V_BASE[String(seg.fr01)] * T.RAIN_V[String(rain)] * T.FR06[seg.fr06][0] * fr15V);
  const [nC, nB, nF, nP] = seg.nodes;
  const tau =
    nC * T.FR04_TAU[seg.fr04] + nB * TAU_BRIDGE + nF * TAU_FERRY + nP * seg.port_tau;
  const tt = (seg.d / vEff) * T.FR08[String(seg.fr08)] + tau;
  const fr01Haz = 1 + 0.4 * (T.FR01_C[String(seg.fr01)] - 1);
  const lam =
    LAMBDA_ACC_BASE *
    tt *
    fr01Haz *
    T.FR06[seg.fr06][1] *
    T.FR07[String(seg.fr07)] *
    f3 *
    T.F_B[String(st)] *
    c11 *
    T.FR04_C[seg.fr04] *
    c5 *
    c9 *
    c10a *
    c12 *
    c14;
  return { lam, fr15V, fr15W, T: tt, vEff, c5, c9, c10a, c11, c12, c13, c14, f3, fB: T.F_B[String(st)], fr01Haz };
}

// ---- calculator.py L223-239 lambda_cat：巨灾通道强度；节点/口岸关闭→null（暂停） ----
export interface LambdaCatResult {
  lam: number | null;
  ct4: number;
  ct5: number;
  ct6: number;
  paused: boolean;
}

export function lambdaCat(seg: SegLike, st: St, info: InfoSnapshot): LambdaCatResult {
  const inf = infoFactors(info, seg.fr03);
  if (T.CT05[inf.ct05] === null || T.CT06[inf.ct06] === null) {
    return { lam: null, ct4: inf.ct04, ct5: NaN, ct6: NaN, paused: true };
  }
  // 信息巨灾乘积封顶（CT04×CT05×CT06）×2.0
  // ct04 传档位 0~3，系数按评分卡查 CT04 表（2026-10-05 口径修正，与 calculator.py lambda_cat 同步）；
  // 原先直乘原始值，0 档会把巨灾强度乘成 0、3 档放大成 ×3，与 rating_cards.CT04 不符
  const [ct4, ct5, ct6] = clampProd([T.CT04[String(inf.ct04)], T.CT05[inf.ct05], T.CT06[inf.ct06]], CAP_INFO_CAT);
  const [nC, nB, nF, nP] = seg.nodes;
  const fc = T.F_C[String(st)];
  let lam = seg.d * T.LAM_D[String(seg.ct)] * fc * ct4;
  lam += nC * T.FR04_TAU[seg.fr04] * T.LAM_N.check * fc * ct5;
  lam += nB * TAU_BRIDGE * seg.bmult * T.LAM_N.bridge * fc * ct5;
  lam += nF * TAU_FERRY * T.LAM_N.ferry * fc * ct5;
  lam += nP * seg.port_tau * T.LAM_N.port * fc * ct6;
  if (seg.hawkes) lam *= HAWKES_MULT;
  return { lam, ct4, ct5, ct6, paused: false };
}

// ---- calculator.py L242-244 wear_mean：行程累积磨损均值（用未封顶 fr05/fr10磨损维） ----
export function wearMean(seg: SegLike, rain: number, disp?: DisplayLevels): number {
  const df = displayFactors(disp);
  return seg.d * W_KM * T.FR01_C[String(seg.fr01)] * T.RAIN_WEAR[String(rain)] * df.fr05 * df.fr10[1];
}

// ---- calculator.py L247-255 e_scat：巨灾单事件期望损失（货值占比） ----
export function eScat(st: St, ct03Coef: number): number {
  const types = ['E1', 'E2', 'E3', 'E4', 'E5'];
  let e = 0;
  const shares = T.SHARES[String(st)];
  types.forEach((t, j) => {
    const [pTl, muP0] = T.CONSEQ[t];
    const muP = t === 'E4' || t === 'E5' ? muP0 * ct03Coef : muP0;
    e += shares[j] * (pTl * 1.0 + (1 - pTl) * muP);
  });
  return e;
}

// ============================================================
// 快速估算兜底（T202 · SPEC §7 口径；calculator.py L259-293 quick_estimate）
// 输入 cw/cm = 完整 SV 混合系数（SV01×SV04×SV03×SV02 各维），由 mc.ts 组装。
// ============================================================
export interface QuickEstimate {
  pure: number;
  reg: number;
  cat: number;
  lamA: number;
  lamC: number | null;
  T: number;
  vEff: number;
  dWear: number;
  eSev: number;
  pCat: number | null;
  paused: boolean;
  capped: boolean;
  perKm: number;
  method: 'quick';
}

export function quickEstimate(
  seg: SegLike,
  rain: number,
  st: St,
  cw: number,
  cm: number,
  disp: DisplayLevels | undefined,
  info: InfoSnapshot,
): QuickEstimate {
  const df = displayFactors(disp);
  const la = lambdaAcc(seg, rain, st, disp, info);
  const lc = lambdaCat(seg, st, info);
  const paused = lc.paused;
  const mWear = wearMean(seg, rain, disp);
  const ww = T.W_WATER[String(rain)] * la.fr15W;
  const blend = ww * cw + (1 - ww) * cm;
  // 磨损赔付闭式: E[max(0,X−1%)]，X~Lognormal(均值 m_wear*blend, CV=0.4)
  const m = mWear * blend;
  let eWear = 0;
  if (m > 0) {
    const [mu, s] = lognormParams(m, WEAR_CV);
    eWear = m * phi((mu + s * s - Math.log(DED)) / s) - DED * phi((mu - Math.log(DED)) / s);
  }
  const eSev = ww * MU_W * cw + (1 - ww) * MU_M * cm;
  const eAcc = la.lam * eSev;
  const eReg = (Math.max(0, eWear) + eAcc) * df.fr13;
  const eCat = paused ? 0 : (1 - Math.exp(-lc.lam!)) * eScat(st, T.CT03[seg.ct03]);
  let pure = eReg + eCat;
  let capped = false;
  if (pure > CAP_TRIP) {
    pure = CAP_TRIP;
    capped = true;
  }
  let perKm = pure / seg.d;
  if (perKm * 100 > CAP_RATE) {
    perKm = CAP_RATE / 100;
    capped = true;
  }
  return {
    pure,
    reg: eReg,
    cat: eCat,
    lamA: la.lam,
    lamC: paused ? null : lc.lam,
    T: la.T,
    vEff: la.vEff,
    dWear: mWear,
    eSev,
    pCat: paused ? null : 1 - Math.exp(-lc.lam!),
    paused,
    capped,
    perKm,
    method: 'quick',
  };
}

// ============================================================
// 口径自查表（T201 DoD）：core.ts ↔ calculator.py 逐函数对照
//   erf/phi                 ↔ L135-137（erf 幂级数+连分式实现，双精度级）
//   lognormParams           ↔ L140-142
//   clampProd               ↔ L145-154（幂比例回拉，乘积恰=cap）
//   clampDev                ↔ L157-166（相对基准偏离，幂回拉）
//   displayFactors          ↔ L169-188（sv03/sv04 保留档位字符串）
//   infoFactors             ↔ L191-196（fr03 '段基准'=段档案档；fr15/ct04/ct05/ct06 缺省基准）
//   lambdaAcc               ↔ L200-220（V_eff/T 暴露、展示乘积封顶×2.0、信息偏离封顶×2.0、FR01_haz）
//   lambdaCat               ↔ L223-239（λ_d/λ_n×节点、f_c(st)、CT04查表/CT05/CT06 封顶×2.0、
//                             Hawkes×1.5、关闭→null；ct04 查表口径修正 2026-10-05，两侧同步）
//   wearMean                ↔ L242-244（未封顶 fr05/fr10磨损维）
//   eScat                   ↔ L247-255（E4/E5 部分均值×CT03）
//   SV02                    ↔ SPEC.md §4（calculator.py 未实现，缺省'服装'时恒等，不影响基线）
//   S3→暂停：引擎层按 calculator.py 语义（仅节点/口岸关闭→paused）；S3 禁售由 UI 按
//     segments.json st===3 拦截（04表1与"走廊B S0→S3递增"演示需 S3 数值可计算）。
// ============================================================
