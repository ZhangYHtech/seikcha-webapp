import { quote } from '../src/engine/mc';
import { INFO_DEFAULTS } from '../src/engine/infoSnapshot';
import type { QuoteInput } from '../src/engine/types';

const input: QuoteInput = {
  segments: ['RT-11', 'RT-10', 'RT-07', 'RT-06', 'RT-05'],
  rain: 0,
  sv01: '帆布',
  sv02: '杂货',
  display: { fr09: '新司机', sv04: '集装箱' },
  info: INFO_DEFAULTS,
};
quote(input); // warmup
const t0 = performance.now();
const r = quote(input);
const t1 = performance.now();
console.log('5段报价耗时:', (t1 - t0).toFixed(1), 'ms; total pure%=', r.total.pureRate.toFixed(4));
const input2: QuoteInput = {
  segments: ['RT-13'],
  rain: 2,
  sv01: '纸箱',
  sv02: '服装',
  display: {},
  info: INFO_DEFAULTS,
};
const t2 = performance.now();
const r2 = quote(input2);
const t3 = performance.now();
console.log('RT-13单段耗时:', (t3 - t2).toFixed(1), 'ms; pure%=', r2.perSegment[0].pure.toFixed(3), 'capped=', r2.perSegment[0].capped);
