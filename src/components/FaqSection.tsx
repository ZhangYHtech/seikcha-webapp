// ============================================================
// 常见问题小节（2026-10-04 合并进"了解 SEIKCHA"长页，id=faq，
// 导航"常见问题"经 #/faq 滚动直达；白底 + 米白问题块手风琴）。
// 内容为既有 8 问（复述站内事实，零新增）。
// ============================================================
import { useState } from 'react';
import { useT } from '../i18n';

// 8 问，文案键见 i18n/index.tsx（faq.q1..q8 / faq.a1..a8）
const FAQ_KEYS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

export function FaqSection() {
  const t = useT();
  // 默认展开第一项；允许多项同时展开
  const [open, setOpen] = useState<Set<number>>(() => new Set([0]));
  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <section id="faq" aria-label={t('faq.h2')} className="scroll-mt-32 bg-white py-16">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
        <h2 className="text-center font-serif text-4xl font-bold tracking-tight text-pg-navy sm:text-5xl">
          {t('faq.h2')}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-slate-500">{t('faq.sub')}</p>

        <div className="mx-auto mt-10 max-w-4xl space-y-3.5">
          {FAQ_KEYS.map((n, i) => {
            const isOpen = open.has(i);
            return (
              <div key={n} className="rounded-2xl bg-pg-cream">
                <button
                  onClick={() => toggle(i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left sm:px-8"
                >
                  <span className="text-base font-semibold text-pg-navy sm:text-lg">{t(`faq.q${n}`)}</span>
                  <span
                    aria-hidden
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-pg-black text-lg leading-none text-white transition-colors hover:bg-seik-500 sm:h-10 sm:w-10"
                  >
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
                <div
                  className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                    isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-sm leading-relaxed text-slate-700 sm:px-8 sm:pb-6 sm:text-[15px]">
                      {t(`faq.a${n}`)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
