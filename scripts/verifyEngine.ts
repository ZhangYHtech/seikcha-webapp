// ============================================================
// 引擎自测脚本（T203 · W2）：15段基线费率对照 04_rate_results.md 表1。
// 两段结构：
//   1) 生产引擎对照表（mulberry32独立流@200k）：偏差列反映双侧MC噪声，
//      低频段（RT-01~06）超3%属预期（numpy自身跨seed噪声即21.9%，实测见
//      verify/report.md §C），仅作参考，不影响门禁。
//   2) 位级门禁（verifyBitExact.ts，流一致方案）：统计量对 calculator.py ≤1e-9。
// 运行：npm run test:engine
// ============================================================
import { quote } from '../src/engine/mc';
import { INFO_DEFAULTS } from '../src/engine/infoSnapshot';
import { BASELINE_04_T1 } from './baseline04';
import type { QuoteInput } from '../src/engine/types';

const baseInput: Omit<QuoteInput, 'segments'> = {
  rain: 0,
  sv01: '纸箱',
  sv02: '服装',
  display: {},
  info: INFO_DEFAULTS,
};

function relDev(js: number, base: number): number {
  if (base === 0) return js === 0 ? 0 : Number.POSITIVE_INFINITY;
  return Math.abs(js - base) / Math.abs(base);
}

let overTol = 0;
console.log('【1】生产引擎独立流对照（参考；偏差=双侧MC噪声）');
console.log('段ID    走廊  JS费率/百km%  04基线%   偏差    JS纯保费%  04基线%   偏差');
for (const b of BASELINE_04_T1) {
  const r = quote({ ...baseInput, segments: [b.sid] });
  const seg = r.perSegment[0];
  const jsRate = seg ? seg.rate : NaN;
  const jsPure = seg ? seg.pure : NaN; // 输出约定：pure 已为货值%数值
  const devRate = relDev(jsRate, b.rate100);
  const devPure = relDev(jsPure, b.pure);
  if (devRate > 0.03 || devPure > 0.03) overTol++;
  console.log(
    `${b.sid}  ${b.corr}     ${jsRate.toFixed(4)}      ${b.rate100.toFixed(4)}  ${(devRate * 100).toFixed(1)}%   ` +
      `${jsPure.toFixed(4)}    ${b.pure.toFixed(3)}   ${(devPure * 100).toFixed(1)}%`,
  );
}
console.log(
  `\n生产流@200k：15段中 ${15 - overTol} 段≤3%，${overTol} 段超限（低频段MC噪声，见 report §C）。\n` +
    '【2】位级门禁（流一致 vs calculator.py ≤1e-9）：',
);
