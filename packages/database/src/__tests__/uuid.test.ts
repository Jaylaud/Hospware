import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateUUIDv7 } from '../uuid';

describe('UUIDv7 Generator', () => {
  it('generates valid UUIDv7 strings', () => {
    const id = generateUUIDv7();
    assert.strictEqual(id.length, 36);
    // UUID regex: 8-4-4-4-12
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    assert.match(id, regex);
  });

  it('generates chronologically sortable IDs', async () => {
    const id1 = generateUUIDv7();
    await new Promise((r) => setTimeout(r, 5));
    const id2 = generateUUIDv7();

    assert.ok(id1 < id2);
  });
});
