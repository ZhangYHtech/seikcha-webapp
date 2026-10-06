// ============================================================
// 信息因子接入点（对接数据管道 docs/INTEGRATION.md v1.0，2026-10-03）
// 数据源＝每日 JSON 快照经 jsDelivr CDN 分发的"静态 API"（免鉴权、自带 CORS）。
//   取数三级回退（§2/§4）：<BASE>/<日期>.json → <BASE>/latest.json → INFO_DEFAULTS
//   业务日期按北京时间 UTC+8（todayStr，勿用 UTC 日期串）。
//   校验（§10）：任一走廊任一字段非法 → 整份作废回退，宁缺毋错。
// 权威清单与评分卡：factor_tables.json 的 rating_cards 字段。
// ct04 口径（2026-10-05 修正）：快照/本模块只传档位 0~3，系数由引擎 lambda_cat
// （calculator.py / core.ts 两侧同步）按 CT04 表查取——本文件不再做桥接转换。
// ============================================================
import type { InfoSnapshot } from './types';

/** 阶段一恒定：信息因子=默认基准档（fr03='段基准' 表示随段档案取档） */
export const INFO_DEFAULTS: InfoSnapshot = {
  fr03: '段基准',
  fr15: '平',
  ct04: 1,
  ct05: '常规',
  ct06: '正常',
};

// ---- 快照源（INTEGRATION.md §9：jsDelivr 主源；构建期用 VITE_INFO_SNAPSHOT_BASE
//      可切换 GitHub Pages 备源 / 本地 /snapshots 断网兜底，无需改代码。
//      import.meta.env 仅存在于 Vite 构建；tsx 直跑（test:engine）下为 undefined，须安全取值） ----
const SNAPSHOT_BASE: string =
  (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_INFO_SNAPSHOT_BASE ||
  'https://cdn.jsdelivr.net/gh/stone-users/seikcha-info-pipeline@main/snapshots';

const FETCH_TIMEOUT_MS = 8000; // INTEGRATION.md §2

/** 权威走廊 A~H；假设段 W/N/S 不在快照内，自动按基准档处理（§5） */
const CORRIDORS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const;
export type CorrId = (typeof CORRIDORS)[number];

// ---- 枚举校验域（=types.ts InfoSnapshot；档位序同时供最不利合并用） ----
const FR03_LEVELS = ['段基准', '低', '中', '高', '极高'] as const;
const FR15_LEVELS = ['好', '平', '暴雨', '极端'] as const;
const CT04_TIERS = [0, 1, 2, 3] as const;
const CT05_LEVELS = ['正常', '常规', '收紧', '关闭'] as const;
const CT06_LEVELS = ['通畅', '正常', '拥堵', '关闭'] as const;

/** 单日快照（已整份校验）：corridors 键=A~H，值为档位原样（ct04 是档位 0~3） */
export interface InfoDay {
  /** 快照业务日期（UTC+8；回落 latest.json 时=数据真实日期） */
  date: string;
  corridors: Record<CorrId, InfoSnapshot>;
}

function validSnap(v: unknown): InfoSnapshot | null {
  if (typeof v !== 'object' || v === null) return null;
  const o = v as Record<string, unknown>;
  if (typeof o.fr03 !== 'string' || !(FR03_LEVELS as readonly string[]).includes(o.fr03)) return null;
  if (typeof o.fr15 !== 'string' || !(FR15_LEVELS as readonly string[]).includes(o.fr15)) return null;
  if (typeof o.ct04 !== 'number' || !(CT04_TIERS as readonly number[]).includes(o.ct04)) return null;
  if (typeof o.ct05 !== 'string' || !(CT05_LEVELS as readonly string[]).includes(o.ct05)) return null;
  if (typeof o.ct06 !== 'string' || !(CT06_LEVELS as readonly string[]).includes(o.ct06)) return null;
  return {
    fr03: o.fr03 as InfoSnapshot['fr03'],
    fr15: o.fr15 as InfoSnapshot['fr15'],
    ct04: o.ct04 as InfoSnapshot['ct04'],
    ct05: o.ct05 as InfoSnapshot['ct05'],
    ct06: o.ct06 as InfoSnapshot['ct06'],
  };
}

function parseDay(raw: unknown, requestedDate: string): InfoDay | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.corridors !== 'object' || o.corridors === null) return null;
  const cs = o.corridors as Record<string, unknown>;
  const corridors = {} as Record<CorrId, InfoSnapshot>;
  for (const c of CORRIDORS) {
    const s = validSnap(cs[c]);
    if (!s) return null; // 任一走廊缺失/非法 → 整份作废（§10）
    corridors[c] = s;
  }
  // 展示用数据真实日期：优先快照自带 date（latest 回落时≠请求日期）
  const date =
    typeof o.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(o.date) ? o.date : requestedDate;
  return { date, corridors };
}

async function fetchJson(url: string): Promise<unknown> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) return null;
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return null; // 网络失败/超时/CORS → 视同缺失，走下一级
  }
}

// 按请求日期缓存（单页会话同一日期只发一次请求，§2）
const dayCache = new Map<string, InfoDay | null>();

// 历史严格加载的成功结果缓存（缺失/瞬断不缓存，供走势图重试轮补抓）
const strictCache = new Map<string, InfoDay>();

const USING_JSDELIVR = SNAPSHOT_BASE.includes('cdn.jsdelivr.net');

/**
 * jsDelivr 文件清单（一次请求探明哪些日期有存档）。
 * 缺失日期在 jsDelivr 上的 404 要 ~8s 才返回，逐日盲探会拖死走势图——先列清单再抓。
 * 仅对默认 CDN 源启用；换源（GitHub Pages/本地）时返回 null 走并行盲探（那些源 404 很快）。
 */
async function fetchAvailableSnapshotDates(): Promise<Set<string> | null> {
  if (!USING_JSDELIVR) return null;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(
        'https://data.jsdelivr.com/v1/packages/gh/stone-users/seikcha-info-pipeline@main?structure=flat',
        { signal: ctrl.signal },
      );
      if (!res.ok) return null;
      const j = (await res.json()) as { files?: { name?: string }[] };
      const set = new Set<string>();
      for (const f of j.files ?? []) {
        const m = /^\/snapshots\/(\d{4}-\d{2}-\d{2})\.json$/.exec(f.name ?? '');
        if (m) set.add(m[1]);
      }
      return set.size > 0 ? set : null;
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return null; // 清单失败不致命：回退为对全部日期并行盲探（约一轮 404 超时的时间）
  }
}

/**
 * 加载单日快照：日期寻址 → latest 兜底 → null（调用方回退 INFO_DEFAULTS）。
 * 返回 null 时界面应给弱提示（§6），不得表述为"安全"。
 */
export async function loadInfoDay(date: string): Promise<InfoDay | null> {
  const cached = dayCache.get(date);
  if (cached !== undefined) return cached;
  let day: InfoDay | null = null;
  for (const file of [`${date}.json`, 'latest.json']) {
    const parsed = parseDay(await fetchJson(`${SNAPSHOT_BASE}/${file}`), date);
    if (parsed) {
      day = parsed;
      break;
    }
  }
  dayCache.set(date, day);
  return day;
}

/** 业务日期（UTC+8 北京时间；INTEGRATION.md §4——UTC 日期串会在 0~8 点取错天） */
export function todayStr(): string {
  return new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10);
}

function lastNDates(endDate: string, n: number): string[] {
  const end = Date.parse(`${endDate}T00:00:00Z`);
  return Array.from(
    { length: n },
    (_, i) => new Date(end - (n - 1 - i) * 86400000).toISOString().slice(0, 10),
  );
}

/** 严格按日期寻址取单日快照（不走 latest 兜底——latest 冒充历史日期会伪造走势）。
 *  只缓存成功结果：瞬断丢失的日期留给走势图的重试轮。 */
async function loadInfoDayStrict(date: string): Promise<InfoDay | null> {
  const parsed = parseDay(await fetchJson(`${SNAPSHOT_BASE}/${date}.json`), date);
  if (parsed) strictCache.set(date, parsed);
  return parsed;
}

/**
 * 近 N 天（业务日期，含今日）已存档的每日快照，按日期升序——供费率走势图逐日重算。
 * 历史日期只认日期寻址文件，缺失日自动跳过；今日与主加载共用同一结果（带 latest 兜底）。
 * 同一业务日期去重，x 轴用快照自带的业务日期（latest 滞后时数据日期仍诚实）。
 */
export async function loadInfoHistory(days = 30): Promise<InfoDay[]> {
  const dates = lastNDates(todayStr(), days);
  const today = await loadInfoDay(todayStr());
  const available = await fetchAvailableSnapshotDates();
  // jsDelivr 的文件清单有缓存滞后：最新一两天的存档可能不在清单里
  // （实测 10-05 已存在但清单未收录，导致走势图漏点）。因此最近 3 天
  // 一律绕过清单直连探测——存在文件响应毫秒级，只有真缺失才吃慢 404。
  const recent = new Set(dates.slice(-3));
  const candidates = available
    ? dates.filter((d) => available.has(d) || recent.has(d))
    : dates;
  const first = await Promise.all(candidates.map((d) => loadInfoDayStrict(d)));
  // 清单内候选抓取失败（瞬断/限流）→ 再补试两轮
  if (available) {
    for (let round = 0; round < 2; round++) {
      const missed = candidates.filter((_, i) => first[i] === null);
      if (missed.length === 0) break;
      await Promise.all(missed.map((d) => loadInfoDayStrict(d)));
    }
  }
  const byDate = new Map<string, InfoDay>();
  candidates.forEach((d, i) => {
    const day = first[i] ?? strictCache.get(d) ?? null;
    if (day) byDate.set(day.date, day);
  });
  if (today) byDate.set(today.date, today);
  return [...byDate.values()].sort((a, b) => (a.date < b.date ? -1 : 1));
}

// 接口签名不得更改，站点其余部分只认本函数：
//   输入 corr: 走廊ID（'A'~'H'），date: 'YYYY-MM-DD'（当日）
//   输出 Promise<InfoSnapshot>（fr03 需先按走廊各段基准映射为 '段基准'|'低'|'中'|'高'|'极高'）
export async function fetchInfoSnapshot(corr: string, date: string): Promise<InfoSnapshot> {
  const day = await loadInfoDay(date);
  const s = day && (day.corridors as Record<string, InfoSnapshot | undefined>)[corr];
  return s ?? INFO_DEFAULTS;
}

/**
 * 跨走廊最不利合并（INTEGRATION.md §5，与模型方法论 PRC3"准备金按路径最坏段"一致）：
 * fr03/fr15/ct05/ct06 按档位序取最坏；ct04 取最大档；非 A~H 走廊自动忽略。
 * 返回可直接作为 QuoteInput.info 使用（引擎按 CT04 表把 ct04 档位转为系数）。
 */
export function mergeWorstCorridor(corrs: string[], day: InfoDay | null): InfoSnapshot {
  const snaps = corrs
    .filter((c): c is CorrId => (CORRIDORS as readonly string[]).includes(c))
    .map((c) => day?.corridors[c] ?? INFO_DEFAULTS);
  if (snaps.length === 0) return INFO_DEFAULTS;
  const worst = <T extends string>(order: readonly T[], vals: T[]): T =>
    vals.reduce((a, b) => (order.indexOf(b) > order.indexOf(a) ? b : a));
  return {
    fr03: worst(FR03_LEVELS, snaps.map((s) => s.fr03)),
    fr15: worst(FR15_LEVELS, snaps.map((s) => s.fr15)),
    ct04: Math.max(...snaps.map((s) => s.ct04)) as InfoSnapshot['ct04'],
    ct05: worst(CT05_LEVELS, snaps.map((s) => s.ct05)),
    ct06: worst(CT06_LEVELS, snaps.map((s) => s.ct06)),
  };
}
