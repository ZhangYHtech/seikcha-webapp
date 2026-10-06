// ============================================================
// T501 确定性矩阵 JS 侧导出：15段×rain4×st4×展示极值2 + 演示输入
// 输出 verify/js_deterministic.json（供 verify/differential.py 对比 ≤1e-9）
// 运行: npx tsx scripts/dumpDeterministic.ts
// ============================================================
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SV02, T, getSeg, lambdaAcc, lambdaCat, wearMean } from '../src/engine/core';
import type { DisplayLevels, InfoSnapshot, St } from '../src/engine/types';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, '..', 'verify', 'js_deterministic.json');

const DISPLAY_WORST: DisplayLevels = {
  fr05: '散户', fr09: '新司机', fr10: '悬挂老化', fr11: '无', fr12: '高频',
  fr13: '>50k', fr14: '夜间', sv03: '高易损', sv04: '平板',
};
const DISPLAY_BEST: DisplayLevels = {
  fr05: '优秀', fr09: 'A照5年', fr10: '良好', fr11: '武装', fr12: '无出险',
  fr13: '<20k', fr14: '白天', sv03: '低易损', sv04: '集装箱',
};
const INFO_DEFAULT: InfoSnapshot = { fr03: '段基准', fr15: '平', ct04: 1, ct05: '常规', ct06: '正常' };
const INFO_WORST: InfoSnapshot = { fr03: '极高', fr15: '极端', ct04: 3, ct05: '收紧', ct06: '拥堵' };
const SV01_KEY: Record<string, string> = { 纸箱: '纸箱', 帆布: '防雨帆布', 托盘: '防雨+托盘' };

interface CellOut {
  key: string;
  sid: string;
  rain: number;
  st: number;
  vEff: number;
  T: number;
  dWear: number;
  lamAcc: number;
  lamCat: number | null;
  paused: boolean;
  cw: number;
  cm: number;
}

function computeCell(sid: string, rain: number, st: St, disp: DisplayLevels | undefined, info: InfoSnapshot, sv01: string, sv02: string): CellOut | null {
  const seg = getSeg(sid);
  if (!seg) return null;
  const la = lambdaAcc(seg, rain, st, disp, info);
  const lc = lambdaCat(seg, st, info);
  const sv1 = T.SV01[SV01_KEY[sv01]];
  const sv4 = T.SV04[disp?.sv04 ?? '篷布车'];
  const sv3 = T.SV03[disp?.sv03 ?? '普通服装'];
  const sv2 = SV02[sv02];
  return {
    key: `${sid}_r${rain}_s${st}_${disp === DISPLAY_WORST ? 'W' : disp === DISPLAY_BEST ? 'B' : 'D'}_${sv01}${sv02 === '杂货' ? 'Z' : ''}${info === INFO_WORST ? '_iw' : ''}`,
    sid,
    rain,
    st,
    vEff: la.vEff,
    T: la.T,
    dWear: wearMean(seg, rain, disp),
    lamAcc: la.lam,
    lamCat: lc.lam,
    paused: lc.paused,
    cw: sv1[0] * sv4[0] * sv3 * sv2[0],
    cm: sv1[1] * sv4[1] * sv3 * sv2[1],
  };
}

function main() {
  const cells: CellOut[] = [];
  const segSids = Array.from({ length: 15 }, (_, i) => `RT-${String(i + 1).padStart(2, '0')}`);
  const segSt: Record<string, St> = {
    'RT-01': 2, 'RT-02': 1, 'RT-03': 1, 'RT-04': 1, 'RT-05': 1, 'RT-06': 1, 'RT-07': 1,
    'RT-08': 2, 'RT-09': 2, 'RT-10': 3, 'RT-11': 2, 'RT-12': 1, 'RT-13': 2, 'RT-14': 3, 'RT-15': 2,
  };
  for (const sid of segSids) {
    for (const rain of [0, 1, 2, 3] as const) {
      for (const st of [0, 1, 2, 3] as St[]) {
        for (const disp of [undefined, DISPLAY_WORST, DISPLAY_BEST]) {
          const tag = disp === undefined ? 'D' : disp === DISPLAY_WORST ? 'W' : 'B';
          const c = computeCell(sid, rain, st, disp, INFO_DEFAULT, '纸箱', '服装');
          if (c) {
            c.key = `${sid}_r${rain}_s${st}_${tag}`;
            cells.push(c);
          }
        }
      }
    }
    // 段档案状态 + 展示极值 + 信息最坏
    for (const disp of [DISPLAY_WORST, DISPLAY_BEST]) {
      const tag = disp === DISPLAY_WORST ? 'W' : 'B';
      const c = computeCell(sid, 0, segSt[sid], disp, INFO_WORST, '纸箱', '服装');
      if (c) {
        c.key = `${sid}_r0_sseg_${tag}_iw`;
        cells.push(c);
      }
    }
    // SV-02 杂货方向格（确定性系数对比）
    const cZ = computeCell(sid, 0, segSt[sid], undefined, INFO_DEFAULT, '纸箱', '杂货');
    if (cZ) {
      cZ.key = `${sid}_r0_sseg_D_zahuo`;
      cells.push(cZ);
    }
  }
  fs.writeFileSync(OUT, JSON.stringify({ cells }, null, 0), 'utf-8');
  console.log(`deterministic cells: ${cells.length} -> verify/js_deterministic.json`);
}

main();
