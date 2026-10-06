// ============================================================
// SEIKCHA 设计令牌（T101 · W1）——改版（2026-10-04）：视觉参照
// policygenius.com（暖橙 CTA + 墨绿点缀 + 米白区块 + 藏青标题）。
// 组件只认本文件的语义令牌；改肤只动这里。
// ============================================================
export const tokens = {
  color: {
    // 品牌橙系（Policygenius orange）
    brand: '#eb6424',
    brandDeep: '#c94f16',
    brandSoft: '#fbede7',
    // 语义色（PG green/red）
    ok: '#226f54',
    warn: '#c9820f',
    risk: '#b12727',
    paused: '#b12727',
    cap: '#730024',
    // 中性（暖灰 + 藏青墨色）
    ink: '#172436',
    sub: '#787471',
    line: '#e2dbd3',
    paper: '#ffffff',
    wash: '#f7f5f3',
  },
  radius: { card: '14px', pill: '999px', input: '10px' },
  shadow: {
    card: '0 1px 2px rgba(23,36,54,.05), 0 8px 24px rgba(23,36,54,.07)',
    pop: '0 12px 40px rgba(23,36,54,.16)',
  },
  // 费率着色带（T404 折线choropleth）：由数据 min/max 归一化后取色
  // 改版：低风险=墨绿 → 高风险=警示橙红（Policygenius 语义色）
  rateRamp: ['#226f54', '#019c77', '#90b7a9', '#fcc1a4', '#eb6424', '#b12727'],
  fontSize: {
    display: 'clamp(28px, 4.4vw, 44px)',
    h2: 'clamp(20px, 2.6vw, 28px)',
    body: '15px',
    small: '12.5px',
  },
} as const;

/** 段状态徽章文案（产品规则：产品规则优先于好看） */
export const ST_LABEL: Record<number, string> = {
  0: 'S0 平静',
  1: 'S1 常规',
  2: 'S2 紧张',
  3: 'S3 冲突·暂停承保',
};
