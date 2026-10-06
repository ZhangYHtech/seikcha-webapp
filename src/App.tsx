// ============================================================
// App（2026-10-05 第四轮改版）：hash 路由（离线 file:// 可用）
//   #/        主长页 = 首页 Hero + 了解 SEIKCHA（色块/宣传片/投保
//             四步）+ 常见问题 + 准备好报价 CTA + 页脚，整体连续滚动
//   #/about   同一长页，载入后滚动到"了解 SEIKCHA"小节
//   #/faq     同一长页，载入后滚动到"常见问题"小节
//   #/map     保费地图页（暂用原保费导航组件，后续改版）
//   #/quote   旧路由，重定向到 #/map
// 页脚"报价规则与模型说明"出现在两个页面底部（合规红线）。
// ============================================================
import { useEffect, useState } from 'react';
import { Nav } from './components/SiteChrome';
import { HomeHero } from './components/HomeHero';
import { AboutPage } from './components/AboutPage';
import { MapPage } from './components/MapPage';
import { FooterDisclosure } from './components/FooterDisclosure';
import { ContactUs } from './components/ContactUs';
import { LangProvider } from './i18n';

type Page = 'main' | 'map';
type ScrollTarget = 'top' | 'about' | 'faq';

function parseRoute(route: string): { page: Page; target: ScrollTarget } {
  if (route.startsWith('/map') || route.startsWith('/quote')) return { page: 'map', target: 'top' };
  if (route.startsWith('/about')) return { page: 'main', target: 'about' };
  if (route.startsWith('/faq')) return { page: 'main', target: 'faq' };
  return { page: 'main', target: 'top' };
}

export default function App() {
  const [route, setRoute] = useState(() => window.location.hash.replace(/^#/, '') || '/');
  useEffect(() => {
    const onHash = () => setRoute(window.location.hash.replace(/^#/, '') || '/');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const { page, target } = parseRoute(route);

  // 路由滚动：about/faq 直达对应小节，其余回顶
  useEffect(() => {
    if (target === 'top') {
      window.scrollTo(0, 0);
      return;
    }
    requestAnimationFrame(() => {
      document.getElementById(target)?.scrollIntoView({ block: 'start' });
    });
  }, [route, target]);

  return (
    <LangProvider>
      <div className="min-h-screen bg-white text-slate-800">
        {/* 地图页（问卷/方案两步）不显示导航 CTA：进入流程中不再循环引流 */}
        <Nav showCta={page !== 'map'} />
        {page === 'main' && (
          <>
            <HomeHero />
            <AboutPage />
            <ContactUs />
            <FooterDisclosure />
          </>
        )}
        {page === 'map' && (
          <>
            <MapPage step={route === '/map/plan' ? 'plan' : 'form'} />
            <FooterDisclosure />
          </>
        )}
      </div>
    </LangProvider>
  );
}
