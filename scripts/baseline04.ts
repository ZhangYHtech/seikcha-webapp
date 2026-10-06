// 04_rate_results.md 表1 基线（2026-10-02快照 · 旱季基准 · 纸箱 · 全基准档）
// 仅作为 verify/差分脚本的对照标尺（数据权威=database/04_rate_results.md，禁止进 UI）。
export interface BaselineRow {
  sid: string;
  corr: string;
  d: number;
  st: number;
  pure: number; // 纯保费/票 %
  reg: number; // 常规项 %
  cat: number; // 巨灾项 %
  freq: number; // 出险率 %
  rate100: number; // 费率/百公里 %
  gross: number; // 毛保费/票 %
}

export const BASELINE_04_T1: BaselineRow[] = [
  { sid: 'RT-01', corr: 'A', d: 150, st: 2, pure: 0.227, reg: 0.187, cat: 0.04, freq: 3.5, rate100: 0.151, gross: 0.349 },
  { sid: 'RT-02', corr: 'A', d: 100, st: 1, pure: 0.032, reg: 0.029, cat: 0.003, freq: 0.5, rate100: 0.0318, gross: 0.049 },
  { sid: 'RT-03', corr: 'A', d: 120, st: 1, pure: 0.045, reg: 0.041, cat: 0.004, freq: 0.8, rate100: 0.0377, gross: 0.069 },
  { sid: 'RT-04', corr: 'A', d: 50, st: 1, pure: 0.01, reg: 0.009, cat: 0.001, freq: 0.2, rate100: 0.0198, gross: 0.015 },
  { sid: 'RT-05', corr: 'B', d: 380, st: 1, pure: 0.043, reg: 0.039, cat: 0.004, freq: 0.8, rate100: 0.0114, gross: 0.066 },
  { sid: 'RT-06', corr: 'B', d: 110, st: 1, pure: 0.008, reg: 0.006, cat: 0.002, freq: 0.1, rate100: 0.0072, gross: 0.012 },
  { sid: 'RT-07', corr: 'B', d: 250, st: 1, pure: 0.076, reg: 0.068, cat: 0.008, freq: 1.7, rate100: 0.0302, gross: 0.116 },
  { sid: 'RT-08', corr: 'C', d: 385, st: 2, pure: 0.643, reg: 0.565, cat: 0.078, freq: 31.3, rate100: 0.1669, gross: 0.989 },
  { sid: 'RT-09', corr: 'C', d: 150, st: 2, pure: 0.367, reg: 0.323, cat: 0.044, freq: 5.9, rate100: 0.2448, gross: 0.565 },
  { sid: 'RT-10', corr: 'D', d: 280, st: 3, pure: 2.077, reg: 1.081, cat: 0.997, freq: 30.2, rate100: 0.7419, gross: 3.195 },
  { sid: 'RT-11', corr: 'D', d: 150, st: 2, pure: 0.502, reg: 0.389, cat: 0.114, freq: 7.2, rate100: 0.335, gross: 0.773 },
  { sid: 'RT-12', corr: 'E', d: 190, st: 1, pure: 0.058, reg: 0.054, cat: 0.004, freq: 1.1, rate100: 0.0303, gross: 0.089 },
  { sid: 'RT-13', corr: 'F', d: 1200, st: 2, pure: 4.593, reg: 4.325, cat: 0.268, freq: 99.8, rate100: 0.3828, gross: 7.067 },
  { sid: 'RT-14', corr: 'G', d: 400, st: 3, pure: 2.885, reg: 1.486, cat: 1.399, freq: 44.7, rate100: 0.7213, gross: 4.438 },
  { sid: 'RT-15', corr: 'H', d: 230, st: 2, pure: 0.651, reg: 0.596, cat: 0.055, freq: 15.3, rate100: 0.2829, gross: 1.001 },
];
