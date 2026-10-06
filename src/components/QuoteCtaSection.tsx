// ============================================================
// 准备好报价 CTA 区（2026-10-04 合并进"了解 SEIKCHA"长页底部）
// 文案（用户提供）：主标题"不只找一条路，更要找到值得走的路。"
// （"值得走的路"带橙色手绘下划线）+ 副标题 + "准备好报价 ›"按钮
// （橙底黑字，与导航 CTA 文案统一，跳转 #/map 保费地图页）+ 右侧配图。
// ============================================================
import { useT } from '../i18n';

export function QuoteCtaSection() {
  const t = useT();
  return (
    <section aria-label={t('nav.cta')} className="bg-pg-cream">
      <div className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-[1600px] items-center px-4 py-16 sm:px-6 lg:px-10">
        <div className="grid w-full items-center gap-10 lg:grid-cols-2 lg:gap-28">
          <div className="max-w-2xl">
            <h2 className="font-serif text-4xl font-bold leading-[1.25] sm:leading-[1.25] lg:leading-[1.25] tracking-tight text-pg-navy sm:text-5xl lg:text-[3.5rem]">
              <span className="block whitespace-nowrap">{t('cta.h2a')}</span>
              <span className="block whitespace-nowrap">
                {t('cta.h2pre')}
                <span className="relative inline-block">
                  {t('cta.h2b')}
                  <svg viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden className="absolute -bottom-2 left-0 h-2.5 w-full text-seik-500">
                    <path d="M2 6 Q 50 0 98 4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                </span>
                {t('cta.h2post')}
              </span>
            </h2>
            <p className="mt-7 text-base leading-relaxed text-slate-600 sm:text-lg">{t('cta.sub')}</p>
            <a
              href="#/map"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-seik-500 px-7 py-3.5 text-base font-bold text-pg-black shadow-sm transition hover:bg-seik-700"
            >
              {t('nav.cta')} <span aria-hidden className="text-lg leading-none">›</span>
            </a>
          </div>
          <img
            src="media/quote-cta.jpg"
            alt={t('img.cta.alt')}
            className="w-full rounded-2xl object-cover shadow-sm"
          />
        </div>
      </div>
    </section>
  );
}
