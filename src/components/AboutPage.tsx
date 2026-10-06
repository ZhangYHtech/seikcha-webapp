// ============================================================
// 了解 SEIKCHA 合并长页（2026-10-04 第三轮改版）：
//   ① 色块矩阵（文案按用户提供的表格，含新标题"为什么是现在/跟上"）
//   ② 宣传片块（poster 当背景，点击弹窗播放）
//   ③ 投保流程四步（模仿参考站 We make the process easy）
//   ④ 常见问题（id=faq，导航"常见问题"经 #/faq 直达本节）
//   ⑤ 准备好报价 CTA 区（新文案 + 橙底黑字按钮，跳 #/map）
// ============================================================
import { useEffect, useState } from 'react';
import { FaqSection } from './FaqSection';
import { QuoteCtaSection } from './QuoteCtaSection';
import { useLang, useT } from '../i18n';

/* ---------- 色块文案（多语言键见 i18n/index.tsx） ---------- */
type BlockCopy = { title: string; lead: string; body: string };
type BlockKeys = { title: string; lead: string; body: string };
const BLOCKS: Record<'clear' | 'safe' | 'whynow' | 'visible' | 'tracked', BlockKeys> = {
  clear: { title: 'about.clear.title', lead: 'about.clear.lead', body: 'about.clear.body' },
  safe: { title: 'about.safe.title', lead: 'about.safe.lead', body: 'about.safe.body' },
  whynow: { title: 'about.whynow.title', lead: 'about.whynow.lead', body: 'about.whynow.body' },
  visible: { title: 'about.visible.title', lead: 'about.visible.lead', body: 'about.visible.body' },
  tracked: { title: 'about.tracked.title', lead: 'about.tracked.lead', body: 'about.tracked.body' },
};

/* ---------- 投保四步（模仿参考站，英文原文中译） ---------- */
function IconChoice() {
  return (
    <svg viewBox="0 0 64 64" className="h-24 w-24 text-seik-500" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M26 30 L44 48" />
      <path d="M26 30 L23 14 L31 20 L34 10 L40 24 Z" />
      <path d="M50 18 l6 -6 M52 30 h8 M40 10 l3 -7" />
    </svg>
  );
}
function IconPerson() {
  return (
    <svg viewBox="0 0 64 64" className="h-24 w-24 text-seik-500" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="30" cy="20" r="9" />
      <path d="M12 54 c2 -13 9 -19 18 -19 c6 0 11 2 14 7" />
      <path d="M36 48 c0 -4 4 -7 8 -6 c4 1 6 5 4 9" />
    </svg>
  );
}
function IconChat() {
  return (
    <svg viewBox="0 0 64 64" className="h-24 w-24 text-seik-500" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 14 h26 v18 h-14 l-7 7 v-7 h-5 Z" />
      <path d="M42 26 h12 v14 h-4 v6 l-6 -6 h-10 v-6" />
    </svg>
  );
}
function IconPlan() {
  return (
    <svg viewBox="0 0 64 64" className="h-24 w-24 text-seik-500" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8 h22 l10 10 v38 h-32 Z" />
      <path d="M40 8 v10 h10" />
      <path d="M24 30 h20 M24 38 h20 M24 46 h12" />
    </svg>
  );
}
const STEPS: { Icon: () => JSX.Element; key: string }[] = [
  { Icon: IconChoice, key: 'about.step1' },
  { Icon: IconPerson, key: 'about.step2' },
  { Icon: IconChat, key: 'about.step3' },
  { Icon: IconPlan, key: 'about.step4' },
];

/* ---------- 色块通用容器 ---------- */
type Tone = 'orange' | 'teal' | 'white';
const TONE_CLS: Record<Tone, string> = {
  orange: 'bg-seik-500 text-white',
  teal: 'bg-pg-lightBlue text-pg-navy',
  white: 'bg-white text-slate-700',
};

function Block(props: { tone: Tone; className?: string; copy: BlockCopy }) {
  const { tone, className, copy } = props;
  const leadCls = tone === 'orange' ? 'text-white' : 'text-pg-navy';
  const bodyCls = tone === 'orange' ? 'text-white/90' : tone === 'teal' ? 'text-pg-navy/75' : 'text-slate-600';
  return (
    <div className={`rounded-2xl p-5 sm:p-6 ${TONE_CLS[tone]} ${className ?? ''}`}>
      <h2 className="font-serif text-2xl font-bold">{copy.title}</h2>
      <p className={`mt-3 text-sm font-bold leading-relaxed ${leadCls}`}>{copy.lead}</p>
      <p className={`mt-2 text-sm leading-relaxed ${bodyCls}`}>{copy.body}</p>
    </div>
  );
}

export function AboutPage() {
  const t = useT();
  const { lang } = useLang();
  const [videoOpen, setVideoOpen] = useState(false);
  const blockCopy = (k: BlockKeys): BlockCopy => ({ title: t(k.title), lead: t(k.lead), body: t(k.body) });

  // 弹窗打开时支持 Esc 关闭
  useEffect(() => {
    if (!videoOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setVideoOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [videoOpen]);

  return (
    <div className="bg-pg-cream">
      {/* ①②③ 色块 + 宣传片 + 投保四步（#/about 滚动直达此节） */}
      <section id="about" className="mx-auto max-w-[1400px] scroll-mt-28 px-4 pb-14 pt-10 sm:px-6 sm:pt-14">
        <h1 className="text-center font-serif text-4xl font-bold tracking-tight text-pg-navy sm:text-5xl">
          {t('about.h1pre')}
          <span className="text-seik-500">SEIKCHA</span>
          {t('about.h1post')}
        </h1>

        <div className="mt-10 grid gap-4 md:grid-cols-4">
          {/* 第一行：橙（算得清）· 青（保得住）· 橙宽（为什么是现在） */}
          <Block tone="orange" className="min-h-[220px]" copy={blockCopy(BLOCKS.clear)} />
          <Block tone="teal" className="min-h-[220px]" copy={blockCopy(BLOCKS.safe)} />
          <Block tone="orange" className="min-h-[220px] md:col-span-2" copy={blockCopy(BLOCKS.whynow)} />

          {/* 第二行：青（看得见）· 白宽（跟上）· 宣传片 */}
          <Block tone="teal" className="min-h-[220px]" copy={blockCopy(BLOCKS.visible)} />
          <Block tone="white" className="min-h-[220px] md:col-span-2" copy={blockCopy(BLOCKS.tracked)} />
          <button
            onClick={() => setVideoOpen(true)}
            className="group relative flex min-h-[220px] items-end overflow-hidden rounded-2xl p-5 text-left shadow-sm transition hover:shadow-md"
            aria-label={t('about.video.watch')}
          >
            {/* 视频开头帧作为色块背景 */}
            <img
              src="media/poster.jpg"
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover transition group-hover:scale-[1.03]"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" aria-hidden />
            <span className="relative flex items-center gap-3 text-white">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-seik-500 transition group-hover:bg-seik-700">
                <svg viewBox="0 0 24 24" className="ml-0.5 h-5 w-5" fill="currentColor" aria-hidden>
                  <path d="M8 5.5v13l11-6.5-11-6.5Z" />
                </svg>
              </span>
              <span>
                <span className="block text-sm font-bold">{t('about.video.watch')}</span>
                <span className="block text-xs text-white/80">{t('about.video.note')}</span>
              </span>
            </span>
          </button>
        </div>
      </section>

      {/* 投保流程四步 */}
      <section aria-label={t('about.process.aria')} className="mx-auto max-w-[1400px] px-4 pb-20 sm:px-6">
        <h2 className="text-center font-serif text-4xl font-bold tracking-tight text-pg-navy sm:text-5xl">
          {t('about.process.h2a')}
          <span className={`relative inline-block ${lang === 'my' ? '' : 'italic'}`}>
            {t('about.process.h2b')}
            <svg viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden className="absolute -bottom-1.5 left-0 h-2 w-full text-seik-500">
              <path d="M2 6 Q 50 0 98 4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </span>
          {t('about.process.h2c')}
        </h2>
        <p className="mx-auto mt-5 max-w-3xl text-center text-sm leading-relaxed text-slate-600">
          {t('about.process.sub')}
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ Icon, key }, i) => (
            <div key={key} className="flex min-h-[340px] flex-col rounded-2xl bg-white p-6 shadow-sm">
              <div className="grid h-28 place-items-center">
                <Icon />
              </div>
              <div className="mt-6 grid h-8 w-8 place-items-center rounded-full bg-pg-black text-sm font-bold text-white">
                {i + 1}
              </div>
              <h3 className="mt-3 font-serif text-2xl font-bold leading-snug text-pg-navy">{t(`${key}.title`)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{t(`${key}.body`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ④ 常见问题（#/faq 直达此节） */}
      <FaqSection />

      {/* ⑤ 准备好报价 CTA 区 */}
      <QuoteCtaSection />

      {/* 宣传片放大弹窗 */}
      {videoOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setVideoOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={t('about.video.modal')}
        >
          <div className="relative w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setVideoOpen(false)}
              className="absolute -top-10 right-0 rounded px-2 py-1 text-2xl leading-none text-white/80 hover:text-white"
              aria-label={t('about.video.close')}
            >
              ✕
            </button>
            <video controls poster="media/poster.jpg" className="aspect-video w-full rounded-xl bg-black shadow-2xl">
              <source src="media/seikcha.mp4" type="video/mp4" />
              {t('about.video.fallback')}
            </video>
          </div>
        </div>
      )}
    </div>
  );
}
