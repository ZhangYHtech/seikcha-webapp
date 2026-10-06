// ============================================================
// MapLibre 地图（2026-10-05 接入真实在线底图）：OpenFreeMap 的
// positron 灰白风格瓦片（开源免费、无需 API key、无配额限制，观感与
// 旧 Dash 版 carto-positron 一致）。线路以 GeoJSON 折线画在瓦片上：
// 选中方案按费率着色、候选灰虚线、S3 暂停红显+常显标签；缅甸省界
// （mmr.json）细线叠加；悬停出摘要、点选联动、起终点强调。
// 上线注意：OpenFreeMap 可长期免费用；如需自有品牌样式可换
// MapTiler/Protomaps 自建（仅改 style URL）。
// ============================================================
import { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { FeatureCollection } from 'geojson';
import { ROUTE_POLYS, CITIES } from '../../data/cities';
import { SEGMENTS } from '../../engine';
import { roadName } from '../../lib/routePlanner';
import { tokens } from '../../styles/tokens';
import type { QuoteResult } from '../../engine/types';
import mmr from '../../data/geo/mmr_adm1_new.json';

const latlngOf = (cityId: string): [number, number] => {
  const c = CITIES.find((x) => x.id === cityId)!;
  return [c.lat, c.lon];
};

const polyLatLngs = (sid: string): [number, number][] => {
  const p = ROUTE_POLYS.find((x) => x.sid === sid);
  return p ? p.nodes.map(latlngOf) : [];
};

function rateColor(ramp: readonly string[], t: number): string {
  const clamped = Math.max(0, Math.min(1, t));
  const seg = clamped * (ramp.length - 1);
  const i = Math.min(ramp.length - 2, Math.floor(seg));
  return ramp[i] === ramp[Math.ceil(seg)] ? ramp[i] : ramp[Math.ceil(seg)];
}

type RouteFC = FeatureCollection;

export function MapLibreMap(props: {
  schemeSids: string[];
  candidateSids: string[][];
  quote: QuoteResult | null;
  selectedSid: string | null;
  origin: string;
  destination: string;
  lang?: 'zh' | 'en' | 'my';
  onSelectSid: (sid: string | null) => void;
  onHoverSid: (sid: string | null) => void;
}) {
  const { schemeSids, candidateSids, quote, selectedSid, origin, destination, lang = 'zh', onSelectSid, onHoverSid } = props;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const readyRef = useRef(false);
  const [ready, setReady] = useState(false);
  // 语言 ref：悬停弹窗的回调在地图初始化时挂载一次，读 ref 才能拿到最新语言
  const langRef = useRef(lang);
  useEffect(() => {
    langRef.current = lang;
  }, [lang]);

  // 回调走 ref，避免地图事件监听因 props 换新函数而失效
  const cbRef = useRef({ onSelectSid, onHoverSid });
  cbRef.current = { onSelectSid, onHoverSid };

  const popupRef = useRef<maplibregl.Popup | null>(null);

  // 费率归一化（选中方案内 min/max → 色带）
  const rateMap = useMemo(
    () => new Map((quote?.perSegment ?? []).map((s) => [s.sid, s.rate])),
    [quote],
  );
  const rates = useMemo(
    () => schemeSids.map((s) => rateMap.get(s)).filter((x): x is number => x != null),
    [schemeSids, rateMap],
  );
  const rMin = rates.length ? Math.min(...rates) : 0;
  const rMax = rates.length ? Math.max(...rates) : 1;
  const rateOf = (sid: string): number => {
    const r = rateMap.get(sid);
    return r == null ? 0.5 : rMax - rMin < 1e-12 ? 0.5 : (r - rMin) / (rMax - rMin);
  };

  // 构建线路 GeoJSON（候选 + 选中方案）
  const buildRoutesFC = (): RouteFC => {
    const segQuote = new Map((quote?.perSegment ?? []).map((s) => [s.sid, s]));
    const features: RouteFC['features'] = [];
    const push = (sid: string, kind: 'scheme' | 'candidate') => {
      const latlngs = polyLatLngs(sid);
      if (latlngs.length === 0) return;
      const q = segQuote.get(sid);
      const paused = q ? q.paused || q.st === 3 : SEGMENTS[sid]?.st === 3;
      const conf = ROUTE_POLYS.find((p) => p.sid === sid)?.confidence;
      features.push({
        type: 'Feature',
        properties: {
          sid,
          kind,
          paused: paused || false,
          conf: conf ?? 'C',
          sel: kind === 'scheme' && selectedSid === sid,
          dim: kind === 'scheme' && selectedSid != null && selectedSid !== sid,
          color: paused ? tokens.color.paused : rateColor(tokens.rateRamp, rateOf(sid)),
        },
        geometry: { type: 'LineString', coordinates: latlngs.map(([lat, lon]) => [lon, lat]) },
      });
    };
    for (const sids of candidateSids) for (const sid of sids) push(sid, 'candidate');
    for (const sid of schemeSids) push(sid, 'scheme');
    return { type: 'FeatureCollection', features };
  };

  // 初始化（一次）
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://tiles.openfreemap.org/styles/positron',
      center: [96.9, 19.8],
      zoom: 5.4,
      attributionControl: { compact: false, customAttribution: '© OpenFreeMap' },
    });
    map.dragRotate.disable();
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');
    popupRef.current = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 8 });

    map.on('load', () => {
      // 缅甸省界（mmr.json，细虚线，同旧版在线地图的处理）
      map.addSource('mmr-provinces', { type: 'geojson', data: mmr as never });
      map.addLayer({
        id: 'mmr-lines',
        type: 'line',
        source: 'mmr-provinces',
        paint: { 'line-color': '#b9b0a2', 'line-width': 1.2, 'line-dasharray': [3, 2] },
      });
      // 线路（line-dasharray 不支持数据驱动，按 [C]实线/[E]虚线 拆层过滤）
      map.addSource('seikcha-routes', { type: 'geojson', data: buildRoutesFC() });
      map.addLayer({
        id: 'routes-cand',
        type: 'line',
        source: 'seikcha-routes',
        filter: ['==', ['get', 'kind'], 'candidate'],
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#9aa0a6', 'line-width': 3, 'line-opacity': 0.9, 'line-dasharray': [5, 4] },
      });
      map.addLayer({
        id: 'routes-scheme-solid',
        type: 'line',
        source: 'seikcha-routes',
        filter: ['all', ['==', ['get', 'kind'], 'scheme'], ['==', ['get', 'conf'], 'C']],
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': ['case', ['==', ['get', 'sel'], true], 8, 5],
          'line-opacity': ['case', ['==', ['get', 'dim'], true], 0.4, 1],
        },
      });
      map.addLayer({
        id: 'routes-scheme-dashed',
        type: 'line',
        source: 'seikcha-routes',
        filter: ['all', ['==', ['get', 'kind'], 'scheme'], ['==', ['get', 'conf'], 'E']],
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': ['case', ['==', ['get', 'sel'], true], 8, 5],
          'line-opacity': ['case', ['==', ['get', 'dim'], true], 0.4, 1],
          'line-dasharray': [10, 6],
        },
      });

      // 悬停/点选交互（回调走 cbRef）
      const attachRouteEvents = (layerId: string) => {
        map.on('mousemove', layerId, (e) => {
          const f = e.features?.[0];
          if (!f) return;
          const sid = f.properties?.sid as string;
          cbRef.current.onHoverSid(sid);
          map.getCanvas().style.cursor = 'pointer';
          const q = quote?.perSegment.find((s) => s.sid === sid);
          const L = langRef.current;
          const rateLabel = L === 'zh' ? '费率/百公里' : L === 'my' ? 'စျေးနှုန်း/၁၀၀km' : 'Rate/100km';
          const s3Label = L === 'zh' ? 'S3 冲突·暂停承保' : L === 'my' ? 'S3 ပဋိပက္ခ · ရပ်နား' : 'S3 conflict · suspended';
          popupRef.current
            ?.setLngLat(e.lngLat)
            .setHTML(
              `<div style="font-weight:700">${roadName(sid, L)}</div>` +
                `<div style="color:#5f6368">${q ? `${rateLabel} ${q.rate.toFixed(4)}%` : ''}</div>` +
                (q && q.st === 3 ? `<div style="color:${tokens.color.paused};font-weight:700">${s3Label}</div>` : ''),
            )
            .addTo(map);
        });
        map.on('mouseleave', layerId, () => {
          cbRef.current.onHoverSid(null);
          map.getCanvas().style.cursor = '';
          popupRef.current?.remove();
        });
        map.on('click', layerId, (e) => {
          const sid = e.features?.[0]?.properties?.sid as string | undefined;
          if (sid) cbRef.current.onSelectSid(sid);
        });
      };
      attachRouteEvents('routes-scheme-solid');
      attachRouteEvents('routes-scheme-dashed');
      map.on('error', (e) => console.warn('[maplibre]', e.error?.message ?? e));

      readyRef.current = true;
      setReady(true);
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      readyRef.current = false;
    };
    // buildRoutesFC 闭包随渲染更新，监听器内经 cbRef 取最新回调；数据经 setData 刷新
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 线路数据刷新（方案/报价/选中变化）
  useEffect(() => {
    if (!ready) return;
    (mapRef.current?.getSource('seikcha-routes') as maplibregl.GeoJSONSource | undefined)?.setData(buildRoutesFC());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, schemeSids, candidateSids, quote, selectedSid]);

  // 悬停同步费率高亮由 selectedSid 驱动（MapPage 传入 selectedSid ?? hoverSid）

  // 城市标注与暂停标签（DOM marker，字号恒定）
  const markersRef = useRef<maplibregl.Marker[]>([]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    for (const m of markersRef.current) m.remove();
    markersRef.current = [];

    const visible = new Set<string>();
    for (const sid of schemeSids) for (const n of ROUTE_POLYS.find((p) => p.sid === sid)?.nodes ?? []) visible.add(n);
    const onScheme = new Set<string>();
    for (const sid of schemeSids) for (const n of ROUTE_POLYS.find((p) => p.sid === sid)?.nodes ?? []) onScheme.add(n);
    const candidateOnly = new Set<string>(
      candidateSids.flat().flatMap((sid) => ROUTE_POLYS.find((p) => p.sid === sid)?.nodes ?? []),
    );

    const shadow = '-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff';
    const label = (zh: string, emph: boolean, color: string) =>
      `<span style="font-size:${emph ? 12 : 11}px;font-weight:${emph ? 800 : 600};color:${color};text-shadow:${shadow};white-space:nowrap">${zh}</span>`;

    for (const cid of visible) {
      const c = CITIES.find((x) => x.id === cid);
      if (!c) continue;
      const isOrigin = cid === origin;
      const isDest = cid === destination;
      const onSel = onScheme.has(cid);
      if (!onSel && !candidateOnly.has(cid)) continue;
      const dotColor = isDest ? '#EA4335' : isOrigin ? '#172436' : onSel ? '#4285F4' : '#bdc1c6';
      const dotSize = isOrigin || isDest ? 12 : onSel ? 9 : 6;
      const el = document.createElement('div');
      el.innerHTML =
        `<div style="display:flex;flex-direction:column;align-items:center;transform:translateY(6px)">` +
        `<span style="width:${dotSize}px;height:${dotSize}px;border-radius:50%;background:${dotColor};border:2px solid #fff;box-shadow:0 0 2px rgba(0,0,0,.35)"></span>` +
        (onSel || isOrigin || isDest
          ? label(lang === 'zh' ? c.zh : c.en || c.zh, isOrigin || isDest, isDest ? '#EA4335' : '#172436')
          : '') +
        `</div>`;
      const mk = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([c.lon, c.lat])
        .addTo(map);
      markersRef.current.push(mk);
    }

    // 暂停禁售常显标签（选中方案内 S3 段中点）
    const segQuote = new Map((quote?.perSegment ?? []).map((s) => [s.sid, s]));
    for (const sid of schemeSids) {
      const q = segQuote.get(sid);
      const paused = q ? q.paused || q.st === 3 : SEGMENTS[sid]?.st === 3;
      if (!paused) continue;
      const latlngs = polyLatLngs(sid);
      const mid = latlngs[Math.floor(latlngs.length / 2)];
      if (!mid) continue;
      const el = document.createElement('div');
      el.innerHTML =
        `<div style="background:${tokens.color.paused};color:#fff;font-size:10px;font-weight:800;` +
        `padding:1px 6px;border-radius:4px;white-space:nowrap;border:1.5px solid #fff">${
          lang === 'zh' ? '暂停禁售' : lang === 'my' ? 'ရပ်နား' : 'Paused'
        }</div>`;
      const mk = new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat([mid[1], mid[0]]).addTo(map);
      markersRef.current.push(mk);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, schemeSids, candidateSids, origin, destination, quote, lang]);

  // 起讫变化 → 自适应到全部候选方案范围
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const pts = [...schemeSids, ...candidateSids.flat()].flatMap(polyLatLngs);
    if (pts.length === 0) return;
    const bounds = new maplibregl.LngLatBounds();
    for (const [lat, lon] of pts) bounds.extend([lon, lat]);
    map.fitBounds(bounds, { padding: 60, maxZoom: 9 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin, destination, ready]);

  return (
    <div className="overflow-hidden rounded-2xl shadow-sm ring-1 ring-slate-200">
      <div ref={containerRef} style={{ height: 'clamp(460px, 60vh, 680px)' }} className="w-full bg-[#e5e3df]" />
    </div>
  );
}
