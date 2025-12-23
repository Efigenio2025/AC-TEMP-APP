export function getTempStatus(temp) {
  if (temp === undefined || temp === null || Number.isNaN(Number(temp)))
    return { label: 'No Data', color: 'text-slate-400', badge: 'bg-slate-700', key: 'none' };
  const value = Number(temp);
  if (value < 70) return { label: 'Cold', color: 'text-red-400', badge: 'bg-red-900/60', key: 'cold' };
  if (value < 81) return { label: 'Normal', color: 'text-green-400', badge: 'bg-green-900/60', key: 'normal' };
  if (value < 90) return { label: 'Above Target', color: 'text-orange-400', badge: 'bg-orange-900/60', key: 'above' };
  return { label: 'Critical Hot', color: 'text-red-500', badge: 'bg-red-900/80', key: 'critical' };
}

export function statusToGlow(statusKey) {
  if (statusKey === 'critical' || statusKey === 'cold') return 'glow-critical';
  if (statusKey === 'above') return 'glow-above';
  return '';
}
