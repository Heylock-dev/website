export function computeHashedEventVector(events, dimension = 64) {
  const hashStr = (str) => {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
      hash = hash | 0;
    }
    return Math.abs(hash);
  };

  const vector = new Array(dimension).fill(0);
  for (const ev of events || []) {
    const key = String(ev.type || ev?.payload?.type || 'unknown');
    const idx = hashStr(key) % dimension;
    vector[idx] = (vector[idx] || 0) + 1;
  }
  const norm = Math.sqrt(vector.reduce((s, x) => s + x * x, 0));
  if (norm === 0) return vector;
  return vector.map(x => x / norm);
}
