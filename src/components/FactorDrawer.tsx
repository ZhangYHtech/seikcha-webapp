// ============================================================
// 因子明细抽屉（T303 · W3）：点费率 → "档位→系数"追踪列表（消费引擎 trace）。
// 空态/加载态有设计；trace.factor 为引擎内部代号，经 i18n 映射业务名展示。
// ============================================================
import type { SegmentQuote, TraceItem } from '../engine/types';
import { useT } from '../i18n';

type TFn = ReturnType<typeof useT>;

function labelOf(t: TFn, item: TraceItem): string {
  if (!CODE_LABEL_ZH[item.factor]) return item.factor; // 未收录代号 → 原样展示
  const s = t(`dl.${item.factor}`);
  return s === `dl.${item.factor}` ? CODE_LABEL_ZH[item.factor] : s; // i18n 缺键 → 中文名兜底
}

/** 展示层档位值 → i18n 键（引擎数据值保持中文，此处仅映射展示文案） */
const OPT_LEVEL_KEY: Record<string, string> = {
  纸箱: 'opt.pack.carton', 帆布: 'opt.pack.canvas', 托盘: 'opt.pack.pallet',
  服装: 'opt.cargo.garment', 杂货: 'opt.cargo.general',
  低易损: 'opt.frag.low', 普通服装: 'opt.frag.normal', 高易损: 'opt.frag.high',
  篷布车: 'opt.load.tarp', 集装箱: 'opt.load.container', 平板: 'opt.load.flatbed',
  优秀: 'opt.carrier.top', 一般: 'opt.carrier.avg', 散户: 'opt.carrier.indep',
  'A照5年': 'opt.driver.lic5', 常规: 'opt.driver.std', 新司机: 'opt.driver.new',
  良好: 'opt.veh.good', 悬挂老化: 'opt.veh.worn',
  武装: 'opt.escort.armed', 民用: 'opt.escort.civil', 无: 'opt.escort.none',
  无出险: 'opt.claims.none', 高频: 'opt.claims.high',
  '<20k': 'opt.value.u20', '20-50k': 'opt.value.2050', '>50k': 'opt.value.o50',
  白天: 'opt.time.day', 夜间: 'opt.time.night',
  有替代: 'lvl.ct03.yes', 无替代: 'lvl.ct03.no',
  平原: 'lvl.fr06.plain', 丘陵: 'lvl.fr06.hill', 山区险路: 'lvl.fr06.mountain',
  通畅: 'lvl.fr04.ok', 严查长队: 'lvl.fr04.strict', 间歇关闭: 'lvl.fr04.inter',
  好: 'lvl.fr15.good', 平: 'lvl.fr15.flat', 暴雨: 'lvl.fr15.storm', 极端: 'lvl.fr15.ext',
  低: 'lvl.fr03.low', 中: 'lvl.fr03.mid', 高: 'lvl.fr03.high', 极高: 'lvl.fr03.ext',
};

function baseLevel(t: TFn, v: string): string {
  const k = OPT_LEVEL_KEY[v];
  return k ? t(k) : v;
}

/** 档位芯片文案：组合型 level 按因子拆解翻译，其余走数据值映射 */
function levelText(t: TFn, item: TraceItem): string {
  const { factor, level } = item;
  const s = String(level);
  if (factor === 'FR-01') return t('lvl.fr01', { n: s.replace('级路', '') });
  if (factor === 'FR-01haz') return t('lvl.haz');
  if (factor === 'FR-03') {
    const m = /^(.+?)\(段基准\)$/.exec(s);
    if (m) return `${baseLevel(t, m[1])} · ${t('lvl.segBase')}`;
    return baseLevel(t, s);
  }
  if (factor === 'FR-04τ') return t('lvl.nodeDwell');
  if (factor === 'FR-08') return t('lvl.curfew', { n: s.replace('夜禁档', '') });
  if (factor === 'RAIN-V' || factor === 'RAIN-WEAR') return t('lvl.seasonN', { n: s.replace('季节', '') });
  if (factor === 'W-WATER') return t('lvl.water', { n: s.replace('水损权重·季', '') });
  if (factor === 'D-WEAR') return t('lvl.wearMean');
  if (factor === 'CT-05/06') return t('lvl.closedPause');
  if (factor === 'CT-04') return t('dl.CT-04');
  if (factor === 'Hawkes') return t('dl.Hawkes');
  return baseLevel(t, s);
}

/** 引擎 trace 代号 → 中文名（判别该代号是否已收录；多语言文案在 i18n 的 dl.* 键） */
const CODE_LABEL_ZH: Record<string, string> = {
  'FR-01': '道路等级',
  'FR-01haz': '道路等级·风险折算',
  'FR-03': '治安热度（信息）',
  'FR-04': '查验滞留',
  'FR-04τ': '节点滞留时长',
  'FR-05': '承运商等级',
  'FR-06(速)': '地形·车速',
  'FR-06(险)': '地形·事故',
  'FR-07': '路宽',
  'FR-08': '夜禁管制',
  'FR-09': '司机资质',
  'FR-10(事故)': '车况·事故维',
  'FR-10(磨损)': '车况·磨损维',
  'FR-11': '押运配置',
  'FR-12': '出险记录',
  'FR-13': '货值档',
  'FR-14': '发车时段',
  'FR-15(速)': '天气预报·车速（信息）',
  'FR-15(水)': '天气预报·水损权重（信息）',
  'RAIN-V': '季节·减速',
  'RAIN-WEAR': '季节·磨损',
  'W-WATER': '季节·水损权重',
  'D-WEAR': '行程磨损均值',
  'ST-01(f_b)': '态势·事故通道',
  'ST-01(f_c)': '态势·巨灾通道',
  'CT-01(λd)': '冲突等级·巨灾率',
  'CT-03': '替代路线',
  'CT-04': '冲突波动（信息）',
  'CT-05': '节点安全（信息）',
  'CT-06': '口岸运行（信息）',
  'SV-01(水维)': '包装·水损维',
  'SV-01(机械维)': '包装·机械维',
  'SV-02(水维)': '货物·水损维',
  'SV-02(机械维)': '货物·机械维',
  'SV-03': '易损度',
  'SV-04(水维)': '装载·水损维',
  'SV-04(机械维)': '装载·机械维',
  'Hawkes': '证实遇袭走廊',
  'CAP-展示': '展示乘积×2.0封顶回拉',
  'CT-05/06': '节点/口岸关闭→暂停承保',
};

function fmtCoef(c: number): string {
  if (c === 0) return '—';
  if (Math.abs(c) >= 0.0001 && (Math.abs(c) < 1000)) return c.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
  return c.toExponential(2);
}

export function FactorDrawer(props: {
  open: boolean; // 仅在用户点过费率数字后为 true；重算不影响开合
  seg: SegmentQuote | null;
  segName: string;
  loading: boolean;
  onClose: () => void;
}) {
  const { open, seg, segName, loading, onClose } = props;
  const t = useT();
  return (
    <aside
      aria-label={t('drawer.title')}
      aria-hidden={!open}
      className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl ring-1 ring-slate-200 transition-transform duration-200 ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* 重算进度条（抽屉保持不动，数字原地刷新） */}
      {open && loading && (
        <div className="h-0.5 w-full overflow-hidden bg-seik-100">
          <div className="h-full w-1/3 animate-pulse bg-seik-500" />
        </div>
      )}
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div>
          <div className="text-sm font-bold text-slate-900">{t('drawer.title')}</div>
          <div className="text-xs text-slate-500">{seg ? segName : '—'}</div>
        </div>
        <button onClick={onClose} className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label={t('drawer.close')}>
          ✕
        </button>
      </div>

      {seg ? (
        <>
          <div className="grid grid-cols-2 gap-2 border-b border-slate-100 bg-slate-50/70 px-4 py-3 text-xs">
            <Stat label={t('drawer.rate')} value={`${seg.rate.toFixed(4)}%`} accent />
            <Stat label={t('drawer.pure')} value={`${seg.pure.toFixed(3)}%`} accent />
            <Stat label={t('drawer.regCat')} value={`${(seg.regPart ?? 0).toFixed(3)}% / ${seg.catShare.toFixed(3)}%`} />
            <Stat label={t('drawer.freq')} value={seg.freq == null ? '—' : `${(seg.freq * 100).toFixed(1)}%`} />
            <Stat label={t('drawer.speed')} value={seg.vEff == null ? '—' : `${seg.vEff.toFixed(1)} km/h · ${seg.t?.toFixed(1)} h`} />
            <Stat label="λ_acc / λ_cat" value={`${fmtCoef(seg.lamAcc ?? 0)} / ${fmtCoef(seg.lamCat ?? 0)}`} />
          </div>
          {seg.paused && (
            <div className="mx-4 mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 ring-1 ring-red-200">
              {t('drawer.paused')}
            </div>
          )}
          {!seg.paused && seg.capped && (
            <div className="mx-4 mt-3 rounded-xl bg-[#f7e9ef] px-3 py-2 text-xs font-semibold text-[#730024] ring-1 ring-[#e6d7dc]">
              {t('drawer.capped')}
            </div>
          )}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-slate-400">
                  <th className="py-1.5 font-medium">{t('drawer.fh')}</th>
                  <th className="py-1.5 font-medium">{t('drawer.c')}</th>
                </tr>
              </thead>
              <tbody>
                {seg.trace.map((item, i) => (
                  <tr key={`${item.factor}-${i}`} className="border-t border-slate-100">
                    <td className="py-1.5">
                      <span className="font-medium text-slate-700">{labelOf(t, item)}</span>
                      <span className="ml-1.5 rounded bg-slate-100 px-1 py-0.5 text-[10px] text-slate-500">{levelText(t, item)}</span>
                      <span className="ml-1 text-[10px] text-slate-300">{item.factor}</span>
                    </td>
                    <td className="py-1.5 font-mono text-slate-600">{fmtCoef(item.coef)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </aside>
  );
}

function Stat(props: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg bg-white px-2.5 py-1.5 ring-1 ring-slate-200">
      <div className="text-[10px] text-slate-400">{props.label}</div>
      <div className={`font-mono text-[13px] font-semibold ${props.accent ? 'text-seik-700' : 'text-slate-700'}`}>
        {props.value}
      </div>
    </div>
  );
}
