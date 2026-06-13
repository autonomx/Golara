import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

export async function runPublicOrderProgressPrivacyTests() {
  const repositorySource = readFileSync('lib/checkout/public-order-repository.ts', 'utf8');
  const pageSource = readFileSync('app/orders/[token]/page.tsx', 'utf8');
  const labelsSource = readFileSync('lib/checkout/public-order-labels.ts', 'utf8');

  const timelineSelectMatch = repositorySource.match(/timelineEvents:\s*\{[\s\S]*?select:\s*\{([\s\S]*?)\}\s*,\s*orderBy:/);
  assert.ok(timelineSelectMatch, 'public order repository should keep an explicit timelineEvents select');
  assert.match(timelineSelectMatch[1], /type:\s*true/, 'public timeline events should expose the event type for safe public labels');
  assert.match(timelineSelectMatch[1], /createdAt:\s*true/, 'public timeline events should expose only event timestamps for progress timing');
  assert.doesNotMatch(timelineSelectMatch[1], /title:\s*true/, 'public timeline events must not expose raw internal event titles');
  assert.doesNotMatch(timelineSelectMatch[1], /note:\s*true|metadata:\s*true|actorLabel:\s*true|actorRole:\s*true/, 'public timeline events must not expose internal notes, metadata, or actor fields');

  assert.match(pageSource, /publicOrderProgressTitle\(event\.type,\s*normalizedLocale\)/, 'public order page should render safe event-type progress labels');
  assert.doesNotMatch(pageSource, /event\.title/, 'public order page must not render raw internal timeline event titles');
  assert.match(labelsSource, /export\s+function\s+publicOrderProgressTitle/, 'public progress labels should be centralized in the public order label helper');

  console.log('public-order-progress-privacy.test.ts passed');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runPublicOrderProgressPrivacyTests().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
