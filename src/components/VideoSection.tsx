// ============================================================
// 视频区块（T102 · W1 · 需求1）
// 红线：不自动播放、不自动出声、preload="metadata"（弱网首屏不加载视频体）、
// poster 海报帧；转码产物 public/media/seikcha.mp4（H.264 1080p ≤40MB）。
// ============================================================
export function VideoSection() {
  return (
    <section id="video" className="mx-auto max-w-7xl scroll-mt-16 px-4 py-14 sm:px-6">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold tracking-tight text-pg-navy sm:text-3xl">了解 SEIKCHA</h2>
          <p className="mt-1 text-sm text-slate-500">两分钟看懂"保费导航"：起讫点 → 多路径报价 → 逐段透视。</p>
        </div>
        <span className="hidden rounded-full bg-pg-greenLightest px-3 py-1 text-xs font-medium text-pg-green ring-1 ring-pg-greenLight sm:inline">
          点播播放 · 不自动加载
        </span>
      </div>
      <figure className="overflow-hidden rounded-2xl shadow-lg ring-1 ring-slate-200">
        <video
          controls
          preload="metadata"
          poster="media/poster.jpg"
          className="aspect-video w-full bg-pg-navy object-contain"
        >
          <source src="media/seikcha.mp4" type="video/mp4" />
          您的浏览器不支持视频播放，请升级后重试。
        </video>
        <figcaption className="bg-white px-4 py-3 text-xs text-slate-500">
          SEIKCHA 宣传片 · 1080p · 约36MB · 点击播放后才会加载与发声
        </figcaption>
      </figure>
    </section>
  );
}
