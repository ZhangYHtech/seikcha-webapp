// ============================================================
// 城市经纬度表 + 15段折线走向（T402 · W4）
// 依据 database/02_route_network.md 表2/表3 自建（近似坐标，走向复核用）；
// [C]=已确认实线 / [E]=推定虚线；口岸=表2六节点。
// ============================================================
export interface City {
  id: string;
  zh: string;
  en: string;
  lon: number;
  lat: number;
  portId?: string; // 表2口岸节点
  ldy?: number; // 标签纵向偏移（密集集群微调）
}

export const CITIES: City[] = [
  { id: 'myawaddy', zh: '妙瓦底', en: 'Myawaddy', lon: 98.51, lat: 16.72, portId: 'PT-01' },
  { id: 'kawkareik', zh: '高加力', en: 'Kawkareik', lon: 98.79, lat: 16.53 },
  { id: 'hpaan', zh: '帕安', en: 'Hpa-an', lon: 97.63, lat: 16.89 },
  { id: 'thaton', zh: '直通', en: 'Thaton', lon: 97.37, lat: 16.92 },
  { id: 'kyaikto', zh: '斋托', en: 'Kyaikto', lon: 97.03, lat: 17.28 },
  { id: 'bago', zh: '勃固', en: 'Bago', lon: 96.48, lat: 17.34 },
  { id: 'yangon', zh: '仰光', en: 'Yangon', lon: 96.20, lat: 16.87 },
  { id: 'thilawa', zh: '仰光港(迪拉瓦)', en: 'Thilawa Port', lon: 96.28, lat: 16.63, portId: 'PT-06' },
  { id: 'hline', zh: '莱河', en: 'Hline', lon: 95.35, lat: 16.85 },
  { id: 'pathein', zh: '勃生', en: 'Pathein', lon: 94.73, lat: 16.78 },
  { id: 'pyay', zh: '卑谬', en: 'Pyay', lon: 95.22, lat: 19.82, ldy: 12 },
  { id: 'myingyan', zh: '敏建', en: 'Myingyan', lon: 95.02, lat: 21.46, ldy: -8 },
  { id: 'naypyidaw', zh: '内比都', en: 'Naypyidaw', lon: 96.08, lat: 19.76 },
  { id: 'meiktila', zh: '密铁拉', en: 'Meiktila', lon: 95.86, lat: 20.88 },
  { id: 'taunggyi', zh: '东枝', en: 'Taunggyi', lon: 96.45, lat: 20.78, ldy: 13 },
  { id: 'mandalay', zh: '曼德勒', en: 'Mandalay', lon: 96.08, lat: 21.98 },
  { id: 'shwebo', zh: '瑞保', en: 'Shwebo', lon: 95.99, lat: 22.57 },
  { id: 'yeu', zh: '耶乌', en: 'Ye-U', lon: 95.62, lat: 22.85 },
  { id: 'kachinborder', zh: '克钦界', en: 'Kachin border', lon: 96.05, lat: 24.05 },
  { id: 'katha', zh: '卡塔', en: 'Katha', lon: 96.35, lat: 24.14 },
  { id: 'shwegu', zh: '杰沙', en: 'Shwegu', lon: 96.42, lat: 24.08 },
  { id: 'myitkyina', zh: '密支那', en: 'Myitkyina', lon: 97.40, lat: 25.38 },
  { id: 'bhamo', zh: '八莫', en: 'Bhamo', lon: 96.94, lat: 24.26, ldy: -8 },
  { id: 'lweje', zh: '雷基', en: 'Lweje', lon: 97.42, lat: 24.32, portId: 'PT-03' },
  { id: 'kyaukme', zh: '皎迈', en: 'Kyaukme', lon: 97.03, lat: 22.60 },
  { id: 'lashio', zh: '腊戌', en: 'Lashio', lon: 97.75, lat: 22.94, ldy: 13 },
  { id: 'kutkai', zh: '贵慨', en: 'Kutkai', lon: 98.10, lat: 23.05, ldy: -8 },
  { id: 'muse', zh: '木姐', en: 'Muse', lon: 97.75, lat: 23.99, portId: 'PT-02' },
  { id: 'chinshwehaw', zh: '清水河-滚弄', en: 'Chinshwehaw', lon: 98.70, lat: 23.95, portId: 'PT-04' },
  { id: 'mawlamyine', zh: '毛淡棉', en: 'Mawlamyine', lon: 97.63, lat: 16.48 },
  { id: 'dawei', zh: '土瓦', en: 'Dawei', lon: 98.20, lat: 14.09 },
  { id: 'myeik', zh: '丹老', en: 'Myeik', lon: 98.60, lat: 12.44, portId: 'PT-05' },
  { id: 'kyaukpyu', zh: '皎漂', en: 'Kyaukpyu', lon: 93.53, lat: 19.42 },
  { id: 'ann', zh: '安', en: 'Ann', lon: 94.30, lat: 18.95 },
  { id: 'magway', zh: '马圭', en: 'Magway', lon: 94.93, lat: 20.28 },
];

/** 15段折线：城市节点序列（与02表3走向逐一对照）；道路名与置信[来源=表3] */
export interface RoutePoly {
  sid: string; // RT-01..15（=segments.json 键）
  corr: string;
  roadZh: string;
  roadEn: string;
  confidence: 'C' | 'E'; // [C]确认实线 / [E]推定虚线
  nodes: string[]; // CITIES id 序列
}

export const ROUTE_POLYS: RoutePoly[] = [
  { sid: 'RT-01', corr: 'A', roadZh: '亚2号公路·妙瓦底—帕安段', roadEn: 'AH2 Myawaddy–Kawkareik–Hpa-an', confidence: 'C', nodes: ['myawaddy', 'kawkareik', 'hpaan'] },
  { sid: 'RT-02', corr: 'A', roadZh: '亚2号公路·直通—斋托段', roadEn: 'AH2 Thaton–Kyaikto', confidence: 'C', nodes: ['hpaan', 'thaton', 'kyaikto', 'bago'] },
  { sid: 'RT-03', corr: 'A', roadZh: '亚2号公路·勃固段', roadEn: 'AH2 Bago section', confidence: 'C', nodes: ['bago', 'yangon'] },
  { sid: 'RT-04', corr: 'A', roadZh: '仰光入口段', roadEn: 'AH2/AH1/E1 共线引入', confidence: 'C', nodes: ['yangon', 'thilawa'] },
  { sid: 'RT-05', corr: 'B', roadZh: '仰光—曼德勒高速', roadEn: 'E1 Yangon–Mandalay Expressway', confidence: 'C', nodes: ['yangon', 'bago', 'naypyidaw'] },
  { sid: 'RT-06', corr: 'B', roadZh: '仰曼高速中段', roadEn: 'E1 Naypyidaw–Meiktila', confidence: 'C', nodes: ['naypyidaw', 'meiktila'] },
  { sid: 'RT-07', corr: 'B', roadZh: '联邦大道北段（亚1号）', roadEn: 'AH1 Meiktila–Mandalay', confidence: 'C', nodes: ['meiktila', 'mandalay'] },
  { sid: 'RT-08', corr: 'C', roadZh: '缅甸公路（亚14号）', roadEn: 'AH14 Mandalay–Lashio–Kutkai', confidence: 'C', nodes: ['mandalay', 'kyaukme', 'lashio', 'kutkai'] },
  { sid: 'RT-09', corr: 'C', roadZh: '滇缅公路北段（亚14号）', roadEn: 'AH14 Kutkai–Muse', confidence: 'C', nodes: ['kutkai', 'muse'] },
  { sid: 'RT-10', corr: 'D', roadZh: '亚1号公路北段', roadEn: 'AH1 north Mandalay–Shwebo–Ye-U', confidence: 'C', nodes: ['mandalay', 'shwebo', 'yeu', 'kachinborder'] },
  { sid: 'RT-11', corr: 'D', roadZh: '曼德勒—密支那公路（卡塔段）', roadEn: 'Mandalay–Myitkyina (Katha–Myitkyina)', confidence: 'E', nodes: ['kachinborder', 'katha', 'myitkyina'] },
  { sid: 'RT-12', corr: 'E', roadZh: '仰光—勃生公路', roadEn: 'Yangon–Pathein Hwy', confidence: 'E', nodes: ['yangon', 'hline', 'pathein'] },
  { sid: 'RT-13', corr: 'F', roadZh: '仰光—丹老沿海干线', roadEn: 'Yangon–Myeik Coastal Hwy / DBT', confidence: 'E', nodes: ['yangon', 'mawlamyine', 'dawei', 'myeik'] },
  { sid: 'RT-14', corr: 'G', roadZh: '皎漂—马圭公路', roadEn: 'Kyaukpyu–Ann–Magway (CMEC south)', confidence: 'E', nodes: ['kyaukpyu', 'ann', 'magway'] },
  { sid: 'RT-15', corr: 'H', roadZh: '雷基—八莫—密支那公路', roadEn: 'Lweje–Bhamo–Myitkyina (Stilwell)', confidence: 'E', nodes: ['lweje', 'bhamo', 'myitkyina'] },
  // ---- 假设联络段（用户授权，类比推档，见 segments_assumed.json 与页脚披露） ----
  { sid: 'RT-16', corr: 'W', roadZh: '卑谬公路（仰光—马圭）', roadEn: 'Yangon–Pyay–Magway Rd (assumed)', confidence: 'E', nodes: ['yangon', 'pyay', 'magway'] },
  { sid: 'RT-17', corr: 'W', roadZh: '敏建公路（马圭—曼德勒）', roadEn: 'Magway–Myingyan–Mandalay Rd (assumed)', confidence: 'E', nodes: ['magway', 'myingyan', 'mandalay'] },
  { sid: 'RT-18', corr: 'N', roadZh: '伊洛瓦底东岸公路（曼德勒—密支那）', roadEn: 'Mandalay–Shwegu–Bhamo–Myitkyina Rd (assumed)', confidence: 'E', nodes: ['mandalay', 'shwegu', 'bhamo', 'myitkyina'] },
  { sid: 'RT-19', corr: 'S', roadZh: '东枝公路（密铁拉—贵慨）', roadEn: 'Meiktila–Taunggyi–Kutkai Rd (assumed)', confidence: 'E', nodes: ['meiktila', 'taunggyi', 'kutkai'] },
];

/** 口岸节点表（02表2） */
export const PORTS = [
  { id: 'PT-01', zh: '妙瓦底', en: 'Myawaddy', note: '最大泰缅口岸', city: 'myawaddy' },
  { id: 'PT-02', zh: '木姐', en: 'Muse', note: '最大中缅口岸（对接瑞丽）', city: 'muse' },
  { id: 'PT-03', zh: '雷基', en: 'Lweje', note: '西线备用口岸', city: 'lweje' },
  { id: 'PT-04', zh: '清水河-滚弄', en: 'Chinshwehaw', note: '"1027行动"战场，常态化关闭', city: 'chinshwehaw' },
  { id: 'PT-05', zh: '丹老/高当', en: 'Myeik/Kawthoung', note: '南部海滨口岸', city: 'myeik' },
  { id: 'PT-06', zh: '仰光港（迪拉瓦）', en: 'Thilawa', note: '海运·FOB责任至船舷', city: 'thilawa' },
];

/** 走廊名（calculator.py CORR_NAMES 同源） */
export const CORR_NAMES: Record<string, string> = {
  A: '东南线 妙瓦底→仰光',
  B: '中纵线 仰光→曼德勒',
  C: '东北线 曼德勒→木姐',
  D: '西北线 曼德勒→密支那',
  E: '仰光-勃生',
  F: '土瓦-丹老',
  G: '皎漂-马圭',
  H: '雷基-八莫',
};
