// ============================================================
// T501 位级回放对比（JS 侧）：读取 verify/draws/（capture_draws.py 产出），
// 按与 calculator.py 完全一致的消费顺序回放 numpy 分布调用产出，执行 JS 端
// 合成算术（fr13 / L=min(1,·) / pay=max(0,·−1%) / 均值 / 出险率 / 巨灾项 /
// TVaR99 / 12%·3%封顶），与 Python 侧结果对比 ≤1e-9。
// 注意：捕获的是分布调用的"最终产出"（severity 已含 ct03 缩放），回放侧只做
// 选择/比较/累加，无 exp/log → 与 Python 仅剩 np.mean 成对求和的 ~1e-13 差异。
// 运行: npx tsx scripts/verifyBitExact.ts
// ============================================================
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { T } from '../src/engine/core';
import type { DisplayLevels } from '../src/engine/types';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DRAW_DIR = path.join(HERE, '..', 'verify', 'draws');
const TOL = 1e-9;

interface CellManifest {
  key: string;
  sid: string;
  rain: number;
  st: number | null;
  sv: string;
  disp: DisplayLevels | null;
  info: Record<string, unknown> | null;
  chunks: number;
  pure: number;
  reg: number;
  cat: number;
  freq: number;
  tvar: number;
  per_km: number;
  lam_a: number;
  lam_c: number | null;
  v_eff: number;
  T: number;
  d_wear: number;
  paused: boolean;
  capped: boolean;
  ww: number;
  fr13: number;
}

interface Chunk {
  kind: number;
  size: number;
  data: Float64Array;
}

function readBin(file: string): Chunk[] {
  const buf = fs.readFileSync(file);
  let off = 0;
  const count = buf.readUInt32LE(off);
  off += 4;
  const chunks: Chunk[] = [];
  for (let i = 0; i < count; i++) {
    const kind = buf.readUInt8(off);
    off += 1;
    const size = buf.readUInt32LE(off);
    off += 4;
    const data = new Float64Array(size);
    if (kind === 1 || kind === 4) {
      // int64 payload（poisson 计数 / choice 类型索引）
      for (let j = 0; j < size; j++) {
        const lo = BigInt(buf.readUInt32LE(off + j * 8));
        const hi = BigInt(buf.readInt32LE(off + j * 8 + 4));
        data[j] = Number((hi << 32n) | lo);
      }
    } else {
      for (let j = 0; j < size; j++) data[j] = buf.readDoubleLE(off + j * 8);
    }
    off += size * 8;
    chunks.push({ kind, size, data });
  }
  return chunks;
}

class ChunkCursor {
  private i = 0;
  constructor(private chunks: Chunk[]) {}
  next(): Chunk {
    if (this.i >= this.chunks.length) throw new Error('draws exhausted');
    return this.chunks[this.i++];
  }
  get remaining(): number {
    return this.chunks.length - this.i;
  }
}

/** 回放单格合成（calculator.py L340-378 的算术部分逐行对应） */
function replayCell(m: CellManifest, chunks: Chunk[]): Record<string, number | boolean> {
  const cur = new ChunkCursor(chunks);
  const n = chunks.length > 0 ? chunks[0].size : 0;
  const nAcc = cur.next().data; // poisson(lamA, n)
  const nCat = cur.next().data; // poisson(lamC, n)
  const wear = cur.next().data; // lognormal(muW, sW, n)

  let totalAcc = 0;
  for (let i = 0; i < nAcc.length; i++) totalAcc += nAcc[i];
  let isWater: Float64Array | null = null;
  let sevW: Float64Array | null = null;
  let sevM: Float64Array | null = null;
  if (totalAcc > 0) {
    isWater = cur.next().data; // random(total) < w_water → 水损维标志
    sevW = cur.next().data; // lognormal(mw, sw, total)
    sevM = cur.next().data; // lognormal(mm, sm, total)
  }
  let totalCat = 0;
  for (let i = 0; i < nCat.length; i++) totalCat += nCat[i];
  let catTypes: Float64Array | null = null;
  const tlFlags: Float64Array[] = [];
  const catSev: Float64Array[] = [];
  if (totalCat > 0) {
    catTypes = cur.next().data; // choice(TYPES, total, p=SHARES[st])
    for (let j = 0; j < 5; j++) {
      let k = 0;
      for (let i = 0; i < catTypes.length; i++) if (catTypes[i] === j) k++;
      if (k === 0) {
        tlFlags.push(new Float64Array(0));
        catSev.push(new Float64Array(0));
        continue;
      }
      tlFlags.push(cur.next().data); // random(k) < p_TL → 全损标志
      catSev.push(cur.next().data); // lognormal(mp, sp, k)（μ_p 已含 CT03 缩放）
    }
  }
  if (cur.remaining !== 0) throw new Error(`${m.key}: unconsumed chunks=${cur.remaining}`);

  // ---- 合成 ----
  const fr13 = m.fr13;
  const pay = new Float64Array(n);
  let sumPay = 0;
  let sumRegPay = 0;
  let freqCount = 0;
  let e = 0; // 事故事件游标
  let ce = 0; // 巨灾事件游标
  const catOff = [0, 0, 0, 0, 0];
  for (let i = 0; i < n; i++) {
    let acc = 0;
    for (let k = 0; k < nAcc[i]; k++) {
      acc += isWater![e] < m.ww ? sevW![e] : sevM![e];
      e++;
    }
    let catLoss = 0;
    for (let k = 0; k < nCat[i]; k++) {
      const j = catTypes![ce];
      const pTl = T.CONSEQ[`E${j + 1}`][0];
      catLoss += tlFlags[j][catOff[j]] < pTl ? 1.0 : catSev[j][catOff[j]];
      catOff[j]++;
      ce++;
    }
    const reg = (wear[i] + acc) * fr13;
    const L = Math.min(1.0, reg + catLoss);
    const p = Math.max(0, L - 0.01);
    pay[i] = p;
    sumPay += p;
    if (L > 0.01) freqCount++;
    sumRegPay += Math.max(0, Math.min(1.0, reg) - 0.01);
  }
  let pure = sumPay / n;
  let capped = false;
  if (pure > 0.12) {
    pure = 0.12;
    capped = true;
  }
  const meanRegPay = sumRegPay / n;
  const catTerm = pure - Math.min(meanRegPay, pure);
  const sorted = pay.slice().sort((a, b) => a - b);
  const start = Math.floor(n * 0.99);
  let sumTop = 0;
  for (let i = start; i < n; i++) sumTop += sorted[i];
  const tvar = sumTop / (n - start);
  const freq = freqCount / n;
  return { pure, reg: pure - catTerm, cat: catTerm, freq, tvar, capped };
}

function relDev(a: number, b: number): number {
  if (b === 0) return a === 0 ? 0 : Number.POSITIVE_INFINITY;
  return Math.abs(a - b) / Math.abs(b);
}

function main() {
  const manifest: CellManifest[] = JSON.parse(
    fs.readFileSync(path.join(DRAW_DIR, 'manifest.json'), 'utf-8'),
  );
  let fail = 0;
  const results: Record<string, unknown>[] = [];
  for (const m of manifest) {
    if (m.paused) {
      results.push({ key: m.key, status: 'SKIP(paused)' });
      continue;
    }
    const chunks = readBin(path.join(DRAW_DIR, `${m.key}.bin`));
    const js = replayCell(m, chunks);
    const checks = {
      pure: relDev(js.pure as number, m.pure),
      reg: relDev(js.reg as number, m.reg),
      cat: relDev(js.cat as number, m.cat),
      freq: relDev(js.freq as number, m.freq),
      tvar: relDev(js.tvar as number, m.tvar),
      cappedOk: js.capped === m.capped,
    };
    const ok =
      checks.pure <= TOL && checks.reg <= TOL && checks.cat <= TOL &&
      checks.freq <= TOL && checks.tvar <= TOL && checks.cappedOk;
    if (!ok) fail++;
    results.push({ key: m.key, ok, checks });
    console.log(
      `${ok ? 'PASS' : 'FAIL'} ${m.key}  pureΔ=${checks.pure.toExponential(1)} ` +
        `freqΔ=${checks.freq.toExponential(1)} tvarΔ=${checks.tvar.toExponential(1)}`,
    );
  }
  fs.writeFileSync(
    path.join(HERE, '..', 'verify', 'js_stats.json'),
    JSON.stringify({ tol: TOL, fail, results }, null, 1),
  );
  console.log(`\nbit-exact replay: ${manifest.length} cells, ${fail} FAIL (${fail === 0 ? 'ALL PASS ✅' : '❌'})`);
  process.exit(fail === 0 ? 0 : 1);
}

main();
