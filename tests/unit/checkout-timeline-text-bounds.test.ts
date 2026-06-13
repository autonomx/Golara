import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const sourcePath = resolve(process.cwd(), 'lib/checkout/checkout-status-service.ts');
const source = readFileSync(sourcePath, 'utf8');

for (const expected of [
  'const TIMELINE_NOTE_MAX_LENGTH = 1000;',
  'const TIMELINE_ACTOR_LABEL_MAX_LENGTH = 120;',
  'const TIMELINE_ACTOR_ROLE_MAX_LENGTH = 80;',
  'return normalized.slice(0, maxLength);',
  'function timelineNote(value?: string)',
  'function timelineActorLabel(value?: string)',
  'function timelineActorRole(value?: string)'
]) {
  assert.ok(source.includes(expected), `missing bounded timeline text source: ${expected}`);
}

const noteUses = source.split('note: timelineNote(input.note)').length - 1;
const labelUses = source.split('actorLabel: timelineActorLabel(input.actorLabel)').length - 1;
const roleUses = source.split('actorRole: timelineActorRole(input.actorRole)').length - 1;

assert.equal(noteUses, 3, 'order, fulfillment, and payment events should bound notes');
assert.equal(labelUses, 3, 'order, fulfillment, and payment events should bound actor labels');
assert.equal(roleUses, 3, 'order, fulfillment, and payment events should bound actor roles');

for (const forbidden of [
  'function optionalText(',
  'note: optionalText(',
  'actorLabel: optionalText(',
  'actorRole: optionalText('
]) {
  assert.ok(!source.includes(forbidden), `checkout status service must not contain ${forbidden}`);
}

console.log('checkout timeline text bounds gate passed');
