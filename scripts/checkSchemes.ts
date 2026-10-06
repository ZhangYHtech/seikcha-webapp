// 多方案枚举验证（补环后）
import { enumerateRoutes } from '../src/lib/routePlanner';

for (const [o, d] of [
  ['myitkyina', 'yangon'],
  ['yangon', 'mandalay'],
  ['myitkyina', 'mandalay'],
  ['myitkyina', 'myeik'],
  ['yangon', 'kyaukpyu'],
  ['myawaddy', 'myitkyina'],
  ['muse', 'yangon'],
] as const) {
  const rs = enumerateRoutes(o, d);
  console.log(`${o} → ${d}: ${rs.length} 方案`);
  for (const r of rs) console.log(`   [${r.corrCombo}] ${r.totalKm}km  ${r.viaLabel}`);
}
