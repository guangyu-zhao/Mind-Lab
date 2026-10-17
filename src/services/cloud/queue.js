import { gamesById } from '../../catalog.js';
import { errorKey } from './errors.js';
export const pendingPrefix = 'mind-arcade.pending:';
export function createScoreQueue({
  client,
  account,
  isRunning,
  onChange = () => {},
  onUpload = () => {},
  storage,
}) {
  const memory = new Map();
  let unavailable = false,
    flushing = false,
    error = '',
    timer,
    disposed = false;
  try {
    storage ??= globalThis.localStorage;
  } catch {
    unavailable = true;
  }
  function entries() {
    const all = new Map(memory);
    try {
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (!key?.startsWith(pendingPrefix)) continue;
        try {
          const item = JSON.parse(storage.getItem(key));
          if (item?.owner && item.record && gamesById.has(item.game)) all.set(key, item);
        } catch {}
      }
    } catch {
      unavailable = true;
    }
    return [...all].filter(([, item]) => item.owner === account.state.user?.id);
  }
  function store(key, item) {
    memory.set(key, item);
    try {
      storage.setItem(key, JSON.stringify(item));
    } catch {
      unavailable = true;
    }
  }
  async function flush() {
    const { user, ready, epoch } = account.state;
    if (disposed || flushing || !client || !user || !ready || !navigator.onLine || isRunning())
      return;
    let uploaded = false;
    flushing = true;
    onChange();
    try {
      for (const [key, item] of entries()) {
        if (account.state.epoch !== epoch || account.state.user?.id !== user.id || isRunning())
          break;
        if (item.error) continue;
        const result = await client
          .rpc('ml_submit', { p_game_id: item.game, p_record: item.record, p_owner: item.owner })
          .abortSignal(AbortSignal.timeout(15000));
        if (result.error) {
          const issue = result.error;
          if (
            (issue.code === 'P0001' &&
              !['rate_limited', 'unsupported_rules'].includes(issue.message)) ||
            /^(22|23)/.test(issue.code || '')
          )
            store(key, { ...item, error: issue.message });
          else if (account.state.epoch === epoch) error = errorKey(issue);
          break;
        }
        memory.delete(key);
        try {
          storage.removeItem(key);
        } catch {
          unavailable = true;
        }
        uploaded = true;
        if (account.state.epoch === epoch) error = '';
      }
    } catch {
      if (account.state.epoch === epoch) error = 'offline';
    } finally {
      flushing = false;
      if (!disposed) {
        onChange();
        if (account.state.epoch === epoch && uploaded) onUpload();
        clearTimeout(timer);
        if (entries().some(([, item]) => !item.error))
          timer = setTimeout(flush, account.state.epoch === epoch ? 15000 : 0);
      }
    }
  }
  return {
    get state() {
      const all = entries();
      return {
        waiting: all.filter(([, item]) => !item.error).length,
        failed: all.filter(([, item]) => item.error).length,
        flushing,
        error,
        unavailable,
      };
    },
    submit(game, record, owner) {
      if (
        !game ||
        !owner ||
        !record?.meta ||
        record.status === 'interrupted' ||
        (record.status === 'stopped' && !record.trials?.length)
      )
        return;
      store(`${pendingPrefix}${owner}:${game}:${record.id}`, { owner, game, record });
      onChange();
      void flush();
    },
    flush,
    retry() {
      for (const [key, item] of entries()) {
        delete item.error;
        store(key, item);
      }
      error = '';
      void flush();
    },
    changedAccount() {
      error = '';
      onChange();
      void flush();
    },
    dispose() {
      disposed = true;
      clearTimeout(timer);
    },
  };
}
