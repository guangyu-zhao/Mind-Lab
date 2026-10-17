import { copyOwnership } from './lifecycle.js';
/** @param {...Array<import('./types.js').ScoreRecord>} groups */
function mergeRecords(...groups) {
  const unique = new Map();
  for (const records of groups)
    for (const record of records) {
      if (!unique.has(record.id)) unique.set(record.id, record);
    }
  return [...unique.values()].sort((a, b) => a.endedAt.localeCompare(b.endedAt));
}

function saveRecords(key, records, validate) {
  const incoming = validate(records);
  const existing = validate(JSON.parse(localStorage.getItem(key) || '[]'));
  const merged = mergeRecords(incoming, existing);
  localStorage.setItem(key, JSON.stringify(merged));
  return merged;
}

function readMeta(meta) {
  if (meta == null) return null;
  const d = meta.display;
  if (
    meta.schema !== 1 ||
    typeof meta.rulesVersion !== 'string' ||
    !/^[a-z0-9.-]{1,80}$/.test(meta.rulesVersion) ||
    !meta.rules ||
    Object.getPrototypeOf(meta.rules) !== Object.prototype ||
    Object.keys(meta.rules).length > 20 ||
    !Object.entries(meta.rules).every(
      ([k, v]) =>
        /^[a-zA-Z0-9_-]{1,40}$/.test(k) &&
        ((typeof v === 'string' && v.length <= 100) ||
          typeof v === 'boolean' ||
          (typeof v === 'number' && Number.isFinite(v))),
    ) ||
    !d ||
    !['width', 'height', 'viewportWidth', 'viewportHeight', 'dpr', 'scale'].every(
      (k) => Number.isFinite(d[k]) && d[k] > 0 && d[k] <= 20000,
    ) ||
    !Array.isArray(meta.inputTypes) ||
    !meta.inputTypes.every((v) => ['mouse', 'touch', 'pen', 'keyboard'].includes(v))
  )
    throw Error('record conditions');
  const clean = {
    schema: 1,
    rulesVersion: meta.rulesVersion,
    rules: { ...meta.rules },
    display: Object.fromEntries(
      ['width', 'height', 'viewportWidth', 'viewportHeight', 'dpr', 'scale'].map((k) => [k, d[k]]),
    ),
    inputTypes: [...new Set(meta.inputTypes)].sort(),
  };
  copyOwnership(meta, clean);
  return clean;
}

function conditionKey(meta) {
  if (!meta) return 'unknown';
  const d = meta.display;
  return JSON.stringify([
    meta.rulesVersion,
    Object.entries(meta.rules).sort(([a], [b]) => a.localeCompare(b)),
    Math.round(d.width / 10) * 10,
    d.scale,
    d.dpr,
  ]);
}
export { mergeRecords, saveRecords, readMeta, conditionKey };
