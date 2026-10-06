// ============================================================
// 引擎门面：站点唯一引擎入口。UI 一律从这里 import { quote }。
// T601 已切换真引擎（calculator.py 移植版 mc.ts，T501 差分验收 PASS）；
// stub 保留用于回归对照（scripts/verifyEngine.ts 的独立流对照基准）。
// ============================================================
export { quote, summarize } from './mc';
export {
  INFO_DEFAULTS,
  loadInfoDay,
  loadInfoHistory,
  fetchInfoSnapshot,
  mergeWorstCorridor,
  todayStr,
} from './infoSnapshot';
export type { InfoDay, CorrId } from './infoSnapshot';
export { SEGMENTS } from './stub';
export type {
  Quote,
  QuoteInput,
  QuoteResult,
  SegmentQuote,
  TraceItem,
  InfoSnapshot,
  DisplayLevels,
  Rain,
  St,
  Sv01,
  Sv02,
} from './types';
export type { FactorTablesJson } from './schema';
