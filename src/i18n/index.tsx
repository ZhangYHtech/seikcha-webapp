// ============================================================
// 多语言（2026-10-05）：简体中文 / English / မြန်မာ（缅甸语）
// 结构：STRINGS[key] = ['中','英','缅']；useT() 返回 t(key, vars?)。
// 语言偏好存 localStorage('seikcha-lang')，由 Nav 右上角地球仪切换。
// 缅甸语文案为工程稿，上线前建议请母语同学复核一遍。
// ============================================================
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Lang = 'zh' | 'en' | 'my';
export const LANGS: { id: Lang; label: string }[] = [
  { id: 'zh', label: '简体中文' },
  { id: 'en', label: 'English' },
  { id: 'my', label: 'မြန်မာ' },
];

const IDX: Record<Lang, 0 | 1 | 2> = { zh: 0, en: 1, my: 2 };

// key: [zh, en, my]
const STRINGS: Record<string, [string, string, string]> = {
  // ---------- 导航 ----------
  'meta.title': ['SEIKCHA · 安心 — 缅甸服装出口内陆运输保险', 'SEIKCHA · Inland cargo insurance for Myanmar garment exports', 'SEIKCHA · မြန်မာ အထည်ချုပ်တင်ပို့ရေး ပြည်တွင်း ကုန်ပစ္စည်း အာမခံ'],
  'hero.aria': ['首页宣传', 'Homepage hero', 'ပင်မ မြှင့်တင်ရေး'],
  'img.hero.alt': ['集装箱码头航拍', 'Container terminal from above', 'ကွန်တိန်နာ ဆိပ်ကမ်း'],
  'img.cta.alt': ['集装箱码头暮色', 'Container terminal at dusk', 'ကွန်တိန်နာ ဆိပ်ကမ်း ညနေ'],
  'about.process.aria': ['投保流程', 'Insurance process', 'အာမခံလုပ်ငန်းစဉ်'],
  'nav.about': ['了解 SEIKCHA', 'About SEIKCHA', 'SEIKCHA အကြောင်း'],
  'nav.faq': ['常见问题', 'FAQs', 'မေးခွန်းများ'],
  'nav.cta': ['准备好报价', 'Get a quote', 'စျေးနှုန်းတောင်းခံရန်'],
  'lang.label': ['语言', 'Language', 'ဘာသာစကား'],

  // ---------- 档位/数据值（因子抽屉 level 芯片；引擎数据值保持中文，仅在展示层映射） ----------
  'lvl.fr01': ['{n} 级路', 'Class {n} road', 'အဆင့် {n} လမ်း'],
  'lvl.haz': ['风险折算', 'risk-adjusted', 'အန္တရာယ် ချိန်ညှိ'],
  'lvl.segBase': ['段基准', 'segment baseline', 'လမ်းကဏ္ဍ အခြေခံ'],
  'lvl.nodeDwell': ['节点滞留', 'node dwell', 'ဂိတ်နေချိန်'],
  'lvl.curfew': ['夜禁档 {n}', 'curfew tier {n}', 'ည ကျော့ကွပ် အဆင့် {n}'],
  'lvl.seasonN': ['季节 {n}', 'season {n}', 'ရာသီ {n}'],
  'lvl.water': ['水损权重 · 季{n}', 'water weight · season {n}', 'ရေ အလေးချိန် · ရာသီ {n}'],
  'lvl.wearMean': ['磨损均值（货值占比）', 'wear mean (share of cargo value)', 'ပျက်စီးမှု ပျမ်းမျှ'],
  'lvl.closedPause': ['关闭 → 暂停承保', 'closed → suspended', 'ပိတ် → ရပ်နား'],
  'lvl.fr03.base': ['段基准', 'segment baseline', 'လမ်းကဏ္ဍ အခြေခံ'],
  'lvl.fr03.low': ['低', 'Low', 'နိမ့်'],
  'lvl.fr03.mid': ['中', 'Medium', 'အလယ်'],
  'lvl.fr03.high': ['高', 'High', 'မြင့်'],
  'lvl.fr03.ext': ['极高', 'Very high', 'အလွန်မြင့်'],
  'lvl.fr15.good': ['好', 'Good', 'ကောင်း'],
  'lvl.fr15.flat': ['平', 'Normal', 'ပုံမှန်'],
  'lvl.fr15.storm': ['暴雨', 'Heavy rain', 'မိုးသည်းထန်'],
  'lvl.fr15.ext': ['极端', 'Extreme', 'အလွန်ပြင်းထန်'],
  'lvl.fr04.ok': ['通畅', 'Smooth', 'ပြောင်လွယ်'],
  'lvl.fr04.strict': ['严查长队', 'Strict checks · long queues', 'စစ်ဆေးရေး တင်းကျပ်'],
  'lvl.fr04.inter': ['间歇关闭', 'Intermittent closure', 'အချိန်အလိုက် ပိတ်'],
  'lvl.fr06.plain': ['平原', 'Plain', 'မြေပြန့်'],
  'lvl.fr06.hill': ['丘陵', 'Hilly', 'တောင်ကုန်း'],
  'lvl.fr06.mountain': ['山区险路', 'Hazardous mountain road', 'တောင်တန်း အန္တရာယ်လမ်း'],
  'lvl.ct03.yes': ['有替代', 'Alternative exists', 'အစားထိုးလမ်း ရှိ'],
  'lvl.ct03.no': ['无替代', 'No alternative', 'အစားထိုးလမ်း မရှိ'],
  'map.popup.rate': ['费率/百公里', 'Rate/100km', 'စျေးနှုန်း/၁၀၀km'],
  'map.popup.s3': ['S3 冲突·暂停承保', 'S3 conflict · suspended', 'S3 ပဋိပက္ခ · ရပ်နား'],
  'trend.aria': ['近30日综合费率走势图', '30-day composite rate trend chart', '၃၀ ရက် စျေးနှုန်း လမ်းကြောင်း ဇယား'],
  'contact.hint': ['客服组件待配置：请填入 tawk.to 嵌入地址（VITE_TAWK_SRC）', 'Chat widget not configured: set the tawk.to embed URL (VITE_TAWK_SRC)', 'Chat widget မထည့်ရသေး- tawk.to embed URL ထည့်ပါ'],

  // ---------- 首页 Hero ----------
  // EN：按用户要求两行= "Every kilometer is / priced clearly, covered surely."
  'hero.l1': ['从工厂大门到船舷边，', 'Every kilometer is', 'စက်ရုံတံခါးမှ သင်္ဘောဆိပ်အထိ၊'],
  'hero.l2a': ['每一公里都', '', 'တစ်ကီလိုမီတာတိုင်း '],
  'hero.l2b': ['算得清、保得住', 'priced clearly, covered surely', 'တွက်ချက်မှန်၊ အာမခံချက်ခိုင်'],
  'hero.l2c': ['。', '.', ' ပါ။'],

  // ---------- 了解 SEIKCHA ----------
  'about.h1pre': ['了解 ', 'About ', ''],
  'about.h1post': ['', '', ' အကြောင်း'],
  'about.clear.title': ['算得清', 'Priced clearly', 'တွက်ချက်မှန်'],
  'about.clear.lead': ['把看不见的运输风险，算成看得懂的价格。', 'Turn invisible transport risk into a price you can understand.', 'မမြင်ရသော သယ်ယူပို့ဆောင်ရေး အန္တရာယ်ကို နားလည်နိုင်သော စျေးနှုန်းအဖြစ် တွက်ပေးသည်။'],
  'about.clear.body': ['融合道路、天气、冲突与节点风险，让每一段路都有自己的风险画像与动态保费。', 'Road, weather, conflict and node risks are fused so every segment gets its own risk profile and dynamic premium.', 'လမ်း၊ ရာသီဥတု၊ ပဋိပက္ခနှင့် ဂိတ်အန္တရာယ်များကို ပေါင်းစပ်တွက်ချက်ကာ လမ်းကဏ္ဍတစ်ခုစီတွင် ကိုယ်ပိုင် အန္တရာယ်ပုံရိပ်နှင့် ပြောင်းလဲနိုင်သော ပရီမီယံ ရှိစေသည်။'],
  'about.safe.title': ['保得住', 'Covered surely', 'အာမခံချက်ခိုင်'],
  'about.safe.lead': ['不是简单"加价"，而是知道什么时候该保、什么时候该停。', 'Not a simple markup — you know when to insure and when to pause.', 'ရိုးရှင်းသော စျေးတိုးမှုမဟုတ်ဘာ မည်သည့်အခါ အာမခံသင့်၊ မည်သည့်အခါ ရပ်သင့်ကို သိရသည်။'],
  'about.safe.body': ['从日常货损到战争巨灾，定价与承保边界同步响应。', 'From everyday cargo damage to war-scale catastrophe, pricing and underwriting boundaries respond in step.', 'နေ့စဉ် ကုန်ပစ္စည်းပျက်ဆီးမှုမှ စစ်ဘေးအန္တရာယ်ကြီးအထိ စျေးနှုန်းနှင့် အာမခံနယ်နိသယ်များ တစ်ပြိုင်နက် တုံ့ပြန်သည်။'],
  'about.whynow.title': ['为什么是现在', 'Why now', 'အချိန်အခု'],
  'about.whynow.lead': ['FOB 转型正在把内陆运输风险重新交还给出口商。', 'The FOB transition is handing inland transport risk back to exporters.', 'FOB သို့ ပြောင်းလဲမှုက ပြည်တွင်းပို့ဆောင်ရေး အန္တရာယ်ကို တင်ပို့သူများဆီ ပြန်အပ်နေသည်။'],
  'about.whynow.body': ['缅甸成衣出口规模持续扩大，而冲突、极端天气与基础设施脆弱性，让"工厂到港口"成为新的风险断点。', 'Myanmar garment exports keep growing, while conflict, extreme weather and fragile infrastructure make the factory-to-port leg the new risk breakpoint.', 'မြန်မာ၏ အထည်ချုပ်တင်ပို့မှု ဆက်လက် ကြီးထွားနေသော်လည်း ပဋိပက္ခ၊ ပြင်းထန်သော ရာသီဥတုနှင့် အခြေခံအဆောက်အအုံ ချို့ယွင်းမှုတို့ကြောင့် စက်ရုံမှ ဆိပ်ကမ်းအထိ အပိုင်းသည် အန္တရာယ်အသစ် ဖြစ်လာသည်။'],
  'about.visible.title': ['看得见', 'See it clearly', 'မြင်ရအောင်'],
  'about.visible.lead': ['一张地图，看清路线、风险与保费。', 'One map shows routes, risk and premium.', 'မြေပုံတစ်ခုတည်းဖြင့် လမ်းကြောင်း၊ အန္တရာယ်နှင့် ပရီမီယံကို တွေ့မြင်နိုင်သည်။'],
  'about.visible.body': ['多条候选路线同屏比较，高风险路段、动态费率与风险状态一目了然。', 'Compare multiple candidate routes side by side — high-risk segments, dynamic rates and status at a glance.', 'လမ်းကြောင်းလျာ များစွာကို တစ်ပြိုင်တည်း နှိုင်းယှဉ်နိုင်ပြီး အန္တရာယ်မြင့် လမ်းပိုင်း၊ ပြောင်းလဲနိုင်သော စျေးနှုန်းနှင့် အခြေအနေများကို တစ်ကြည့်တည်း သိနိုင်သည်။'],
  'about.tracked.title': ['跟得上', 'Always current', 'လိုက်နိုင်'],
  'about.tracked.lead': ['风险每天在变，数据也必须每天更新。', 'Risk changes daily — data must change daily too.', 'အန္တရာယ်သည် နေ့တိုင်း ပြောင်းလဲသကဲ့သို့ ဒေတာလည်း နေ့တိုင်း မွမ်းမံရမည်။'],
  'about.tracked.body': ['自动跟踪天气、治安、冲突、节点与口岸状态，把最新外部信息转化为可审计的动态风险快照。', 'Weather, security, conflict, nodes and ports are tracked automatically, turning fresh external signals into auditable daily risk snapshots.', 'ရာသီဥတု၊ လုံခြုံရေး၊ ပဋိပက္ခ၊ ဂိတ်များကို အလိုအလျောက် စောင့်ကြည့်ကာ နေ့စဉ် အန္တရာယ်အခြေအနေကို စစ်ဆေးနိုင်သော ဒေတာအဖြစ် ပြောင်းလဲပေးသည်။'],
  'about.video.watch': ['观看宣传片', 'Watch the video', 'ဗီဒီယို ကြည့်ရန်'],
  'about.video.note': ['1080p · 约36MB · 点击放大播放', '1080p · ~36MB · click to enlarge', '1080p · ၃၆MB ခန့် · နှိပ်ပြီး ချဲ့ကြည့်ပါ'],
  'about.video.modal': ['SEIKCHA 宣传片', 'SEIKCHA video', 'SEIKCHA ဗီဒီယို'],
  'about.video.close': ['关闭宣传片', 'Close video', 'ဗီဒီယို ပိတ်ရန်'],
  'about.video.fallback': ['您的浏览器不支持视频播放，请升级后重试。', 'Your browser does not support video playback. Please upgrade and try again.', 'သင်၏ ဘရောက်ဆာသည် ဗီဒီယို ပြသခြင်းကို ပံ့ပိုးမထားပါ။'],
  // EN 四步文案照搬 policygenius.com（副标题保留我方口径，不出现 Policygenius 字样）
  'about.process.h2a': ['我们让投保流程 ', 'We make the process ', 'ကျွန်ုပ်တို့သည် အာမခံလုပ်ငန်းစဉ်ကို '],
  'about.process.h2b': ['简单省心', 'easy.', 'ရိုးရှင်းပြီး စိတ်ချရ'],
  'about.process.h2c': ['。', '', ' ဖြစ်စေသည်။'],
  'about.process.sub': ['SEIKCHA 简化投保体验：从费率比较、专家支持到方案选择，一站式完成。无论您寻求基础保障还是更全面的保护，都能更轻松地评估各项选择。', 'SEIKCHA simplifies the insurance shopping experience by guiding you from rate comparison to expert support to plan selection in one streamlined process. Whether you\'re looking for basic or more robust protection, we make it easier to review your options.', 'SEIKCHA သည် အာမခံအတွေ့အကြုံကို ရိုးရှင်းစေသည်- စျေးနှုန်းနှိုင်းယှဉ်ခြင်း၊ ကျွမ်းကျင်သူ အထောက်အပံ့နှင့် အစီအစဉ် ရွေးချယ်ခြင်းတို့ကို တစ်နေရာတည်းဖြင့် ပြီးမြောက်စေသည်။'],
  'about.step1.title': ['选择您的保险类型', 'Choose your insurance type', 'အာမခံအမျိုးအစား ရွေးချယ်ပါ'],
  'about.step1.body': ['我们可以帮助您轻松了解内陆货运险的投保市场与保障范围。', 'We can help you navigate the inland cargo insurance market and what it covers with ease.', 'ပြည်တွင်း ကုန်ပစ္စည်း အာမခံ စျေးကွက်နှင့် အကျုံးဝင်မှုကို လွယ်ကူစွာ နားလည်နိုင်ရန် ကူညီပေးသည်။'],
  'about.step2.title': ['告诉我们您的情况', 'Tell us about yourself', 'သင့်အခြေအနေကို ပြောပြပါ'],
  'about.step2.body': ['这将帮助我们为您找到最合适、最贴合的保障方案。', 'This will help us find the unique plan that fits you.', 'သင့်အတွက် အကောင်းဆုံး ကိုက်ညီသော အကာအကွယ်ကို ရှာဖွေပေးနိုင်ရန် ဖြစ်သည်။'],
  'about.step3.title': ['与专家取得联系', 'Get connected with an expert', 'ကျွမ်းကျင်သူနှင့် ဆက်သွယ်ပါ'],
  'about.step3.body': ['我们的持牌专家团队将了解您的需求、解答疑问，帮助您放心做出决策。', 'Our team of licensed experts is here to learn your needs, answer questions, and help you make decisions with confidence.', 'လိုင်စင်ရ ကျွမ်းကျင်သူအဖွဲ့မှ သင့်လိုအပ်ချက်ကို နားလည်ပြီး မေးခွန်းများ ဖြေကြားကာ ယုံကြည်စိတ်ချစွာ ဆုံးဖြတ်နိုင်ရန် ကူညီပေးသည်။'],
  'about.step4.title': ['选择您的完美方案', 'Choose your perfect plan', 'သင့်လျော်သော အစီအစဉ် ရွေးချယ်ပါ'],
  'about.step4.body': ['从专家精选的方案清单中，选择最契合您需求的保障。', 'Select a plan based on an expert-curated list of policies built for your needs.', 'ကျွမ်းကျင်သူများ ရွေးချယ်ထားသော အစီအစဉ်များအနက် သင့်လိုအပ်ချက်နှင့် အကောင်းဆုံး ကိုက်ညီသည့် အကာအကွယ်ကို ရွေးချယ်ပါ။'],

  // ---------- 常见问题 ----------
  'faq.h2': ['常见问题', 'FAQs', 'မေးခွန်းများ'],
  'faq.sub': ['了解 SEIKCHA 的承保主体、费率计算口径、报价有效期与路段状态规则。', 'The underwriting entity, rate methodology, quote validity and segment status rules.', 'အာမခံချက်ထုတ်ပြန်သူ၊ စျေးနှုန်းတွက်ချက်နည်း၊ စျေးနှုန်းသက်တမ်းနှင့် လမ်းကဏ္ဍအခြေအနေ စည်းမျဉ်းများ။'],
  'faq.q1': ['SEIKCHA 是保险公司吗？保单由谁承保？', 'Is SEIKCHA an insurance company? Who underwrites the policy?', 'SEIKCHA သည် အာမခံကုမ္ပဏီလား။ ပေါလီစီကို မည်သူ အာမခံသနည်း။'],
  'faq.a1': ['不是。SEIKCHA 是纯技术服务的"保费导航"平台：境外主体经 DICA 注册为纯技术服务实体，不持牌、不触碰保费。UBI 货运险由缅甸本地持牌险企自主承保，行使核保、签单、准备金与自留，并完成超额合规分保。', 'No. SEIKCHA is a pure-technology "premium navigation" platform: the overseas entity is registered via DICA as a pure technical-service entity — unlicensed by design, it never touches premiums. UBI cargo policies are underwritten by licensed local insurers in Myanmar, which perform underwriting, policy issuance, reserving and retention, plus compliant surplus reinsurance.', 'မဟုတ်ပါ။ SEIKCHA သည် သန့်စင်သော နည်းပညာဝန်ဆောင်မှု "ပရီမီယံ လမ်းညွှန်" ပလက်ဖောင်းဖြစ်သည်- DICA မှတဆင့် နည်းပညာဝန်ဆောင်မှုအဖြစ် မှတ်ပုံတင်ထားပြီး လိုင်စင်မရှိဘဲ ပရီမီယံကို မထိတွေ့ပါ။ UBI ကုန်ပစ္စည်း အာမခံကို မြန်မာရှိ လိုင်စင်ရ အာမခံကုမ္ပဏီများမှ စိစစ်အာမခံကာ ပြန်အာမခံမှုလည်း ပြုလုပ်သည်။'],
  'faq.q2': ['费率是怎么算出来的？', 'How are the rates calculated?', 'စျေးနှုန်းကို မည်သို့ တွက်ချက်သနည်း။'],
  'faq.a2': ['26 个因子把每段路的风险拆成磨损、事故、巨灾三条通道，由确定性核心与每段 20 万次蒙特卡洛模拟合成单票纯保费与"费率/百公里"。全部系数来自权威因子表，输出带封顶保护——极端评分不会击穿模型。', '26 factors split each segment\'s risk into wear, accident and catastrophe channels; a deterministic core plus 200,000 Monte Carlo simulations per segment produce the per-trip pure premium and the rate per 100 km. Every coefficient comes from the authoritative factor tables and outputs are capped — extreme scores never break the model.', 'အချက် ၂၆ ခုက လမ်းကဏ္ဍတစ်ခုစီ၏ အန္တရာယ်ကို ပျက်စီးမှု၊ မတော်တဆမှုနှင့် ဘေးအန္တရာယ် လမ်းကြောင်းများအဖြစ် ခွဲပြီး သတ်မှတ်စနစ်နှင့် လမ်းကဏ္ဍတစ်ခုလျှင် Monte Carlo ၂၀၀,၀၀၀ ကြိမ်ဖြင့် ခရီးတစ်ခေါက်လျှင် သန့်ရှင်းပရီမီယံနှင့် ၁၀၀ ကီလိုမီတာလျှင် စျေးနှုန်းကို တွက်သည်။ ကိန်းဂဏန်းအားလုံးကို တရားဝင် ဇယားမှ ရယူကာ ရလဒ်များတွင် ကန့်သတ်အမိုးအကာ ထားရှိသည်။'],
  'faq.q3': ['"纯保费"和"毛保费"有什么区别？', 'What is the difference between pure and gross premium?', 'သန့်ရှင်းပရီမီယံနှင့် စုစုပေါင်းပရီမီယံ ဘယ်ကွာသလဲ။'],
  'faq.a3': ['纯保费 = 期望损失（费率%），不含费用与利润；毛保费 = 纯保费 + 费用 + 利润 + 风险边际（引擎加载系数 35%）。两者与费率/百公里在逐段明细中实时联动，可随时核对。', 'Pure premium = expected loss (rate %), excluding expenses and profit. Gross premium = pure premium + expenses + profit + risk margin (35% loading). Both and the per-100-km rate update live in the segment table for verification at any time.', 'သန့်ရှင်းပရီမီယံ = မျှော်မှန်း ဆုံးရှုံးနိုင်မှု (စျေးနှုန်း %) ဖြစ်ပြီး ကုန်ကျစရိတ်နှင့် အမြတ် မပါဝင်ပါ။ စုစုပေါင်းပရီမီယံ = သန့်ရှင်းပရီမီယံ + ကုန်ကျစရိတ် + အမြတ် + အန္တရာယ်စရန် (၃၅% loading)။ နှစ်မျိုးစလုံးကို လမ်းကဏ္ဍအသေးစိတ်တွင် အချိန်မရွေး စစ်ဆေးနိုင်သည်။'],
  'faq.q4': ['为什么有些路段显示"暂停禁售"，无法报价？', 'Why are some segments marked "paused" and unquotable?', 'အချို့လမ်းပိုင်းများတွင် "ရပ်နား" ဟုပြပြီး စျေးနှုန်း မရနိုင်သည်မှာ အဘယ်ကြောင့်နည်း။'],
  'faq.a4': ['产品规则优先：路段态势进入 S3（冲突）或节点/口岸关闭时，该段暂停新报价，一览表显示"——"并标红"暂停禁售"。这是保护性规则而非计算错误；选择一条不含暂停段的其他路径方案即可继续报价。', 'Product rules take priority: when a segment\'s situation enters S3 (conflict) or its nodes/ports close, new quotes are suspended — the table shows "——" with a red "paused" mark. This is a protective rule, not a calculation error; pick another route option without paused segments.', 'ထုတ်ကုန်စည်းမျဉ်းက ဦးစားပေးသည်- လမ်းကဏ္ဍ၏ အခြေအနေ S3 (ပဋိပက္ခ) ရောက်သော်လည်းကောင်း၊ ဂိတ်များ ပိတ်သော်လည်းကောင်း စျေးနှုန်းအသစ်ကို ရပ်နားသည်။ ဤသည်မှာ အကာအကွယ် စည်းမျဉ်းဖြစ်ပြီး တွက်ချက်မှုအမှား မဟုတ်ပါ- ရပ်နားထားသော လမ်းပိုင်းမပါသည့် အခြားလမ်းကြောင်းကို ရွေးပါ။'],
  'faq.q5': ['[封顶] 标记是什么意思？', 'What does the [CAPPED] mark mean?', '[ကန့်သတ်] အမှတ်အသားဆိုသည်မှာ အဘယ်နည်း။'],
  'faq.a5': ['当单票纯保费触到 12%、或费率/百公里触到 3% 时，输出会被截断并标注 [封顶]。封顶是输出层防线，模型永不输出封顶之上的数字。', 'When a single-trip pure premium reaches 12%, or the rate per 100 km reaches 3%, the output is truncated and marked [CAPPED]. The cap is an output-layer safeguard — the model never outputs numbers above it.', 'ခရီးတစ်ခေါက်လျှင် သန့်ရှင်းပရီမီယံ ၁၂% သို့မဟုတ် ၁၀၀ ကီလိုမီတာလျှင် စျေးနှုန်း ၃% ရောက်ပါက ရလဒ်ကို ဖြတ်တောက်ပြီး [ကန့်သတ်] ဟု အမှတ်အသား ပြုသည်။ ကန့်သတ်ချက်အထက်သို့ မထွက်နိုင်ပါ။'],
  'faq.q6': ['报价为什么只有 7 天有效期？', 'Why are quotes valid for only 7 days?', 'စျေးနှုန်းတင်ပြချက်သည် ၇ ရက်သာ သက်တမ်းရှိသည်မှာ အဘယ်ကြောင့်နည်း။'],
  'faq.a6': ['本站全部费率为 2026-10-02 状态的快照条件费率（态势、季节、信息因子均按该快照）。市场与安全环境变化后费率随之失效重估，因此每份报价自生成时点起 7 天内有效；逾期需以最新信息因子快照重新报价。', 'All rates on this site are snapshot conditional rates as of 2026-10-02 (situation, season and info factors per that snapshot). Rates lapse and are re-priced when market and security conditions change, so each quote is valid for 7 days from generation; afterwards re-quote with the latest info-factor snapshot.', 'ဤဝဘ်ဆိုဒ်ရှိ စျေးနှုန်းအားလုံးသည် ၂၀၂၆-၁၀-၀၂ အခြေအနေအရ သိမ်းဆည်းထားသော အချိန်အပိုင်းအခြား စျေးနှုန်းဖြစ်သည်။ စျေးကွက်နှင့် လုံခြုံရေး အခြေအနေ ပြောင်းလဲပါက ပြန်တွက်သည်- ထို့ကြောင့် တစ်ခုစီသည် ဖန်တီးသည့်နေ့မှ ၇ ရက် သက်တမ်းရှိသည်။'],
  'faq.q7': ['地图上的虚线路段是什么？', 'What are the dashed segments on the map?', 'မြေပုံပေါ်ရှိ အကိုက်အခဲ လမ်းပိုင်းများမှာ အဘယ်နည်း။'],
  'faq.a7': ['实线 = [C] 确认路段（15 条权威段），虚线 = [E] 推定路段（含 4 条演示用假设联络段）。假设段是真实存在的替代通道，但内置因子按同类权威段类比推档，仅用于构成多方案对比；权威段及其费率口径不受影响。', 'Solid lines = [C] confirmed segments (15 authoritative segments); dashed = [E] presumed segments (incl. 4 demo-only hypothetical connectors). Hypothetical segments are real alternative routes whose factors are estimated by analogy with authoritative segments — they exist for multi-route comparison; authoritative segments and their pricing are unaffected.', 'မျဉ်းဆက် = [C] အတည်ပြု လမ်းကဏ္ဍ (၁၅ ခု)၊ အကိုက်အခဲ = [E] ခန့်မှန်း လမ်းကဏ္ဍ (ပြသာပြု အဆက် ၄ ခု အပါအဝင်)။ ခန့်မှန်းလမ်းကဏ္ဍများသည် တကယ်တည်ရှိသော အစားထိုးလမ်းများဖြစ်ပြီး လမ်းကြောင်းများစွာ နှိုင်းယှဉ်ရန်သာ အသုံးပြုသည်။'],
  'faq.q8': ['我需要填写哪些信息？自报会影响理赔吗？', 'What do I need to fill in? Do self-reported details affect claims?', 'မည်သည့်အချက်အလက်များ ဖြည့်ရမည်နည်း။ ကိုယ်တိုင်ဖော်ပြချက်များသည် စာချုပ်တောင်းခံမှုကို သက်ရောက်သလား။'],
  'faq.a8': ['只需选择起讫点与季节即可出价；承运商等级、司机资质、车况、押运配置、出险记录、单票货值、发车时段等自报项默认按基准档，可按实际运输安排调整。自报档位将折算为引擎系数参与计价，虚假自报将触发理赔核减。', 'Just pick origin, destination and season to get a quote; carrier grade, driver credentials, vehicle condition, escort, claims history, cargo value and departure time default to baseline levels and can be adjusted to your actual arrangement. Self-reported tiers feed the engine as coefficients — false reporting triggers claim reductions.', 'အစမှတ်၊ အဆုံးမှတ်နှင့် ရာသီကိုသာ ရွေးပါက စျေးနှုန်း ရနိုင်သည်။ အခြားအချက်များကို ပုံမှန်အဆင့်ဖြင့် ထားရှိပြီး အမှန်တကယ် အခြေအနေအရ ချိန်ညှိနိုင်သည်။ ကိုယ်တိုင်ဖော်ပြသော အဆင့်များကို ကိန်းဂဏန်းများအဖြစ် အသုံးပြုပြီး မှားယွင်းစွာ ဖော်ပြပါက စာချုပ်တောင်းခံနိုင်မှု လျှော့ချမည်။'],

  // ---------- CTA ----------
  // EN：按用户要求两行 = "Find the road / worth taking."（worth taking 带下划线）
  'cta.h2a': ['不只找一条路，', 'Find the road', 'လမ်းတစ်ကြောင်းသာမက '],
  'cta.h2pre': ['更要找到 ', '', ''],
  'cta.h2b': ['值得走的路', 'worth taking', 'သွားသင့်သောလမ်း'],
  'cta.h2post': ['。', '.', ' ကို ရှာပါ။'],
  'cta.sub': ['比较候选路线的运输风险、动态保费与承保状态，在发车前看清每一段路的风险成本。', 'Compare transport risk, dynamic premiums and underwriting status across candidate routes — see the risk cost of every segment before departure.', 'လမ်းကြောင်းလျာ၏ သယ်ယူပို့ဆောင်ရေး အန္တရာယ်၊ ပြောင်းလဲနိုင်သော ပရီမီယံနှင့် အာမခံအခြေအနေကို နှိုင်းယှဉ်ပြီး ထွက်ခွာမှုမတိုင်မီ လမ်းပိုင်းတစ်ခုစီ၏ အန္တရာယ်ကုန်ကျစရိတ်ကို တွေ့မြင်နိုင်သည်။'],

  // ---------- 问卷 ----------
  'form.h1': ['填写报价信息', 'Quote details', 'စျေးနှုန်းအချက်အလက် ဖြည့်ပါ'],
  'form.sub': ['这些信息用于计算各路段的动态保费，已按基准档预填，可直接继续。', 'Used to compute each segment\'s dynamic premium. Pre-filled at baseline — continue directly if you like.', 'ဤအချက်အလက်များကို လမ်းကဏ္ဍတစ်ခုစီ၏ ပြောင်းလဲနိုင်သော ပရီမီယံ တွက်ရန် အသုံးပြုသည်။ ပုံမှန်အတိုင်း ဖြည့်ပေးထားသဖြင့် တိုက်ရိုက် ဆက်နိုင်သည်။'],
  'form.g1': ['货物与装载', 'Cargo & packing', 'ကုန်ပစ္စည်းနှင့် ထုပ်ပိုးမှု'],
  'form.g2': ['运输安排自报', 'Transport arrangement', 'သယ်ယူပို့ဆောင်ရေး စီစဉ်မှု'],
  'form.q.season': ['本次运输的季节', 'Season of this shipment', 'ဤပို့ဆောင်မှု၏ ရာသီ'],
  'form.q.pack': ['包装方式', 'Packing', 'ထုပ်ပိုးနည်း'],
  'form.q.cargo': ['货物类型', 'Cargo type', 'ကုန်ပစ္စည်း အမျိုးအစား'],
  'form.q.frag': ['易损度', 'Fragility', 'ပျက်စီးလွယ်မှု'],
  'form.q.load': ['装载方式', 'Loading', 'တင်ဆောင်နည်း'],
  'form.q.carrier': ['承运商等级', 'Carrier grade', 'သယ်ယူသူ အဆင့်'],
  'form.q.driver': ['司机资质', 'Driver credentials', 'မောင်းသူ အရည်အချင်း'],
  'form.q.veh': ['车况', 'Vehicle condition', 'ကား အခြေအနေ'],
  'form.q.escort': ['押运配置', 'Escort', 'လိုက်ပါ စောင့်ရှောက်မှု'],
  'form.q.claims': ['出险记录', 'Claims history', 'အာမခံ မှတ်တမ်း'],
  'form.q.value': ['单票货值', 'Cargo value per trip', 'တစ်ခေါက်လျှင် ကုန်တန်ဖိုး'],
  'form.q.time': ['发车时段', 'Departure time', 'ထွက်ခွာချိန်'],
  'form.continue': ['继续', 'Continue', 'ဆက်လက်ရန်'],
  'form.note': ['以上信息仅用于本地保费计算，全程默认基准档可随时返回修改。', 'Used only for local premium calculation; baseline defaults apply and you can return to change them anytime.', 'ဤအချက်အလက်များကို ဤစက်အတွင်း ပရီမီယံတွက်ရန်သာ အသုံးပြုသည်။ အချိန်မရွေး ပြန်လာပြင်နိုင်သည်။'],
  'opt.season0': ['旱季（11月-2月）', 'Dry season (Nov–Feb)', 'မိုးခေါင်ရာသီ (နိုဝင်ဘာ-ဖေဖော်ဝါရီ)'],
  'opt.season1': ['过渡季', 'Shoulder season', 'ကူးပြောင်းရာသီ'],
  'opt.season2': ['季风季', 'Monsoon season', 'မုတ်သုန်ရာသီ'],
  'opt.season3': ['极端天气', 'Extreme weather', 'ပြင်းထန်သော ရာသီဥတု'],
  'opt.pack.carton': ['纸箱', 'Carton', 'သေတ္တာ'],
  'opt.pack.canvas': ['防雨帆布', 'Rain-proof canvas', 'မိုးခံကန်ဝါစ်'],
  'opt.pack.pallet': ['防雨+托盘', 'Rain-proof + pallet', 'မိုးခံ + ပယ်လက်'],
  'opt.cargo.garment': ['服装', 'Garments', 'အထည်ချုပ်'],
  'opt.cargo.general': ['杂货', 'General cargo', 'ယေဘုယျ ကုန်ပစ္စည်း'],
  'opt.frag.low': ['低易损', 'Low fragility', 'ပျက်စီးလွယ်မှု နည်း'],
  'opt.frag.normal': ['普通', 'Normal', 'ပုံမှန်'],
  'opt.frag.high': ['高易损', 'High fragility', 'ပျက်စီးလွယ်မှု မြင့်'],
  'opt.load.tarp': ['篷布车', 'Tarpaulin cover', 'တာပေါ်လင်းဖုံး'],
  'opt.load.container': ['集装箱', 'Container', 'ကွန်တိန်နာ'],
  'opt.load.flatbed': ['平板', 'Flatbed', 'ပလက်ဖောင်း'],
  'opt.carrier.top': ['优秀车队', 'Top fleet', 'အကောင်းဆုံး ဖလင်'],
  'opt.carrier.avg': ['一般', 'Average', 'ပုံမှန်'],
  'opt.carrier.indep': ['散户运力', 'Independent operators', 'လွတ်လပ်သော သယ်ယူသူ'],
  'opt.driver.lic5': ['A照5年老司机', 'Licensed 5+ years', 'လိုင်စင် ၅ နှစ်အထက်'],
  'opt.driver.std': ['常规', 'Standard', 'ပုံမှန်'],
  'opt.driver.new': ['新司机', 'New driver', 'မောင်းသူ အသစ်'],
  'opt.veh.good': ['良好', 'Good', 'ကောင်း'],
  'opt.veh.avg': ['一般', 'Average', 'ပုံမှန်'],
  'opt.veh.worn': ['悬挂老化', 'Worn suspension', 'ဆိုင်းယိုယွင်း'],
  'opt.escort.armed': ['武装押运', 'Armed escort', 'လက်နက်တပ် စောင့်ရှောက်မှု'],
  'opt.escort.civil': ['民用安保', 'Civil security', 'အရပ်သား လုံခြုံရေး'],
  'opt.escort.none': ['无', 'None', 'မရှိ'],
  'opt.claims.none': ['无出险', 'No claims', 'မှတ်တမ်းမရှိ'],
  'opt.claims.avg': ['一般', 'Average', 'ပုံမှန်'],
  'opt.claims.high': ['高频出险', 'Frequent claims', 'မှတ်တမ်းမြင့်'],
  'opt.value.u20': ['2万美元以下', 'Under $20k', 'ဒေါ်လာ ၂၀k အောက်'],
  'opt.value.2050': ['2-5万美元', '$20k–50k', 'ဒေါ်လာ ၂၀k-၅၀k'],
  'opt.value.o50': ['5万美元以上', 'Over $50k', 'ဒေါ်လာ ၅၀k အထက်'],
  'opt.time.day': ['白天', 'Daytime', 'နေ့ခင်း'],
  'opt.time.night': ['夜间', 'Night-time', 'ညနေ'],

  // ---------- 地图页 ----------
  'map.origin': ['起点', 'Origin', 'အစမှတ်'],
  'map.destination': ['终点', 'Destination', 'အဆုံးမှတ်'],
  'map.schemes': ['路径方案', 'Route options', 'လမ်းကြောင်း အစီအစဉ်'],
  'map.recalcing': ['重算中…', 'Recalculating…', 'ပြန်တွက်နေသည်…'],
  'map.plan': ['方案 {n}', 'Plan {n}', 'အစီအစဉ် {n}'],
  'map.rateLabel': ['综合费率', 'Composite rate', 'ပေါင်းစပ် စျေးနှုန်း'],
  'map.editInfo': ['← 修改报价信息', '← Edit quote details', '← စျေးနှုန်းအချက်အလက် ပြင်ရန်'],
  'map.infoLoading': ['信息因子：获取中…', 'Info factors: loading…', 'အချက်အလက်များ- ရယူနေသည်…'],
  'map.infoLive': ['信息因子：{date} 每日快照已生效', 'Info factors: daily snapshot {date} in effect', 'အချက်အလက်များ- {date} နေ့စဉ် snapshot အသုံးချထားသည်'],
  'map.infoFallback': ['信息因子：基准档（快照未连接，已回退）', 'Info factors: baseline (snapshot unavailable, fell back)', 'အချက်အလက်များ- အခြေခံအဆင့် (snapshot မရ၊ ပြန်သည်)'],
  'map.detail': ['详细信息', 'Details', 'အသေးစိတ်'],
  'map.detailClose': ['收起详细信息', 'Hide details', 'ခေါက်ရန်'],
  'map.selected': ['已选方案 {n} · {km} km', 'Plan {n} selected · {km} km', 'အစီအစဉ် {n} ရွေးထား · {km} km'],
  'map.pickHint': ['选择起讫点后生成报价', 'Pick origin & destination to get a quote', 'အစ/အဆုံးမှတ် ရွေးပြီး စျေးနှုန်း ရယူပါ'],
  'map.via': ['途经城市', 'Route cities', 'ဖြတ်သန်းမြို့များ'],
  'map.pure': ['纯保费', 'Pure premium', 'သန့်ရှင်းပရီမီယံ'],
  'map.gross': ['毛保费', 'Gross premium', 'စုစုပေါင်းပရီမီယံ'],
  'map.trend.title': ['近30日综合费率走势', '30-day composite rate trend', '၃၀ ရက် စျေးနှုန်းလမ်းကြောင်း'],
  'map.trend.note': ['按当日信息快照 × 当前报价条件重算 · 单位 %/百公里', 'Recomputed per day with that day\'s info snapshot × current quote inputs · unit %/100km', 'နေ့စဉ် snapshot ဖြင့် ပြန်တွက်သည် · ၁၀၀ ကီလိုမီတာလျှင် %'],
  'map.trend.loading': ['历史快照加载中…', 'Loading historical snapshots…', 'မှတ်တမ်း snapshot များ ရယူနေသည်…'],
  'map.direct': ['直连', 'Direct', 'တိုက်ရိုက်'],
  'map.corr.A': ['东南线', 'Southeast line', 'အရှေ့တောင်လိုင်း'],
  'map.corr.B': ['中纵线', 'Central corridor', 'အလယ်ပိုင်းလိုင်း'],
  'map.corr.C': ['东北线', 'Northeast line', 'အရှေ့မြောက်လိုင်း'],
  'map.corr.D': ['西北线', 'Northwest line', 'အနောက်မြောက်လိုင်း'],
  'map.corr.E': ['仰光-勃生', 'Yangon–Pathein', 'ရန်ကုန်-ပုသိမ်'],
  'map.corr.F': ['土瓦-丹老', 'Dawei–Myeik', 'ထားဝယ်-မြိတ်'],
  'map.corr.G': ['皎漂-马圭', 'Kyaukpyu–Magway', 'ကျောက်ဖြူ-မကွေး'],
  'map.corr.H': ['雷基-八莫', 'Lweje–Bhamo', 'လေညှေ-ဗန်းမော်'],
  'map.paused': ['暂停禁售', 'Paused', 'ရပ်နား'],
  'map.capped': ['[封顶]', '[Capped]', '[ကန့်သတ်]'],
  'st.0': ['S0 平静', 'S0 calm', 'S0 ငြိမ်'],
  'st.1': ['S1 常规', 'S1 routine', 'S1 ပုံမှန်'],
  'st.2': ['S2 紧张', 'S2 tense', 'S2 တင်းတင်း'],
  'st.3': ['S3 冲突·暂停承保', 'S3 conflict · suspended', 'S3 ပဋိပက္ခ · ရပ်နား'],

  // ---------- 费率表 ----------
  'table.road': ['段 / 道路', 'Segment / Road', 'လမ်းကဏ္ဍ / လမ်း'],
  'table.status': ['状态', 'Status', 'အခြေအနေ'],
  'table.km': ['里程', 'Distance', 'အကွာအဝေး'],
  'table.rate': ['费率/百公里', 'Rate/100km', 'စျေးနှုန်း/၁၀၀km'],
  'table.pure': ['纯保费/票', 'Pure/trip', 'သန့်ရှင်း/ခေါက်'],
  'table.cat': ['巨灾项', 'Catastrophe', 'ဘေးအန္တရာယ်'],
  'table.freq': ['出险率', 'Loss freq.', 'ဆုံးရှုံးနိုင်မှု'],
  'table.gross': ['毛保费/票', 'Gross/trip', 'စုစုပေါင်း/ခေါက်'],
  'table.mark': ['标记', 'Flags', 'အမှတ်အသား'],
  'table.recalcing': ['引擎重算中…', 'Engine recalculating…', 'ပြန်တွက်နေသည်…'],
  'table.pickHint': ['请在左侧选择起讫点生成报价', 'Pick origin & destination on the left to get a quote', 'ဘယ်ဘက်တွင် အစ/အဆုံးမှတ် ရွေးပြီး စျေးနှုန်း ရယူပါ'],
  'table.clickRate': ['点击展开因子明细', 'Click to open factor trace', 'အချက်အလက်များ ဖွင့်ရန် နှိပ်ပါ'],
  'table.total': ['全程（{n} 段）', 'Full route ({n} segments)', 'တစ်ခုလုံး ({n} ကဏ္ဍ)'],
  'table.quick': ['快速估算口径', 'quick estimate', 'လျင်မြန် ခန့်မှန်း'],
  'table.note': ['纯保费=期望损失；毛保费=纯保费÷(1−35% loading)；费率/百公里=纯保费÷里程×100。点击费率数字可展开"档位→系数"追踪。', 'Pure premium = expected loss; gross premium = pure ÷ (1−35% loading); rate/100km = pure ÷ km × 100. Click a rate to open the "level → coef" trace.', 'သန့်ရှင်းပရီမီယံ = မျှော်မှန်းဆုံးရှုံးနိုင်မှု; စုစုပေါင်း = သန့်ရှင်း÷(၁−၃၅% loading); စျေးနှုန်း/၁၀၀km = သန့်ရှင်း÷km×၁၀၀။'],
  'table.noteQuick': ['当前为无MC快速估算兜底口径。', 'Currently the no-MC quick-estimate fallback.', 'လျင်မြန်သော ခန့်မှန်းစနစ် အသုံးပြုထားသည်။'],

  // ---------- 因子抽屉 ----------
  'drawer.title': ['因子明细 · 档位 → 系数', 'Factor trace · level → coef', 'အချက်အလက် · အဆင့် → ကိန်း'],
  'drawer.close': ['关闭', 'Close', 'ပိတ်ရန်'],
  'drawer.rate': ['费率/百公里', 'Rate/100km', 'စျေးနှုန်း/၁၀၀km'],
  'drawer.pure': ['纯保费/票', 'Pure premium/trip', 'သန့်ရှင်း/ခေါက်'],
  'drawer.regCat': ['常规项 / 巨灾项', 'Regular / catastrophe', 'ပုံမှန် / ဘေးအန္တရာယ်'],
  'drawer.freq': ['出险率', 'Loss frequency', 'ဆုံးရှုံးနိုင်မှု'],
  'drawer.speed': ['有效车速 / 暴露时长', 'Effective speed / exposure', 'အမြန်နှုန်း / ကြာမြင့်ချိန်'],
  'drawer.paused': ['⛔ 暂停承保：节点/口岸关闭（产品规则优先）', '⛔ Suspended: node/port closed (product rules take priority)', '⛔ ရပ်နား- ဂိတ်ပိတ် (စည်းမျဉ်း ဦးစားပေး)'],
  'drawer.capped': ['[封顶] 输出已触封顶线（单票12% 或 百公里3%），模型永不输出封顶之上数字', '[CAPPED] Output hit the cap (12% per trip or 3% per 100km); the model never outputs above it', '[ကန့်သတ်] ကန့်သတ်ချက် ထိနေပြီ (၁၂% သို့ ၃%)။ အထက် မထွက်နိုင်ပါ။'],
  'drawer.fh': ['因子档位', 'Factor level', 'အချက် အဆင့်'],
  'drawer.c': ['系数', 'Coef', 'ကိန်း'],
  'dl.FR-01': ['道路等级', 'Road class', 'လမ်းအဆင့်'],
  'dl.FR-01haz': ['道路等级·风险折算', 'Road class · risk adj.', 'လမ်းအဆင့် · အန္တရာယ်'],
  'dl.FR-03': ['治安热度（信息）', 'Security heat (info)', 'လုံခြုံရေး (အချက်အလက်)'],
  'dl.FR-04': ['查验滞留', 'Checkpoint delay', 'စစ်ဆေးရေး နှောင့်နှေး'],
  'dl.FR-04τ': ['节点滞留时长', 'Node dwell time', 'ဂိတ်နေချိန်'],
  'dl.FR-05': ['承运商等级', 'Carrier grade', 'သယ်ယူသူ အဆင့်'],
  'dl.FR-06(速)': ['地形·车速', 'Terrain · speed', 'မြေမျက်နှာ · အမြန်'],
  'dl.FR-06(险)': ['地形·事故', 'Terrain · accident', 'မြေမျက်နှာ · မတော်တဆ'],
  'dl.FR-07': ['路宽', 'Road width', 'လမ်းအကျယ်'],
  'dl.FR-08': ['夜禁管制', 'Night curfew', 'ညကျော့ကွပ်'],
  'dl.FR-09': ['司机资质', 'Driver credentials', 'မောင်းသူ အရည်အချင်း'],
  'dl.FR-10(事故)': ['车况·事故维', 'Vehicle · accident', 'ကား · မတော်တဆ'],
  'dl.FR-10(磨损)': ['车况·磨损维', 'Vehicle · wear', 'ကား · ပျက်စီး'],
  'dl.FR-11': ['押运配置', 'Escort', 'စောင့်ရှောက်မှု'],
  'dl.FR-12': ['出险记录', 'Claims history', 'မှတ်တမ်း'],
  'dl.FR-13': ['货值档', 'Cargo value tier', 'ကုန်တန်ဖိုး အဆင့်'],
  'dl.FR-14': ['发车时段', 'Departure time', 'ထွက်ခွာချိန်'],
  'dl.FR-15(速)': ['天气预报·车速（信息）', 'Weather · speed (info)', 'ရာသီဥတု · အမြန်'],
  'dl.FR-15(水)': ['天气预报·水损权重（信息）', 'Weather · water weight (info)', 'ရာသီဥတု · ရေဆိုင်ရာ'],
  'dl.RAIN-V': ['季节·减速', 'Season · slowdown', 'ရာသီ · ဖြည့်'],
  'dl.RAIN-WEAR': ['季节·磨损', 'Season · wear', 'ရာသီ · ပျက်စီး'],
  'dl.W-WATER': ['季节·水损权重', 'Season · water weight', 'ရာသီ · ရေဆိုင်ရာ'],
  'dl.D-WEAR': ['行程磨损均值', 'Trip wear mean', 'ခရီးပျက်စီး ပျမ်းမျှ'],
  'dl.ST-01(f_b)': ['态势·事故通道', 'Situation · accident', 'အခြေအနေ · မတော်တဆ'],
  'dl.ST-01(f_c)': ['态势·巨灾通道', 'Situation · catastrophe', 'အခြေအနေ · ဘေးအန္တရာယ်'],
  'dl.CT-01(λd)': ['冲突等级·巨灾率', 'Conflict tier · cat rate', 'ပဋိပက္ခ · ဘေးအနှုန်း'],
  'dl.CT-03': ['替代路线', 'Alternative route', 'အစားထိုးလမ်း'],
  'dl.CT-04': ['冲突波动（信息）', 'Conflict volatility (info)', 'ပဋိပက္ခ ပြောင်းလဲမှု'],
  'dl.CT-05': ['节点安全（信息）', 'Node safety (info)', 'ဂိတ်လုံခြုံရေး'],
  'dl.CT-06': ['口岸运行（信息）', 'Port operation (info)', 'ဂိတ်လုပ်ငန်း'],
  'dl.SV-01(水维)': ['包装·水损维', 'Packing · water', 'ထုပ်ပိုး · ရေ'],
  'dl.SV-01(机械维)': ['包装·机械维', 'Packing · mechanical', 'ထုပ်ပိုး · စက်'],
  'dl.SV-02(水维)': ['货物·水损维', 'Cargo · water', 'ကုန် · ရေ'],
  'dl.SV-02(机械维)': ['货物·机械维', 'Cargo · mechanical', 'ကုန် · စက်'],
  'dl.SV-03': ['易损度', 'Fragility', 'ပျက်စီးလွယ်မှု'],
  'dl.SV-04(水维)': ['装载·水损维', 'Loading · water', 'တင်ဆောင် · ရေ'],
  'dl.SV-04(机械维)': ['装载·机械维', 'Loading · mechanical', 'တင်ဆောင် · စက်'],
  'dl.Hawkes': ['证实遇袭走廊', 'Confirmed attack corridor', 'တိုက်ခိုက်ခံရမှု အတည်ပြု'],
  'dl.CAP-展示': ['展示乘积×2.0封顶回拉', 'Display product ×2.0 cap', 'ပြသမှု ×၂.၀ ကန့်သတ်'],
  'dl.CT-05/06': ['节点/口岸关闭→暂停承保', 'Node/port closed → suspended', 'ဂိတ်ပိတ် → ရပ်နား'],

  // ---------- 页脚 ----------
  'footer.h2': ['报价规则与模型说明', 'Quote rules & model notes', 'စျေးနှုန်းစည်းမျဉ်း ရှင်းလင်းချက်'],
  'footer.c1t': ['快照条件费率', 'Snapshot conditional rates', 'အချိန်အပိုင်း စျေးနှုန်း'],
  'footer.c1b': ['本站全部费率为 2026-10-02 状态快照条件费率（ST-01 态势、季节、信息因子均按该快照），市场与安全环境变化后费率随之失效重估。', 'All rates are snapshot conditional rates as of 2026-10-02 (ST-01 situation, season and info factors per that snapshot); rates lapse and re-price when market and security conditions change.', 'စျေးနှုန်းအားလုံးသည် ၂၀၂၆-၁၀-၀၂ အခြေအနေအရ ဖြစ်သည်။ အခြေအနေပြောင်းပါက ပြန်တွက်သည်။'],
  'footer.c2t': ['7天有效期', '7-day validity', '၇ ရက် သက်တမ်း'],
  'footer.c2b': ['每份报价自生成时点起 7 天内有效；逾期需以最新信息因子快照重新报价。', 'Each quote is valid for 7 days from generation; afterwards re-quote with the latest info-factor snapshot.', 'စျေးနှုန်းတစ်ခုစီသည် ဖန်တီးသည့်နေ့မှ ၇ ရက် သက်တမ်းရှိသည်။ ကုန်ပါက ပြန်တောင်းပါ။'],
  'footer.c3t': ['D级系数声明', 'D-grade coefficient disclosure', 'D အဆင့် ကြေညာချက်'],
  'footer.c3b': ['15/26 因子系数依据等级为 D（判据多有 B/C 级背书），待索赔经验数据回流后回调；信息因子评分存在媒体滞后性，每日快照未连接时自动回退基准档，媒体沉默不视为安全。', '15/26 factor coefficients are graded D (many backed by B/C evidence) pending claims data; info-factor scoring lags media coverage, falls back to baseline when the daily snapshot is unavailable, and media silence is not treated as safety.', 'အချက် ၂၆ ခုအနက် ၁၅ ခုသည် D အဆင့်ဖြစ်သည်။ နေ့စဉ် snapshot မရပါက အခြေခံအဆင့်သို့ ပြန်သည်။ မီဒီယာ တိတ်ဆိတ်ခြင်းကို လုံခြုံမှုမဟုတ်ဟု သတ်မှတ်သည်။'],
  'footer.rules': ['产品规则：单票纯保费触 12% 或费率/百公里触 3% 即截断并显示 [封顶]；节点/口岸关闭或 S3 状态走廊暂停新报价（产品规则优先于任何展示）。封顶是输出层防线，模型永不输出封顶之上数字。', 'Product rules: output is truncated and marked [CAPPED] at 12% single-trip pure premium or 3% per-100km rate; corridors with closed nodes/ports or S3 status suspend new quotes (product rules outrank any display). The cap is an output-layer safeguard — the model never outputs above it.', 'ထုတ်ကုန်စည်းမျဉ်း- ၁၂% သို့မဟုတ် ၃% ရောက်ပါက [ကန့်သတ်] ပြသည်။ ဂိတ်ပိတ် / S3 လမ်းကြောင်းတွင် ရပ်နားသည်။ ကန့်သတ်ချက်အထက် မထွက်နိုင်ပါ။'],
  'footer.network': ['路网说明：RT-16~19（卑谬线 / 敏建线 / 伊洛瓦底东岸公路 / 东枝线）为演示用假设联络段——真实存在的替代通道，内置因子按同类权威段类比推档（[E]推定 · [L]待确认），用于构成多方案对比；RT-01~15 权威段及其费率口径不受影响。', 'Network note: RT-16~19 (Pyay / Meiktila / east-bank Ayeyarwady / Taunggyi connectors) are demo-only hypothetical connectors — real alternative routes whose factors are estimated by analogy with authoritative segments ([E] presumed · [L] to be confirmed), included for multi-route comparison; RT-01~15 and their pricing are unaffected.', 'လမ်းကွန်ရက် မှတ်ချက်- RT-16~19 သည် ပြသာပြု ခန့်မှန်းလမ်းများဖြစ်ပြီး လမ်းကြောင်းနှိုင်းယှဉ်ရန်သာ အသုံးပြုသည်။ RT-01~15 ၏ စျေးနှုန်း မပြောင်းလဲပါ။'],
  'footer.team': ['SEIKCHA!! 团队 · 中央财经大学 · 保险学院', 'SEIKCHA!! Team · Central University of Finance and Economics · School of Insurance', 'SEIKCHA!! အဖွဲ့ · Central University of Finance and Economics · School of Insurance'],
  'footer.attrib': ['演示用静态站点 · 信息因子来自每日公开数据快照（Open-Meteo · ACLED/HDX · GDELT）· 地图底图 © OpenStreetMap 贡献者 · © CARTO', 'Demo static site · info factors from daily public-data snapshots (Open-Meteo · ACLED/HDX · GDELT) · map tiles © OpenStreetMap contributors · © CARTO', 'ပြသာပြု static site · အချက်အလက်များသည် နေ့စဉ် snapshot မှ · မြေပုံ © OpenStreetMap · © CARTO'],

  // ---------- 走势图 ----------
  'trend.empty': ['暂无历史快照——走势图随每日快照存档自动生长', 'No historical snapshots yet — the trend grows daily with each snapshot archive', 'မှတ်တမ်း snapshot မရှိသေးပါ- နေ့စဉ် အလိုအလျောက် တိုးပေါ်လာမည်'],

  // ---------- 客服 ----------
  'contact.us': ['联系我们', 'Contact us', 'ကျွန်ုပ်တို့ကို ဆက်သွယ်ပါ'],
};

const LangCtx = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: 'zh',
  setLang: () => {},
});

const STORE_KEY = 'seikcha-lang';

export function LangProvider(props: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    const saved = localStorage.getItem(STORE_KEY);
    return saved === 'en' || saved === 'my' || saved === 'zh' ? saved : 'zh';
  });
  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, lang);
    } catch {
      /* 隐私模式忽略 */
    }
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : lang === 'my' ? 'my' : 'en';
    // 缅文字形偏大偏长：根字号降到 15px（Tailwind 的 rem 尺寸整体收缩约 6%）
    document.documentElement.style.fontSize = lang === 'my' ? '15px' : '';
    const title = STRINGS['meta.title'];
    if (title) document.title = title[IDX[lang]] || title[0];
  }, [lang]);
  const value = useMemo(() => ({ lang, setLang }), [lang]);
  return <LangCtx.Provider value={value}>{props.children}</LangCtx.Provider>;
}

export function useLang() {
  return useContext(LangCtx);
}

/** 翻译函数：t('key') / t('key', { n: 3, date: '2026-10-05' })；{x} 占位符替换。
 *  注意：空字符串是合法译文（如缅文语序不需要该词），只有 nullish 才回退中文 */
export function useT() {
  const { lang } = useContext(LangCtx);
  return useMemo(() => {
    const t = (key: string, vars?: Record<string, string | number>): string => {
      const row = STRINGS[key];
      let s = row ? row[IDX[lang]] ?? row[0] : key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
      }
      return s;
    };
    return t;
  }, [lang]);
}
