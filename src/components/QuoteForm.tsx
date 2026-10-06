// ============================================================
// 报价信息问卷（2026-10-05 新增，保费地图第一步）
// 参照参考站表单页版式：白底、黑字、黑框选项、居中单列；
// 共 12 题（季节 1 + 货物与装载 4 + 运输安排 7），全部默认基准档，
// 填完点"继续"进入地图界面（地图界面不再出现这些选择框）。
// ============================================================
import { useState } from 'react';
import { useT } from '../i18n';
import type { DisplayLevels, Fr05Level, Fr09Level, Fr10Level, Fr11Level, Fr12Level, Fr13Level, Fr14Level, Rain, Sv01, Sv02, Sv03Level, Sv04Level } from '../engine/types';

export interface FormAnswers {
  rain: Rain;
  sv01: Sv01;
  sv02: Sv02;
  display: DisplayLevels;
}

export const DEFAULT_ANSWERS: FormAnswers = {
  rain: 0,
  sv01: '纸箱',
  sv02: '服装',
  display: {
    sv03: '普通服装',
    sv04: '篷布车',
    fr05: '一般',
    fr09: '常规',
    fr10: '一般',
    fr11: '无',
    fr12: '一般',
    fr13: '<20k',
    fr14: '白天',
  },
};

type Opt<T> = { v: T; k: string }; // k=文案键（i18n），v=引擎业务值（保持中文不动）

const Q_SEASON: Opt<Rain>[] = [
  { v: 0, k: 'opt.season0' },
  { v: 1, k: 'opt.season1' },
  { v: 2, k: 'opt.season2' },
  { v: 3, k: 'opt.season3' },
];
const Q_SV01: Opt<Sv01>[] = [
  { v: '纸箱', k: 'opt.pack.carton' },
  { v: '帆布', k: 'opt.pack.canvas' },
  { v: '托盘', k: 'opt.pack.pallet' },
];
const Q_SV02: Opt<Sv02>[] = [
  { v: '服装', k: 'opt.cargo.garment' },
  { v: '杂货', k: 'opt.cargo.general' },
];
const Q_SV03: Opt<Sv03Level>[] = [
  { v: '低易损', k: 'opt.frag.low' },
  { v: '普通服装', k: 'opt.frag.normal' },
  { v: '高易损', k: 'opt.frag.high' },
];
const Q_SV04: Opt<Sv04Level>[] = [
  { v: '篷布车', k: 'opt.load.tarp' },
  { v: '集装箱', k: 'opt.load.container' },
  { v: '平板', k: 'opt.load.flatbed' },
];
const Q_FR05: Opt<Fr05Level>[] = [
  { v: '优秀', k: 'opt.carrier.top' },
  { v: '一般', k: 'opt.carrier.avg' },
  { v: '散户', k: 'opt.carrier.indep' },
];
const Q_FR09: Opt<Fr09Level>[] = [
  { v: 'A照5年', k: 'opt.driver.lic5' },
  { v: '常规', k: 'opt.driver.std' },
  { v: '新司机', k: 'opt.driver.new' },
];
const Q_FR10: Opt<Fr10Level>[] = [
  { v: '良好', k: 'opt.veh.good' },
  { v: '一般', k: 'opt.veh.avg' },
  { v: '悬挂老化', k: 'opt.veh.worn' },
];
const Q_FR11: Opt<Fr11Level>[] = [
  { v: '武装', k: 'opt.escort.armed' },
  { v: '民用', k: 'opt.escort.civil' },
  { v: '无', k: 'opt.escort.none' },
];
const Q_FR12: Opt<Fr12Level>[] = [
  { v: '无出险', k: 'opt.claims.none' },
  { v: '一般', k: 'opt.claims.avg' },
  { v: '高频', k: 'opt.claims.high' },
];
const Q_FR13: Opt<Fr13Level>[] = [
  { v: '<20k', k: 'opt.value.u20' },
  { v: '20-50k', k: 'opt.value.2050' },
  { v: '>50k', k: 'opt.value.o50' },
];
const Q_FR14: Opt<Fr14Level>[] = [
  { v: '白天', k: 'opt.time.day' },
  { v: '夜间', k: 'opt.time.night' },
];

export function QuoteForm(props: { initial: FormAnswers; onContinue: (a: FormAnswers) => void }) {
  const { initial, onContinue } = props;
  const t = useT();
  const [rain, setRain] = useState<Rain>(initial.rain);
  const [sv01, setSv01] = useState<Sv01>(initial.sv01);
  const [sv02, setSv02] = useState<Sv02>(initial.sv02);
  const [display, setDisplay] = useState<DisplayLevels>(initial.display);

  const setD = (patch: Partial<DisplayLevels>) => setDisplay((d) => ({ ...d, ...patch }));

  return (
    <div className="mx-auto max-w-2xl px-4 pb-20 pt-10 sm:pt-14">
      <h1 className="text-center font-serif text-3xl font-bold tracking-tight text-pg-navy sm:text-4xl">
        {t('form.h1')}
      </h1>
      <p className="mx-auto mt-3 max-w-xl text-center text-sm text-slate-500">{t('form.sub')}</p>

      <div className="mt-10 space-y-9">
        {/* 季节 */}
        <Question label={t('form.q.season')} options={Q_SEASON} value={rain} onChange={setRain} />

        <GroupTitle text={t('form.g1')} />
        <Question label={t('form.q.pack')} options={Q_SV01} value={sv01} onChange={setSv01} />
        <Question label={t('form.q.cargo')} options={Q_SV02} value={sv02} onChange={setSv02} />
        <Question label={t('form.q.frag')} options={Q_SV03} value={display.sv03 ?? '普通服装'} onChange={(v) => setD({ sv03: v })} />
        <Question label={t('form.q.load')} options={Q_SV04} value={display.sv04 ?? '篷布车'} onChange={(v) => setD({ sv04: v })} />

        <GroupTitle text={t('form.g2')} />
        <Question label={t('form.q.carrier')} options={Q_FR05} value={display.fr05 ?? '一般'} onChange={(v) => setD({ fr05: v })} />
        <Question label={t('form.q.driver')} options={Q_FR09} value={display.fr09 ?? '常规'} onChange={(v) => setD({ fr09: v })} />
        <Question label={t('form.q.veh')} options={Q_FR10} value={display.fr10 ?? '一般'} onChange={(v) => setD({ fr10: v })} />
        <Question label={t('form.q.escort')} options={Q_FR11} value={display.fr11 ?? '无'} onChange={(v) => setD({ fr11: v })} />
        <Question label={t('form.q.claims')} options={Q_FR12} value={display.fr12 ?? '一般'} onChange={(v) => setD({ fr12: v })} />
        <Question label={t('form.q.value')} options={Q_FR13} value={display.fr13 ?? '<20k'} onChange={(v) => setD({ fr13: v })} />
        <Question label={t('form.q.time')} options={Q_FR14} value={display.fr14 ?? '白天'} onChange={(v) => setD({ fr14: v })} />
      </div>

      <div className="mt-12 text-center">
        <button
          onClick={() => onContinue({ rain, sv01, sv02, display })}
          className="rounded-md bg-seik-500 px-10 py-3 text-base font-bold text-pg-black shadow-sm transition hover:bg-seik-700"
        >
          {t('form.continue')}
        </button>
        <p className="mt-4 text-xs text-slate-400">{t('form.note')}</p>
      </div>
    </div>
  );
}

function GroupTitle(props: { text: string }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <span className="text-sm font-bold text-pg-navy">{props.text}</span>
      <span className="h-px flex-1 bg-slate-200" />
    </div>
  );
}

function Question<T extends string | number>(props: {
  label: string;
  options: Opt<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  const t = useT();
  return (
    <div>
      <div className="mb-2.5 text-[15px] font-bold text-pg-black">{props.label}</div>
      <div className="flex flex-wrap gap-3">
        {props.options.map((o) => {
          const active = props.value === o.v;
          return (
            <button
              key={String(o.v)}
              onClick={() => props.onChange(o.v)}
              aria-pressed={active}
              className={`min-w-[120px] flex-1 rounded-lg border px-4 py-2.5 text-center text-sm transition sm:max-w-[220px] ${
                active
                  ? 'border-seik-500 bg-seik-50 font-semibold text-pg-navy ring-1 ring-seik-500'
                  : 'border-slate-400 bg-white text-slate-800 hover:border-pg-black'
              }`}
            >
              {t(o.k)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
