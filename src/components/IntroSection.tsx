// ============================================================
// 项目介绍区（T103 · W1 · 需求2）
// 文案来源=database/01_project_facts.md（产品三句话/市场/合规/术语）；
// 引用费率处标注快照日期（2026-10-02）；零硬编码引擎数值（红线1）。
// ============================================================
const SNAPSHOT = '2026-10-02';

const THREE_SENTENCES = [
  {
    t: '算得清',
    d: '26因子费率引擎把每段路的风险拆成磨损、事故、巨灾三条通道，蒙特卡洛合成单票纯保费与费率/百公里。',
  },
  {
    t: '保得住',
    d: 'UBI 货运险由缅甸本地持牌险企自主承保，超额合规分保；平台境外纯技术 SaaS 主体（DICA 注册）不持牌、不触碰保费。',
  },
  {
    t: '看得见',
    d: '"保费导航"给出起讫点之间的多路径费率报价，矢量地图逐段透视因子档位与封顶/暂停状态。',
  },
];

const MARKET = [
  ['服装出口 2012-2022', '约9亿 → 92亿美元（>900%）'],
  ['2022 占全国出口', '约1/3'],
  ['企业与就业', '800+ 企业 · 直接雇佣 50 万人'],
  ['FOB 转型', '风险区间延伸至"仰光港/边境口岸船舷"，形成传统保险拒保的责任真空'],
];

const COMPLIANCE = [
  'IBRB 第4/2020号指令：承保主体须为缅甸本地持牌险企，禁外资纯 fronting；本地险企行使核保、签单、准备金与自留。',
  '境外主体经 DICA 注册为纯技术服务实体，无需 MIC 许可；服务费经 FESC 项下合法汇出。',
  '道德风险防线：Smartphone-as-a-Sensor + 反 Spoofing 监听 + 事中 Geofencing 走廊围栏 + 时间戳/轨迹封存。',
];

const TERMS = [
  ['出险频率', '单次运输发生≥免赔额理赔事件的概率'],
  ['损失强度', '单次事件货值折损比例期望'],
  ['纯保费', '期望损失（费率%），不含费用与利润'],
  ['毛保费', '纯保费 + 费用 + 利润 + 风险边际（引擎 loading=35%）'],
];

export function IntroSection() {
  return (
    <section id="intro" className="scroll-mt-16 bg-pg-cream py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="font-serif text-2xl font-bold tracking-tight text-pg-navy sm:text-3xl">产品介绍</h2>
        <p className="mt-1 text-sm text-slate-500">
          事实来源：01_project_facts.md · 引用费率均为 {SNAPSHOT} 快照条件费率
        </p>

        {/* 三句话 */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {THREE_SENTENCES.map((s) => (
            <div key={s.t} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="font-serif text-lg font-bold text-seik-700">{s.t}</div>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.d}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {/* 市场 */}
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h3 className="text-base font-bold text-pg-navy">市场背景（答辩口径）</h3>
            <dl className="mt-3 space-y-2.5 text-sm">
              {MARKET.map(([k, v]) => (
                <div key={k} className="flex gap-3">
                  <dt className="w-40 shrink-0 font-medium text-slate-500">{k}</dt>
                  <dd className="text-slate-700">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          {/* 合规 */}
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h3 className="text-base font-bold text-pg-navy">合规要点</h3>
            <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-slate-600">
              {COMPLIANCE.map((c) => (
                <li key={c} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-pg-greenLight" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 术语 */}
        <div className="mt-8 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h3 className="text-base font-bold text-pg-navy">术语规范（全团队强制，禁止混用）</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {TERMS.map(([k, v]) => (
              <div key={k} className="rounded-xl bg-pg-cream p-3">
                <div className="text-sm font-bold text-seik-700">{k}</div>
                <div className="mt-1 text-xs leading-relaxed text-slate-500">{v}</div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-400">
            例：走廊B中纵线全程毛保费 {SNAPSHOT} 快照约 0.216%（纯保费0.141%），锚带 0.1-0.5% 判定通过——数字随引擎实时变化，此处仅示例快照。
          </p>
        </div>
      </div>
    </section>
  );
}
