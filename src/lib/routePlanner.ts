// ============================================================
// 路径枚举器（T403 · W4）：给定起讫城市，在15段城市图上枚举走廊组合方案
// （≤4条，按总里程升序）。选中=蓝粗线、候选=灰细线（复刻现有交互）。
// 图结构=src/data/cities.ts 的 ROUTE_POLYS 节点序列（与02表3一致）。
// ============================================================
import { ROUTE_POLYS, CITIES, type City, type RoutePoly } from '../data/cities';
import { SEGMENTS } from '../engine';

export interface RouteScheme {
  sids: string[];
  corrCombo: string; // 如 "D+B"
  totalKm: number;
  label: string;
  viaLabel: string; // 业务链式路名（按行进方向，无内部代号）
}

const cityIndex = new Map(CITIES.map((c) => [c.id, c]));

// 邻接：城市id → {sid, 另一端城市id, poly}
const adj = new Map<string, { sid: string; to: string; poly: RoutePoly }[]>();
for (const p of ROUTE_POLYS) {
  const a = p.nodes[0];
  const b = p.nodes[p.nodes.length - 1];
  if (!adj.has(a)) adj.set(a, []);
  if (!adj.has(b)) adj.set(b, []);
  adj.get(a)!.push({ sid: p.sid, to: b, poly: p });
  adj.get(b)!.push({ sid: p.sid, to: a, poly: p });
}

/** 全部简单路径 DFS（节点去重=严格简单路径；上限4条，按总里程升序）。
 *  nameOf：城市显示名取法（多语言用；缺省=中文名） */
export function enumerateRoutes(
  originId: string,
  destId: string,
  nameOf?: (c: City) => string,
): RouteScheme[] {
  const zhOf = nameOf ?? ((c: City) => c.zh);
  if (originId === destId) return [];
  const results: { sids: string[]; km: number }[] = [];
  const visitedCities = new Set<string>([originId]);
  const walk = (city: string, sids: string[], km: number) => {
    if (results.length >= 12) return;
    if (city === destId) {
      results.push({ sids: [...sids], km });
      return;
    }
    for (const e of adj.get(city) ?? []) {
      if (visitedCities.has(e.to)) continue; // 简单路径：不重复经过城市
      visitedCities.add(e.to);
      sids.push(e.sid);
      walk(e.to, sids, km + (SEGMENTS[e.sid]?.d ?? 0));
      sids.pop();
      visitedCities.delete(e.to);
    }
  };
  walk(originId, [], 0);
  results.sort((x, y) => x.km - y.km);
  return results.slice(0, 4).map((r) => {
    const corrCombo = [...new Set(r.sids.map((s) => SEGMENTS[s]?.corr ?? '?'))].join('+');
    // 链式路名：沿行进方向取途经端点，去重相邻重复
    const names: string[] = [];
    let cur = originId;
    const curCity = cityIndex.get(cur);
    names.push(curCity ? zhOf(curCity) : cur);
    for (const sid of r.sids) {
      const poly = ROUTE_POLYS.find((p) => p.sid === sid);
      if (!poly) continue;
      const end = poly.nodes[poly.nodes.length - 1];
      const next = end === cur ? poly.nodes[0] : end;
      cur = next;
      const nextCity = cityIndex.get(next);
      const zh = nextCity ? zhOf(nextCity) : next;
      if (names[names.length - 1] !== zh) names.push(zh);
    }
    return {
      sids: r.sids,
      corrCombo,
      totalKm: r.km,
      label: r.sids.map((s) => s.replace('RT-', '')).join('→'),
      viaLabel: names.join(' → '),
    };
  });
}

export function cityById(id: string) {
  return cityIndex.get(id);
}

/** 道路显示名（多语言：zh=中文名，en/my=roadEn 英文名；缺省回退中文名） */
export function roadName(sid: string, lang: 'zh' | 'en' | 'my'): string {
  const p = ROUTE_POLYS.find((x) => x.sid === sid);
  if (!p) return sid;
  return lang === 'zh' ? p.roadZh : p.roadEn || p.roadZh;
}

/** 起讫下拉可选：15段的端点城市（8走廊内组合），剔除纯中间站 */
export const OD_CITIES = (() => {
  const endpoints = new Set<string>();
  for (const p of ROUTE_POLYS) {
    endpoints.add(p.nodes[0]);
    endpoints.add(p.nodes[p.nodes.length - 1]);
  }
  return CITIES.filter((c) => endpoints.has(c.id));
})();
