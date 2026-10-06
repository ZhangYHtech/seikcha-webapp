// ============================================================
// SEIKCHA MC 合成引擎（T202 · W2）
// 对 calculator.py L296-380（_mc_functions/sim_segment）逐行移植：
//   - 固定 seed 可复现 RNG（mulberry32，同输入两次调用逐位一致）
//   - N 默认 20 万（Float64Array typed array）
//   - per-segment 输出：费率/纯保费/巨灾占比/出险率/暂停/封顶 + 因子trace
//   - 保留 SPEC §7 快速估算兜底（core.quickEstimate → quoteQuick）
// 消费顺序与 Python 版一致：n_acc → n_cat → wear → 事故分维损失 → 巨灾后果矩阵。
// ============================================================
import {
  CAP_RATE,
  CAP_TRIP,
  CV_M,
  CV_W,
  CAT_SEV_CV,
  DED,
  DEFAULT_N,
  GROSS,
  MU_M,
  MU_W,
  SEED,
  SV02,
  T,
  displayFactors,
  eScat,
  getSeg,
  lambdaAcc,
  lambdaCat,
  lognormParams,
  quickEstimate,
  wearMean,
  type SegLike,
} from './core';
import type {
  DisplayLevels,
  InfoSnapshot,
  QuoteInput,
  QuoteResult,
  SegmentQuote,
  St,
  TraceItem,
} from './types';

// ---- 固定种子可复现 RNG（mulberry32：确定性、质量满足 20万×~10次抽样） ----
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normal(rng: () => number): number {
  let u1 = rng();
  if (u1 < 1e-300) u1 = 1e-300;
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function lognormal(rng: () => number, mu: number, sigma: number): number {
  return Math.exp(mu + sigma * normal(rng));
}

/** Poisson 抽样：λ≤30 用 Knuth 乘法；>30 正态近似（封顶使实际 λ 远小于 30，此支为防炸保底） */
function poisson(rng: () => number, lam: number): number {
  if (lam <= 0) return 0;
  if (lam > 30) return Math.max(0, Math.round(lam + Math.sqrt(lam) * normal(rng)));
  const L = Math.exp(-lam);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= rng();
  } while (p > L);
  return k - 1;
}

/** 巨灾事件类型抽样（SHARES[st] 五类份额，单均匀数查累积表） */
function drawCatType(rng: () => number, shares: number[]): number {
  const u = rng();
  let acc = 0;
  for (let j = 0; j < shares.length - 1; j++) {
    acc += shares[j];
    if (u < acc) return j;
  }
  return shares.length - 1;
}

/** nth element（原位快速选择，Hoare 分区 + 三数取中），用于 TVaR99 的 top-1% 精确均值 */
function nthElement(a: Float64Array, idx: number): void {
  let lo = 0;
  let hi = a.length - 1;
  while (lo < hi) {
    const mid = lo + ((hi - lo) >> 1);
    const x = a[mid];
    const y = a[lo];
    const z = a[hi];
    const pivot = x < y ? (y < z ? y : x < z ? x : z) : x < z ? x : y < z ? z : y;
    let i = lo;
    let j = hi;
    while (i <= j) {
      while (a[i] < pivot) i++;
      while (a[j] > pivot) j--;
      if (i <= j) {
        const tmp = a[i];
        a[i] = a[j];
        a[j] = tmp;
        i++;
        j--;
      }
    }
    if (idx <= j) hi = j;
    else if (idx >= i) lo = i;
    else break;
  }
}

// ---- 段种子（calculator.py L352）：SEED + 段号后两位；无数字后缀 → SEED+99 ----
export function segSeed(sid: string): number {
  const tail = sid.slice(-2);
  return /^\d\d$/.test(tail) ? SEED + parseInt(tail, 10) : SEED + 99;
}

export interface SegmentSim {
  pure: number;
  reg: number;
  cat: number;
  lamA: number;
  lamC: number | null;
  T: number;
  vEff: number;
  dWear: number;
  freq: number;
  tvar: number;
  pCat: number | null;
  paused: boolean;
  capped: boolean;
  perKm: number;
  method: 'MC';
}

/** 单段 MC 模拟（calculator.py L340-378 sim_segment 逐行移植） */
export function simSegment(
  sid: string,
  seg: SegLike,
  rain: number,
  st: St,
  cw: number,
  cm: number,
  fr13: number,
  ww: number,
  lamA: number,
  lamC: number | null,
  mWear: number,
  ct03Coef: number,
  tt: number,
  vEff: number,
  n: number = DEFAULT_N,
): SegmentSim {
  const paused = lamC === null;
  const blend = ww * cw + (1 - ww) * cm;
  const [muW, sW] = lognormParams(mWear * blend, 0.4);
  const [mw, sw] = lognormParams(MU_W * cw, CV_W);
  const [mm, sm] = lognormParams(MU_M * cm, CV_M);
  const rng = mulberry32(segSeed(sid));
  const shares = T.SHARES[String(st)];
  // 巨灾各类型 (p_TL, μ_p) 预解析（E4/E5 部分均值 ×CT03）；部分损失 CV=0.4
  const types = ['E1', 'E2', 'E3', 'E4', 'E5'];
  const pTl = new Float64Array(5);
  const muLog = new Float64Array(5);
  const sLog = Math.sqrt(Math.log(1 + CAT_SEV_CV * CAT_SEV_CV));
  types.forEach((t, j) => {
    const [p, m0] = T.CONSEQ[t];
    pTl[j] = p;
    const mu = t === 'E4' || t === 'E5' ? m0 * ct03Coef : m0;
    muLog[j] = Math.log(mu) - (sLog * sLog) / 2;
  });

  const nTrials = n;
  const pay = new Float64Array(nTrials);
  let sumPay = 0;
  let sumRegPay = 0;
  let freqCount = 0;

  for (let i = 0; i < nTrials; i++) {
    const nAcc = poisson(rng, lamA);
    const nCat = poisson(rng, paused ? 0 : lamC!);
    const wear = lognormal(rng, muW, sW);
    let acc = 0;
    for (let e = 0; e < nAcc; e++) {
      acc += rng() < ww ? lognormal(rng, mw, sw) : lognormal(rng, mm, sm);
    }
    let catLoss = 0;
    for (let e = 0; e < nCat; e++) {
      const j = drawCatType(rng, shares);
      catLoss += rng() < pTl[j] ? 1.0 : lognormal(rng, muLog[j], sLog);
    }
    const reg = (wear + acc) * fr13;
    const L = Math.min(1.0, reg + catLoss);
    const p = Math.max(0, L - DED);
    pay[i] = p;
    sumPay += p;
    if (L > DED) freqCount++;
    sumRegPay += Math.max(0, Math.min(1.0, reg) - DED);
  }

  let pure = sumPay / nTrials;
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
  const freq = freqCount / nTrials;
  const meanRegPay = sumRegPay / nTrials;
  const catTerm = pure - Math.min(meanRegPay, pure);
  // TVaR99：排序后 [int(n*0.99):] 均值 → 快速选择等价实现（同值集合，均值逐位一致）
  const copy = pay.slice();
  const start = Math.floor(nTrials * 0.99);
  nthElement(copy, start);
  let sumTop = 0;
  for (let i = start; i < nTrials; i++) sumTop += copy[i];
  const tvar = sumTop / (nTrials - start);
  return {
    pure,
    reg: pure - catTerm,
    cat: catTerm,
    lamA,
    lamC,
    T: tt,
    vEff,
    dWear: mWear,
    freq,
    tvar,
    pCat: paused ? null : 1 - Math.exp(-lamC!),
    paused,
    capped,
    perKm,
    method: 'MC',
  };
}

// ---- SV 混合系数组装（SPEC §3：c_w=SV01_w×SV04_w×SV03×SV02_w；c_m 同构） ----
const SV01_KEY: Record<string, string> = { 纸箱: '纸箱', 帆布: '防雨帆布', 托盘: '防雨+托盘' };

export function svBlend(input: Pick<QuoteInput, 'sv01' | 'sv02' | 'display'>): {
  cw: number;
  cm: number;
  trace: TraceItem[];
} {
  const sv1 = T.SV01[SV01_KEY[input.sv01]];
  const sv4 = T.SV04[input.display.sv04 ?? '篷布车'];
  const sv3 = T.SV03[input.display.sv03 ?? '普通服装'];
  const sv2 = SV02[input.sv02];
  const cw = sv1[0] * sv4[0] * sv3 * sv2[0];
  const cm = sv1[1] * sv4[1] * sv3 * sv2[1];
  const trace: TraceItem[] = [
    { factor: 'SV-01(水维)', level: input.sv01, coef: sv1[0] },
    { factor: 'SV-01(机械维)', level: input.sv01, coef: sv1[1] },
    { factor: 'SV-02(水维)', level: input.sv02, coef: sv2[0] },
    { factor: 'SV-02(机械维)', level: input.sv02, coef: sv2[1] },
    { factor: 'SV-03', level: input.display.sv03 ?? '普通服装', coef: sv3 },
    { factor: 'SV-04(水维)', level: input.display.sv04 ?? '篷布车', coef: sv4[0] },
    { factor: 'SV-04(机械维)', level: input.display.sv04 ?? '篷布车', coef: sv4[1] },
  ];
  return { cw, cm, trace };
}

// ---- 因子 trace（factor=内部代号，业务名由 W3 映射；含封顶与暴露细节） ----
function buildTrace(
  seg: SegLike,
  rain: number,
  st: St,
  la: ReturnType<typeof lambdaAcc>,
  lc: ReturnType<typeof lambdaCat>,
  display: DisplayLevels | undefined,
  info: InfoSnapshot,
  wWater: number,
  dWear: number,
): TraceItem[] {
  const df = displayFactors(display);
  const fr15Level = info.fr15;
  const items: TraceItem[] = [
    { factor: 'FR-01', level: `${seg.fr01}级路`, coef: T.FR01_C[String(seg.fr01)] },
    { factor: 'FR-01haz', level: '风险折算', coef: la.fr01Haz },
    { factor: 'FR-03', level: info.fr03 === '段基准' ? `${seg.fr03}(段基准)` : info.fr03, coef: la.f3 },
    { factor: 'FR-04', level: seg.fr04, coef: T.FR04_C[seg.fr04] },
    { factor: 'FR-04τ', level: '节点滞留h', coef: T.FR04_TAU[seg.fr04] },
    { factor: 'FR-05', level: display?.fr05 ?? '一般', coef: la.c5 },
    { factor: 'FR-06(速)', level: seg.fr06, coef: T.FR06[seg.fr06][0] },
    { factor: 'FR-06(险)', level: seg.fr06, coef: T.FR06[seg.fr06][1] },
    { factor: 'FR-07', level: `${seg.fr07}m`, coef: T.FR07[String(seg.fr07)] },
    { factor: 'FR-08', level: `夜禁档${seg.fr08}`, coef: T.FR08[String(seg.fr08)] },
    { factor: 'FR-09', level: display?.fr09 ?? '常规', coef: la.c9 },
    { factor: 'FR-10(事故)', level: display?.fr10 ?? '一般', coef: la.c10a },
    { factor: 'FR-10(磨损)', level: display?.fr10 ?? '一般', coef: df.fr10[1] },
    { factor: 'FR-11', level: display?.fr11 ?? '无', coef: la.c11 },
    { factor: 'FR-12', level: display?.fr12 ?? '一般', coef: la.c12 },
    { factor: 'FR-13', level: display?.fr13 ?? '<20k', coef: la.c13 },
    { factor: 'FR-14', level: display?.fr14 ?? '白天', coef: la.c14 },
    { factor: 'FR-15(速)', level: fr15Level, coef: la.fr15V },
    { factor: 'FR-15(水)', level: fr15Level, coef: la.fr15W },
    { factor: 'RAIN-V', level: `季节${rain}`, coef: T.RAIN_V[String(rain)] },
    { factor: 'RAIN-WEAR', level: `季节${rain}`, coef: T.RAIN_WEAR[String(rain)] },
    { factor: 'W-WATER', level: `水损权重·季${rain}`, coef: wWater },
    { factor: 'D-WEAR', level: '磨损均值(货值占比)', coef: dWear },
    { factor: 'ST-01(f_b)', level: `S${st}`, coef: la.fB },
    { factor: 'ST-01(f_c)', level: `S${st}`, coef: T.F_C[String(st)] },
    { factor: 'CT-01(λd)', level: `L${seg.ct}`, coef: T.LAM_D[String(seg.ct)] },
    { factor: 'CT-03', level: seg.ct03, coef: T.CT03[seg.ct03] },
  ];
  if (lc.paused) {
    items.push({ factor: 'CT-05/06', level: '关闭→暂停承保', coef: 0 });
  } else {
    items.push({ factor: 'CT-04', level: '冲突波动', coef: lc.ct4 });
    items.push({ factor: 'CT-05', level: info.ct05, coef: lc.ct5 });
    items.push({ factor: 'CT-06', level: info.ct06, coef: lc.ct6 });
  }
  if (seg.hawkes) items.push({ factor: 'Hawkes', level: '证实遇袭走廊', coef: 1.5 });
  if (la.c5 !== df.fr05 || la.c9 !== df.fr09 || la.c10a !== df.fr10[0]) {
    items.push({ factor: 'CAP-展示', level: '展示乘积×2.0封顶回拉', coef: 2.0 });
  }
  return items;
}

// ============================================================
// quote()（§0 契约统一入口；method 字段为 §0 之外只增项）
// ============================================================

/**
 * 方案级聚合（多方案组合共用同一口径）：
 *   纯保费/票 = Σ 段纯保费（暂停段不计）
 *   毛保费   = 纯保费 ÷ (1−loading)（loading 来自 factor_tables.json constants）
 *   费率/百公里 = 纯保费 ÷ 总里程 × 100
 * quote() 内部亦经本函数产出 total，保证单路径与多方案聚合口径逐位一致。
 */
export function summarize(perSegment: SegmentQuote[]): QuoteResult['total'] {
  let sumPure = 0; // 货值%
  let sumD = 0;
  for (const s of perSegment) {
    sumD += getSeg(s.sid)?.d ?? 0;
    if (!s.paused) sumPure += s.pure;
  }
  return {
    pureRate: sumPure,
    grossRate: sumPure * GROSS,
    ratePer100km: sumD > 0 ? (sumPure / sumD) * 100 : 0,
  };
}

export function quote(input: QuoteInput): QuoteResult {
  const perSegment: SegmentQuote[] = [];
  const nMc = input.nMc ?? DEFAULT_N;
  for (const sid of input.segments) {
    const seg = getSeg(sid);
    if (!seg) continue;
    const st: St = input.st ?? seg.st;
    const la = lambdaAcc(seg, input.rain, st, input.display, input.info);
    const lc = lambdaCat(seg, st, input.info);
    const { cw, cm } = svBlend(input);
    const dfFr13 = input.display.fr13 ? T.FR13[input.display.fr13] : 1;
    const ww = T.W_WATER[String(input.rain)] * la.fr15W;
    const mWear = wearMean(seg, input.rain, input.display);
    const ct03Coef = T.CT03[seg.ct03];
    if (lc.paused) {
      // 节点/口岸关闭：暂停承保（产品规则优先），不计入保费合计
      perSegment.push({
        sid,
        rate: 0,
        pure: 0,
        catShare: 0,
        freq: null,
        paused: true,
        capped: false,
        trace: buildTrace(seg, input.rain, st, la, lc, input.display, input.info, ww, mWear),
        vEff: la.vEff,
        t: la.T,
        dWear: mWear,
        lamAcc: la.lam,
        lamCat: null,
        regPart: null,
        st,
      });
      continue;
    }
    const sim = simSegment(
      sid, seg, input.rain, st, cw, cm, dfFr13, ww,
      la.lam, lc.lam, mWear, ct03Coef, la.T, la.vEff, nMc,
    );
    perSegment.push({
      sid,
      rate: sim.perKm * 100 * 100, // pure占比/km → %/100km（×100单位换算再转百分比）
      pure: sim.pure * 100,
      catShare: sim.cat * 100,
      freq: sim.freq,
      paused: false,
      capped: sim.capped,
      trace: buildTrace(seg, input.rain, st, la, lc, input.display, input.info, ww, mWear),
      vEff: la.vEff,
      t: la.T,
      dWear: mWear,
      lamAcc: la.lam,
      lamCat: lc.lam,
      regPart: sim.reg * 100,
      st,
    });
  }
  return {
    perSegment,
    total: summarize(perSegment),
    method: 'MC',
  };
}

/** 快速估算入口（SPEC §7 兜底口径；供 verify 与低算力场景） */
export function quoteQuick(input: QuoteInput): QuoteResult {
  const perSegment: SegmentQuote[] = [];
  for (const sid of input.segments) {
    const seg = getSeg(sid);
    if (!seg) continue;
    const st: St = input.st ?? seg.st;
    const la = lambdaAcc(seg, input.rain, st, input.display, input.info);
    const lc = lambdaCat(seg, st, input.info);
    const { cw, cm } = svBlend(input);
    const q = quickEstimate(seg, input.rain, st, cw, cm, input.display, input.info);
    const ww = T.W_WATER[String(input.rain)] * la.fr15W;
    const mWear = wearMean(seg, input.rain, input.display);
    perSegment.push({
      sid,
      rate: q.perKm * 100 * 100,
      pure: q.pure * 100,
      catShare: q.cat * 100,
      freq: null,
      paused: q.paused,
      capped: q.capped,
      trace: buildTrace(seg, input.rain, st, la, lc, input.display, input.info, ww, mWear),
      vEff: q.vEff,
      t: q.T,
      dWear: q.dWear,
      lamAcc: q.lamA,
      lamCat: q.lamC,
      regPart: q.reg * 100,
      st,
    });
  }
  return {
    perSegment,
    total: summarize(perSegment),
    method: 'quick',
  };
}

// ============================================================
// 口径自查表（T202 DoD）：mc.ts ↔ calculator.py 逐行对照
//   mulberry32/normal/lognormal/poisson ↔ numpy default_rng（仅统计等价，不做位级复刻；
//     同输入两次调用逐位一致由固定 seed+纯函数保证；T501 判定线=统计量≤3%）
//   segSeed                ↔ L352（SEED+段号后两位，无数字→SEED+99）
//   simSegment             ↔ L340-378（抽样顺序 n_acc→n_cat→wear→acc分维→cat后果矩阵；
//     reg=(wear+acc)×fr13；L=min(1,·)；pay=max(0,L−1%)；cat_term=pure−min(mean(pay_reg),pure)；
//     freq=P(L>1%)；TVaR99=[int(n*0.99):]均值；12%/3% 封顶）
//   quote()/quoteQuick()   ↔ §0 契约统一入口 + quick_estimate 兜底
// ============================================================
