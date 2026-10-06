// ============================================================
// 假设披露 / 页脚（T101 · W1）——红线4：固定披露三项缺一不可（多语言）
// ============================================================
import { useT } from '../i18n';

export function FooterDisclosure() {
  const t = useT();
  return (
    <footer id="disclosure" className="scroll-mt-16 bg-pg-navy text-pg-cream/80">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <h2 className="font-serif text-lg font-bold text-white">{t('footer.h2')}</h2>
        <ol className="mt-4 grid gap-3 text-sm leading-relaxed md:grid-cols-3">
          <li className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
            <span className="font-semibold text-seik-300">{t('footer.c1t')}：</span>
            {t('footer.c1b')}
          </li>
          <li className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
            <span className="font-semibold text-seik-300">{t('footer.c2t')}：</span>
            {t('footer.c2b')}
          </li>
          <li className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
            <span className="font-semibold text-seik-300">{t('footer.c3t')}：</span>
            {t('footer.c3b')}
          </li>
        </ol>
        <div className="mt-6 rounded-xl bg-white/5 p-4 text-xs leading-relaxed ring-1 ring-white/10">
          {t('footer.rules')}
        </div>
        <div className="mt-3 rounded-xl bg-white/5 p-4 text-xs leading-relaxed ring-1 ring-white/10">
          {t('footer.network')}
        </div>
        <div className="mt-8 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-pg-cream/50 sm:flex-row sm:items-center sm:justify-between">
          <span>{t('footer.team')}</span>
          <span>{t('footer.attrib')}</span>
        </div>
      </div>
    </footer>
  );
}
