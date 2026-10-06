// 图结构诊断：报价图是否成环？枚举器是否漏方案？
import { ROUTE_POLYS, CITIES } from '../src/data/cities';
import { enumerateRoutes, OD_CITIES } from '../src/lib/routePlanner';

// 1) 边集（每段=一条边，端点=折线首尾城市）
console.log('=== 边集（15段 → 15条边） ===');
for (const p of ROUTE_POLYS) {
  console.log(`${p.sid}: ${p.nodes[0]} ↔ ${p.nodes[p.nodes.length - 1]}（途经 ${p.nodes.length - 2} 个中间点）`);
}

// 2) 环检测（DFS 数回边 / n - m + c 判定）
const adj = new Map<string, string[]>();
for (const p of ROUTE_POLYS) {
  const a = p.nodes[0];
  const b = p.nodes[p.nodes.length - 1];
  if (!adj.has(a)) adj.set(a, []);
  if (!adj.has(b)) adj.set(b, []);
  adj.get(a)!.push(b);
  adj.get(b)!.push(a);
}
const nodes = [...adj.keys()];
const visited = new Set<string>();
let components = 0;
let backEdges = 0;
for (const start of nodes) {
  if (visited.has(start)) continue;
  components++;
  const stack: [string, string | null][] = [[start, null]];
  while (stack.length) {
    const [u, parent] = stack.pop()!;
    if (visited.has(u)) continue;
    visited.add(u);
    for (const v of adj.get(u) ?? []) {
      if (v === parent) continue;
      if (visited.has(v)) backEdges++; // 回边 = 环
      else stack.push([v, u]);
    }
  }
}
console.log(`\n=== 环检测 ===`);
console.log(`节点数=${nodes.length} 边数=${ROUTE_POLYS.length} 连通分量=${components} 回边(环)数=${backEdges / 2}`);
console.log(backEdges === 0 ? '结论：图中 0 个环（森林）' : '结论：图中存在环');

// 3) 全部起讫对（端点城市）方案数分布
console.log(`\n=== 全部 ${OD_CITIES.length} 个端点城的起讫对方案数 ===`);
const dist = new Map<number, number>();
for (const o of OD_CITIES) {
  for (const d of OD_CITIES) {
    if (o.id === d.id) continue;
    const n = enumerateRoutes(o.id, d.id).length;
    dist.set(n, (dist.get(n) ?? 0) + 1);
  }
}
console.log('方案数 → 起讫对数:', [...dist.entries()].sort((a, b) => a[0] - b[0]));

// 4) 假设补"西线联络段"后的方案数（图论推演：RT-16 仰光—卑谬—马圭 + RT-17 马圭—敏建—曼德勒）
console.log(`\n=== 假设新增 西线两段（仰光↔马圭、马圭↔曼德勒）后的方案数（图论推演） ===`);
const adj2 = new Map(adj);
adj2.set('yangon', [...(adj2.get('yangon') ?? []), 'magway']);
adj2.set('magway', [...(adj2.get('magway') ?? []), 'yangon', 'mandalay']);
adj2.set('mandalay', [...(adj2.get('mandalay') ?? []), 'magway']);
function countPaths(adj: Map<string, string[]>, o: string, d: string, cap = 8): number {
  const nodeSeen = new Set<string>();
  let n = 0;
  const walk = (u: string) => {
    if (n >= cap) return;
    if (u === d) { n++; return; }
    nodeSeen.add(u);
    for (const v of adj.get(u) ?? []) {
      if (nodeSeen.has(v)) continue; // 节点去重 = 简单路径
      walk(v);
    }
    nodeSeen.delete(u);
  };
  walk(o);
  return n;
}
for (const [o, d] of [['myitkyina', 'yangon'], ['yangon', 'kyaukpyu'], ['mandalay', 'kyaukpyu'], ['myawaddy', 'myitkyina'], ['myitkyina', 'myeik']] as const) {
  console.log(`${o} → ${d}: 现在=${countPaths(adj, o, d)} 条 / 补西线后=${countPaths(adj2, o, d)} 条`);
}
