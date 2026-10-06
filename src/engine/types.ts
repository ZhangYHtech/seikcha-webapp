// ============================================================
// SEIKCHA 引擎契约（冻结自 database/task_2_website_team_plan.md §0）
// 本文件是 W2（真引擎）/ W3（面板）/ W4（地图）三方共同遵守的接口。
// 任何修改须回写工单书 §0，禁止只改单侧。
// ============================================================

/** 季节：0旱季 / 1过渡 / 2季风 / 3极端 */
export type Rain = 0 | 1 | 2 | 3;

/** 态势状态 ST-01：S0/S1/S2/S3（S3=暂停新报价，产品规则层拦截） */
export type St = 0 | 1 | 2 | 3;

/** SV-01 包装（契约业务值 → factor_tables.json SV01 键的映射在引擎内完成） */
export type Sv01 = '纸箱' | '帆布' | '托盘';

/** SV-02 货物 */
export type Sv02 = '服装' | '杂货';

/** 展示因子档位键（与 factor_tables.json 各表键一致） */
export type Fr05Level = '优秀' | '一般' | '散户';
export type Fr09Level = 'A照5年' | '常规' | '新司机';
export type Fr10Level = '良好' | '一般' | '悬挂老化';
export type Fr11Level = '武装' | '民用' | '无';
export type Fr12Level = '无出险' | '一般' | '高频';
export type Fr13Level = '<20k' | '20-50k' | '>50k';
export type Fr14Level = '白天' | '夜间';
export type Sv03Level = '低易损' | '普通服装' | '高易损';
export type Sv04Level = '篷布车' | '集装箱' | '平板';

/** 展示因子 7 档（用户现场选择；缺省=基准 1.0） */
export interface DisplayLevels {
  fr05?: Fr05Level;
  fr09?: Fr09Level;
  fr10?: Fr10Level;
  fr11?: Fr11Level;
  fr12?: Fr12Level;
  fr13?: Fr13Level;
  fr14?: Fr14Level;
  sv03?: Sv03Level;
  sv04?: Sv04Level;
}

/**
 * 信息因子快照（每日评分，当前恒为 INFO_DEFAULTS 基准档）。
 * fr03 允许 '段基准'（=取段档案 fr03 档，即 calculator.py 的缺省语义）。
 */
export interface InfoSnapshot {
  fr03: '段基准' | '低' | '中' | '高' | '极高';
  fr15: '好' | '平' | '暴雨' | '极端';
  ct04: 0 | 1 | 2 | 3;
  ct05: '正常' | '常规' | '收紧' | '关闭';
  ct06: '通畅' | '正常' | '拥堵' | '关闭';
}

export interface QuoteInput {
  /** 路径 RT 段 ID 列表，如 ["RT-11","RT-10","RT-07","RT-06","RT-05"] */
  segments: string[];
  /** 季节 */
  rain: Rain;
  /** 覆盖 ST-01 状态；缺省取段档案 */
  st?: St;
  /** 包装 SV-01 */
  sv01: Sv01;
  /** 货物 SV-02 */
  sv02: Sv02;
  /** 展示因子 7 档 */
  display: DisplayLevels;
  /** 信息因子——阶段一恒为 INFO_DEFAULTS */
  info: InfoSnapshot;
  /** MC 抽样次数（缺省 200,000；verify 脚本可调） */
  nMc?: number;
}

/** 单因子追踪项：因子ID + 档位 + 生效系数 */
export interface TraceItem {
  factor: string;
  level: string;
  coef: number;
}

export interface SegmentQuote {
  sid: string;
  /** 费率/百公里（货值% / 100km） */
  rate: number;
  /** 纯保费/票（货值%） */
  pure: number;
  /** 巨灾项占纯保费（货值%） */
  catShare: number;
  /** 出险率 P(L>1%)（缺省=null：快速估算口径无此量） */
  freq: number | null;
  /** 节点/口岸关闭 → 暂停承保（引擎层） */
  paused: boolean;
  /** 触发输出封顶（12%单票 或 3%/百公里） */
  capped: boolean;
  trace: TraceItem[];
  // ---- 扩展暴露量（T201"V_eff/T暴露"；§0 契约之外只增不改，UI 可选消费） ----
  vEff: number | null;
  t: number | null;
  dWear: number | null;
  lamAcc: number | null;
  lamCat: number | null;
  /** 常规项（磨损+事故，货值%） */
  regPart: number | null;
  /** ST-01 状态（含报价覆盖与段档案） */
  st: St;
}

export interface QuoteResult {
  perSegment: SegmentQuote[];
  total: {
    /** 全程纯保费/票（货值%） */
    pureRate: number;
    /** 全程毛保费/票（loading 35%） */
    grossRate: number;
    /** 全程费率/百公里（货值% / 100km） */
    ratePer100km: number;
  };
  /** 计算口径（§0 之外只增项）：MC=蒙特卡洛精确值；quick=SPEC §7 快速估算兜底 */
  method?: 'MC' | 'quick';
}

/**
 * 引擎统一入口（§0 契约）。
 * 阶段一由 stub 提供（04 表 1 基线费率），阶段二切真引擎（calculator.py 移植）。
 */
export type Quote = (input: QuoteInput) => QuoteResult;
