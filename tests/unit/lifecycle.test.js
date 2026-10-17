import test from 'node:test';
import assert from 'node:assert/strict';
import { Core } from '../../src/core/index.js';
import { beginRecord, finishRecord, connectScores } from '../../src/core/lifecycle.js';
const meta = () => ({
  schema: 1,
  rulesVersion: 'sequence-memory-1',
  rules: { size: 3, mode: 'prefix', order: 'forward' },
  display: {
    width: 500,
    height: 500,
    viewportWidth: 1200,
    viewportHeight: 900,
    dpr: 1,
    scale: 100,
  },
  inputTypes: [],
});
test('merging and reading records never upload; completing a run submits once to its original owner', () => {
  const calls = [],
    service = { userId: 'alice', submit: (...args) => calls.push(args), setContext() {} };
  connectScores(service);
  const original = meta();
  beginRecord(original);
  service.userId = 'bob';
  const copied = Core.readMeta(original);
  const record = { id: 'run', meta: copied, endedAt: '2026-10-17' };
  Core.mergeRecords([record], [record]);
  Core.commitRecord(record);
  assert.equal(calls.length, 0);
  finishRecord(copied);
  Core.mergeRecords([record]);
  assert.equal(calls.length, 0);
  Core.commitRecord(record);
  Core.commitRecord(record);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][1], 'alice');
  service.userId = null;
  const anonymous = meta();
  beginRecord(anonymous);
  service.userId = 'alice';
  finishRecord(anonymous);
  Core.commitRecord({ meta: anonymous });
  assert.equal(calls.length, 1);
  Core.commitRecord({ meta: Core.readMeta(meta()) });
  assert.equal(calls.length, 1);
  connectScores({ userId: null, submit() {}, setContext() {} });
});
