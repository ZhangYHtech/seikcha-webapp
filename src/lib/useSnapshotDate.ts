// ============================================================
// "最新快照业务日期"钩子（页脚披露 / FAQ 共用）。
// 口径（用户规则）：今天的快照已发布 → 显示今天；未发布 → 显示
// latest.json 的真实业务日期（通常=昨天）；请求失败 → 昨天兜底。
// 复用 loadInfoDay 的会话缓存，不产生额外网络请求。
// ============================================================
import { useEffect, useState } from 'react';
import { loadInfoDay, todayStr } from '../engine';

/** 昨天（UTC+8 业务日期；与 todayStr 同口径） */
function yesterdayStr(): string {
  return new Date(Date.now() + 8 * 3600_000 - 86400000).toISOString().slice(0, 10);
}

export function useSnapshotDate(): string {
  // 初始先按"昨天"占位（首帧不闪空），快照加载成功后覆盖为真实日期
  const [date, setDate] = useState<string>(yesterdayStr);
  useEffect(() => {
    let alive = true;
    loadInfoDay(todayStr()).then((d) => {
      if (alive && d) setDate(d.date);
    });
    return () => {
      alive = false;
    };
  }, []);
  return date;
}
