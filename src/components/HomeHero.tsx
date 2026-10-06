// ============================================================
// 首页 Hero（2026-10-04 第二轮）：背景图不满屏——左右与下方留白边、
// 圆角；左上角宣传语为白色圆角色块（黑字极粗宋体 font-title，
// "算得清、保得住"橙色），色块压在图片左上角上（参照用户参考图，
// 两行文字不折行）。
// 首页仅此一块内容（导航之外），无页脚。
// ============================================================
import { useT } from '../i18n';

export function HomeHero() {
  const t = useT();
  return (
    <section aria-label={t('hero.aria')} className="bg-white px-4 pb-8 pt-6 sm:px-8 sm:pb-10 lg:px-10 lg:pb-12">
      <div className="relative">
        <img
          src="media/hero-home.jpg"
          alt={t('img.hero.alt')}
          className="h-[calc(100vh-13rem)] min-h-[500px] w-full rounded-3xl object-cover"
        />
        {/* 色块：右上、左下直角与页面白底衔接，左上、右下圆角压图；内边距收紧贴住文字 */}
        <div className="absolute -top-4 left-0 inline-block rounded-3xl rounded-tr-none rounded-bl-none bg-white p-4 pr-8 sm:p-5 sm:pr-10 lg:p-6 lg:pr-12">
          {/* 注意：leading 必须与字号同步带响应式前缀（sm:text-5xl 自带 1 倍行距，
              且响应式变体在 CSS 中排在无前缀工具之后，会把无前缀 leading 覆盖掉） */}
          <h1 className="font-title text-4xl font-black leading-[1.5] sm:leading-[1.5] text-pg-black sm:text-5xl">
            <span className="block whitespace-nowrap">{t('hero.l1')}</span>
            <span className="block whitespace-nowrap">
              {t('hero.l2a')}
              <span className="text-seik-500">{t('hero.l2b')}</span>
              {t('hero.l2c')}
            </span>
          </h1>
        </div>
      </div>
    </section>
  );
}
