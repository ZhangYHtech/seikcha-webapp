// factor_tables.json / segments.json 的类型描述（供 W2 引擎、W3 面板、W4 地图共用）
export interface FactorTablesJson {
  FR01_C: Record<string, number>;
  V_BASE: Record<string, number>;
  RAIN_WEAR: Record<string, number>;
  RAIN_V: Record<string, number>;
  W_WATER: Record<string, number>;
  FR03_C: Record<string, number>;
  FR04_C: Record<string, number>;
  FR04_TAU: Record<string, number>;
  FR05_C: Record<string, number>;
  FR06: Record<string, number[]>;
  FR07: Record<string, number>;
  FR08: Record<string, number>;
  FR09: Record<string, number>;
  FR10: Record<string, number[]>;
  FR11: Record<string, number>;
  FR12: Record<string, number>;
  FR13: Record<string, number>;
  FR14: Record<string, number>;
  FR15: Record<string, number[]>;
  SV01: Record<string, number[]>;
  SV03: Record<string, number>;
  SV04: Record<string, number[]>;
  LAM_D: Record<string, number>;
  LAM_N: Record<string, number>;
  F_C: Record<string, number>;
  F_B: Record<string, number>;
  CT03: Record<string, number>;
  CT04: Record<string, number>;
  CT05: Record<string, number | null>;
  CT06: Record<string, number | null>;
  CONSEQ: Record<string, number[]>;
  SHARES: Record<string, number[]>;
  rating_cards: Record<string, string>;
  constants: {
    w_km: number;
    lambda_acc_base: number;
    wear_cv: number;
    mu_w: number;
    cv_w: number;
    mu_m: number;
    cv_m: number;
    deductible: number;
    loading: number;
    v_min: number;
    seed: number;
    n_mc: number;
    caps: {
      display: number;
      info_freq: number;
      info_cat: number;
      trip: number;
      rate100: number;
    };
  };
}

export interface SegmentJson {
  id: string;
  corr: string;
  name: string;
  d: number;
  fr01: number;
  fr03: string;
  fr04: string;
  ct: number;
  st: number;
  port_tau: number;
  bmult: number;
  hawkes: boolean;
  Lflag: boolean;
  fr06: string;
  fr07: number;
  fr08: number;
  ct03: string;
  nodes: number[];
}

export type SegmentsJson = Record<string, SegmentJson>;
