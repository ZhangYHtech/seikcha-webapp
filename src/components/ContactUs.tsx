// ============================================================
// "联系我们"客服按钮（2026-10-05：tawk.to）：各页面右下角，
// 绿底（pg.green #226F54）+ 白 icon 白字白边框，样式参照 SAP Contact us。
// tawk.to：人工客服=免费不限坐席；AI 问答=AI Assist 插件（免费档含约
// 100 条 AI 回复，知识库驱动）；后端配置均在 tawk.to 仪表盘完成。
// 配置（二选一，只差一个嵌入地址）：
//   ① webapp/.env.local 写 VITE_TAWK_SRC=<嵌入URL>
//   ② 直接把 URL 填到下面的 TAWK_SRC 常量
// URL 从 tawk.to 后台 Admin → Chat Widget 的嵌入代码里复制 s1.src
// （形如 https://embed.tawk.to/PROPERTY_ID/WIDGET_ID）。
// 未配置时按钮照常显示，点击无动作（title 有提示）。
// ============================================================
import { useT } from '../i18n';

const TAWK_SRC: string =
  (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_TAWK_SRC || '';

interface TawkApi {
  hideWidget?: () => void;
  showWidget?: () => void;
  maximize?: () => void;
  minimize?: () => void;
}

declare global {
  interface Window {
    Tawk_API?: TawkApi & Record<string, unknown>;
    Tawk_LoadStart?: Date;
    __seikchaChatPending?: boolean;
    __seikchaTawkReady?: boolean;
    __seikchaTawkWatch?: number;
    __seikchaTawkLastOpen?: number;
    __seikchaTawkMaxTimers?: number[];
    __seikchaTawkPrevOpen?: boolean;
  }
}

/** 清空排队中的 maximize（用户收起聊天窗后，残留的补发会把窗口顶回来） */
function clearMaxTimers() {
  const w = window as Window;
  (w.__seikchaTawkMaxTimers ?? []).forEach((t) => clearTimeout(t));
  w.__seikchaTawkMaxTimers = [];
}

/** 展开聊天窗（悬浮球保持隐藏）。切勿调 showWidget()——会把官方悬浮球放回来。
 *  maximize 对刚就绪的窗口可能被忽略，按 0/400/1200/2500ms 补发四次；
 *  用户随后收起时由看门狗清空本队列（否则窗口会在约 1 秒后被顶回来）。 */
function openChat() {
  const w = window as Window;
  w.__seikchaTawkLastOpen = Date.now();
  clearMaxTimers();
  try {
    w.Tawk_API?.hideWidget?.();
  } catch {
    /* ignore */
  }
  w.__seikchaTawkMaxTimers = [0, 400, 1200, 2500].map((ms) =>
    window.setTimeout(() => {
      try {
        w.Tawk_API?.maximize?.();
      } catch {
        /* ignore */
      }
    }, ms),
  );
}

function ensureTawk(src: string) {
  const w = window as Window;
  if (w.__seikchaTawkReady) {
    openChat();
    return;
  }
  w.__seikchaChatPending = true; // 加载完成后由看门狗补开
  if (w.Tawk_API) return; // 正在加载：轮询会接管。注意：绝不重试注入，
  // tawk 脚本重复初始化会堆叠多个 widget iframe 并反复重置 Tawk_API
  w.Tawk_API = {};
  w.Tawk_LoadStart = new Date();
  startTawkPoll();
  const s = document.createElement('script');
  s.async = true;
  s.src = src;
  s.charset = 'UTF-8';
  s.setAttribute('crossorigin', '*');
  document.head.appendChild(s);
}

/** 轮询看门狗（0.8s），职责按就绪状态切换：
 *  未就绪 → 探测 Tawk_API.maximize 变为函数（脚本已挂载 API）后视为就绪，
 *           执行"隐藏悬浮球 + 按需补开聊天窗"（不依赖 onLoaded 回调名）；
 *  已就绪 → 盯 iframe 尺寸判断聊天窗开合：
 *           · 由开转收（用户点了收起）→ 清空 maximize 队列 + hideWidget，
 *             保证一次点击就永久收起；
 *           · 持续收起态 → 持续 hideWidget，压住官方悬浮球的定时回弹；
 *           · 展开态（宽高>200px）→ 绝不调用 hideWidget（会连聊天窗一起藏），
 *             且 openChat 后 4s 冷却期内不动手（展开动画期间 iframe 还很小）。 */
function startTawkPoll() {
  const w = window as Window;
  if (w.__seikchaTawkWatch) return;
  w.__seikchaTawkWatch = window.setInterval(() => {
    try {
      const api = w.Tawk_API;
      if (!api || typeof api.maximize !== 'function') return; // 脚本未挂载 API
      if (!w.__seikchaTawkReady) {
        // 首次就绪：隐藏悬浮球；有等待中的点击则补开
        w.__seikchaTawkReady = true;
        w.__seikchaTawkLastOpen = Date.now();
        try {
          api.hideWidget?.();
        } catch {
          /* ignore */
        }
        if (w.__seikchaChatPending) {
          w.__seikchaChatPending = false;
          openChat();
        }
        return;
      }
      const frame = document.querySelector('iframe[title="Chat widget"]');
      const rect = frame?.getBoundingClientRect();
      const big = !!rect && rect.width > 200 && rect.height > 200;
      const prevOpen = w.__seikchaTawkPrevOpen === true;
      if (prevOpen && !big) {
        // 由开转收：用户刚点了收起——取消排队 maximize，立即压住悬浮球
        clearMaxTimers();
        try {
          api.hideWidget?.();
        } catch {
          /* ignore */
        }
      } else if (!big && Date.now() - (w.__seikchaTawkLastOpen ?? 0) >= 4000) {
        // 持续收起态：压住悬浮球回弹（幂等）
        try {
          api.hideWidget?.();
        } catch {
          /* ignore */
        }
      }
      w.__seikchaTawkPrevOpen = big;
    } catch {
      /* ignore */
    }
  }, 800);
}

export function ContactUs() {
  const t = useT();
  const onClick = () => {
    if (!TAWK_SRC) return; // 未配置：静默（title 有提示）
    ensureTawk(TAWK_SRC);
  };

  return (
    <button
      onClick={onClick}
      title={TAWK_SRC ? t('contact.us') : t('contact.hint')}
      aria-label={t('contact.us')}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-3 rounded-lg border-2 border-white bg-pg-green px-5 py-3.5 text-white shadow-lg transition hover:brightness-110"
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden>
        <path d="M4 4h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H8.6L4.6 21A0.7 0.7 0 0 1 3.5 20.4V5a1 1 0 0 1 1-1Zm3 5.5a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4Zm5 0a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4Zm5 0a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4Z" />
      </svg>
      <span className="text-base font-bold">{t('contact.us')}</span>
    </button>
  );
}
