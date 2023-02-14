export function bytesFormatted(val) {
  const kb = val/1024;
  return kb < 0.5? kb.toFixed(2) : Math.round(kb).toLocaleString();
}

export function decimal(val) {
  return val.toLocaleString([], { minimumFractionDigits: 3, maximumFractionDigits: 3 })
}