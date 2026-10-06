// ============================================================
// 顶部导航（2026-10-05 多页版式改版）：白底、加高加大，LOGO 与
// 链接同组居左；右侧=地球仪语言切换 + CTA"准备好报价 ›" → #/map。
// 地图页（问卷/方案两步）由 App 传入 showCta=false 隐藏 CTA——
// 进入报价流程后不再循环引流。
// ============================================================
import { useState, type MouseEvent } from 'react';
import { LANGS, useLang, useT } from '../i18n';

/** 地球仪 + 语言下拉（右上角，参照 SAP 风格） */
function LangGlobe() {
  const { lang, setLang } = useLang();
  const t = useT();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label={t('lang.label')}
        aria-expanded={open}
        className="grid h-10 w-10 place-items-center rounded-full text-slate-700 transition hover:bg-slate-100"
      >
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.7 2.6 4 5.6 4 9s-1.3 6.4-4 9c-2.7-2.6-4-5.6-4-9s1.3-6.4 4-9Z" />
        </svg>
      </button>
      {open && (
        <>
          {/* 点击外部收起 */}
          <div aria-hidden className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-40 overflow-hidden rounded-xl bg-white py-1 shadow-lg ring-1 ring-slate-200">
            {LANGS.map((l) => (
              <button
                key={l.id}
                onClick={() => {
                  setLang(l.id);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between px-4 py-2.5 text-sm transition hover:bg-slate-50 ${
                  lang === l.id ? 'font-bold text-seik-700' : 'text-slate-700'
                }`}
              >
                {l.label}
                {lang === l.id && (
                  <span aria-hidden className="text-seik-500">
                    ✓
                  </span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function Nav(props: { showCta?: boolean }) {
  const t = useT();
  const links = [
    ['#/about', t('nav.about')],
    ['#/faq', t('nav.faq')],
  ];

  // 目标与当前 hash 相同时，浏览器不会触发导航——这里手动平滑滚动
  const sameHashGo = (href: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    const cur = window.location.hash.replace(/^#/, '');
    const dst = href.replace(/^#/, '');
    if (cur !== dst) return; // 不同地址：走默认导航，App 的路由效果会处理滚动
    e.preventDefault();
    if (dst === '' || dst === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    document.getElementById(dst)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <header className="sticky top-0 z-40 bg-white">
      {/* 上下内边距缩小以容纳更大的 LOGO，导航栏总高度不变（80/96/112px） */}
      <div className="flex w-full items-center justify-between px-4 py-2 sm:px-8 lg:px-10">
        {/* LOGO + 链接：同组居左 */}
        <div className="flex items-center gap-6 sm:gap-8 lg:gap-12">
          <a href="#/" onClick={sameHashGo('#/')} className="flex items-center">
            <img src="media/logo.gif" alt="SEIKCHA INSURTECH" className="h-16 w-auto sm:h-20 lg:h-24" />
          </a>
          <nav className="hidden items-center gap-6 md:flex lg:gap-10">
            {links.map(([href, label]) => (
              <a
                key={href}
                href={href}
                onClick={sameHashGo(href)}
                className="text-lg font-medium text-slate-800 transition hover:text-seik-700"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <LangGlobe />
          {props.showCta !== false && (
            <a
              href="#/map"
              onClick={sameHashGo('#/map')}
              className="inline-flex items-center gap-2 rounded-full bg-seik-500 px-5 py-2.5 text-base font-bold text-pg-black shadow-sm transition hover:bg-seik-700 sm:px-6 sm:py-3"
            >
              {t('nav.cta')} <span aria-hidden className="text-lg leading-none">›</span>
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
