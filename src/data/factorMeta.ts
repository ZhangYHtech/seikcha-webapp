// ============================================================
// 26因子元数据（W3）——业务名/类别/一句话含义/档位表来源键。
// 系数数值一律运行时读取 factor_tables.json（本文件零数值，红线1）。
// 类别口径（26=13内置+7展示+6信息，与 SPEC §2 对应）：
//   内置13 = FR-01/02/04/06/07/08 + SV-01~04 + CT-01/02/03（引擎内置参数：
//           其中9项随段档案自动、SV随单由报价台联动）
//   展示7  = FR-05/09/10/11/12/13/14（用户自报档）
//   信息6  = FR-03/15 + CT-04/05/06 + ST-01（每日评分快照，评分卡=rating_cards）
// ============================================================
import type { FactorTablesJson } from '../engine/schema';

export type FactorCategory = '内置' | '展示' | '信息';

export interface FactorMeta {
  code: string; // 内部代号（仅抽屉/追踪使用，面板不见）
  name: string; // 业务名（面板/卡片主文案）
  category: FactorCategory;
  source: '段档案·随路自动' | '随单参数·报价台联动' | '用户自报' | 'AI数据捕捉·即将上线';
  meaning: string; // 一句话风险含义
  tableKeys?: (keyof FactorTablesJson)[]; // 档位系数表（factor_tables.json 键）
  ratingCard?: string; // rating_cards 键
}

export const FACTOR_META: FactorMeta[] = [
  // ---- 内置13 ----
  { code: 'FR-01', name: '道路等级', category: '内置', source: '段档案·随路自动', meaning: '1级高速公路至5级土路，等级越低磨损与事故风险越高', tableKeys: ['FR01_C', 'V_BASE'] },
  { code: 'FR-02', name: '季节气候', category: '内置', source: '随单参数·报价台联动', meaning: '旱季/过渡/季风/极端四季，驱动减速、磨损与水损权重', tableKeys: ['RAIN_WEAR', 'RAIN_V', 'W_WATER'] },
  { code: 'FR-04', name: '查验滞留', category: '内置', source: '段档案·随路自动', meaning: '检查站查验强度，决定滞留时长与查验相关事故暴露', tableKeys: ['FR04_C', 'FR04_TAU'] },
  { code: 'FR-06', name: '地形', category: '内置', source: '段档案·随路自动', meaning: '平原/丘陵/山区险要，同时影响车速与事故频率', tableKeys: ['FR06'] },
  { code: 'FR-07', name: '路宽', category: '内置', source: '段档案·随路自动', meaning: '会车条件：≥7m / 3.7-7m / <3.7m，越窄风险越高', tableKeys: ['FR07'] },
  { code: 'FR-08', name: '夜禁管制', category: '内置', source: '段档案·随路自动', meaning: '夜间禁行管制的行程时间放大效应', tableKeys: ['FR08'] },
  { code: 'SV-01', name: '包装方式', category: '内置', source: '随单参数·报价台联动', meaning: '纸箱/防雨帆布/防雨+托盘，决定水损与机械损失敏感度', tableKeys: ['SV01'] },
  { code: 'SV-02', name: '货物类型', category: '内置', source: '随单参数·报价台联动', meaning: '服装/杂货，杂货水损敏感度减半', tableKeys: [] },
  { code: 'SV-03', name: '易损度', category: '内置', source: '随单参数·报价台联动', meaning: '货物易损等级：低易损/普通/高易损', tableKeys: ['SV03'] },
  { code: 'SV-04', name: '装载方式', category: '内置', source: '随单参数·报价台联动', meaning: '篷布车/集装箱/平板，影响水损与机械两维损失', tableKeys: ['SV04'] },
  { code: 'CT-01', name: '冲突等级', category: '内置', source: '段档案·随路自动', meaning: 'L0-L5武装冲突强度，单位里程巨灾触发率逐级抬升', tableKeys: ['LAM_D'] },
  { code: 'CT-02', name: '节点风险', category: '内置', source: '段档案·随路自动', meaning: '检查站/桥梁/渡口/口岸的单位滞留小时巨灾率', tableKeys: ['LAM_N'] },
  { code: 'CT-03', name: '替代路线', category: '内置', source: '段档案·随路自动', meaning: '有无替代路线，影响劫掠型事件(E4/E5)的部分损失', tableKeys: ['CT03'] },
  // ---- 展示7 ----
  { code: 'FR-05', name: '承运商等级', category: '展示', source: '用户自报', meaning: '优秀车队/一般/散户运力的事故风险差异', tableKeys: ['FR05_C'] },
  { code: 'FR-09', name: '司机资质', category: '展示', source: '用户自报', meaning: 'A照5年老司机/常规/新司机，行为层核心因子', tableKeys: ['FR09'] },
  { code: 'FR-10', name: '车况', category: '展示', source: '用户自报', meaning: '良好/一般/悬挂老化，同时作用于事故与磨损通道', tableKeys: ['FR10'] },
  { code: 'FR-11', name: '押运配置', category: '展示', source: '用户自报', meaning: '武装押运/民用安保/无押运，抑制冲突损失', tableKeys: ['FR11'] },
  { code: 'FR-12', name: '出险记录', category: '展示', source: '用户自报', meaning: '过去一年的理赔频次：无出险/一般/高频', tableKeys: ['FR12'] },
  { code: 'FR-13', name: '货值档', category: '展示', source: '用户自报', meaning: '单票货值规模，影响合成时的高值损失放大', tableKeys: ['FR13'] },
  { code: 'FR-14', name: '发车时段', category: '展示', source: '用户自报', meaning: '白天/夜间发车，夜间与夜禁条款联动', tableKeys: ['FR14'] },
  // ---- 信息6 ----
  { code: 'FR-03', name: '治安热度', category: '信息', source: 'AI数据捕捉·即将上线', meaning: '月化非武装事件数评分，当前按段档案基准档', tableKeys: ['FR03_C'], ratingCard: 'FR03' },
  { code: 'FR-15', name: '天气预报', category: '信息', source: 'AI数据捕捉·即将上线', meaning: '未来72h降雨评分，当前默认"平"', tableKeys: ['FR15'], ratingCard: 'FR15' },
  { code: 'CT-04', name: '冲突波动', category: '信息', source: 'AI数据捕捉·即将上线', meaning: '近7日与近90日武装事件之比，捕捉冲突骤变', tableKeys: ['CT04'], ratingCard: 'CT04' },
  { code: 'CT-05', name: '节点安全', category: '信息', source: 'AI数据捕捉·即将上线', meaning: 'MyWitness/MIMU证据评分，"关闭"即暂停承保', tableKeys: ['CT05'], ratingCard: 'CT05' },
  { code: 'CT-06', name: '口岸运行', category: '信息', source: 'AI数据捕捉·即将上线', meaning: '口岸通行状态评分，"关闭"即暂停承保', tableKeys: ['CT06'], ratingCard: 'CT06' },
  { code: 'ST-01', name: '态势状态', category: '信息', source: 'AI数据捕捉·即将上线', meaning: '月事件+准入+证实遇袭综合定级（S0-S3），转移需人工批准留痕', tableKeys: ['F_C', 'F_B'], ratingCard: 'ST01' },
];

export const CATEGORY_BADGE: Record<FactorCategory, { label: string; cls: string }> = {
  内置: { label: '内置', cls: 'bg-pg-greenLightest text-pg-green ring-pg-greenLight' },
  展示: { label: '展示', cls: 'bg-seik-50 text-seik-700 ring-seik-100' },
  信息: { label: '信息', cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
};
