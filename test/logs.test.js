import assert from 'node:assert/strict';
import { test } from 'node:test';

import { loadRegistry } from '../src/content/registry.js';
import {
  compareVersions,
  parseReleaseRows,
  parseVersion,
  readReleases,
  releasesSince,
} from '../src/server/logs.js';

test('every row in the published log index parses', async () => {
  const registry = await loadRegistry();

  // The whole point of this file. The parser reads hand-written markdown, so a
  // row that stops matching would otherwise vanish from an update payload in
  // silence — and a repository told about four releases when five happened has
  // no way to notice the fifth. Here it is a test failure instead.
  const releases = readReleases(registry);

  assert.ok(releases.length > 0, 'the index must publish releases');
  for (const release of releases) {
    assert.match(release.version, /^\d+\.\d+\.\d+$/);
    assert.ok(release.summary.length > 0, `${release.version} needs a summary`);
    // Never blank by rule: it is the only notice a consuming repository gets.
    assert.ok(release.consumersMust.length > 0, `${release.version} needs a Consumers must`);
  }
});

test('the parser refuses a row it cannot read rather than skipping it', () => {
  const short = ['| Version | Date | Summary | Consumers must |', '| `1/0/0` | today | only three |'].join('\n');
  assert.throws(() => parseReleaseRows(short), /expected 4 cells, found 3/);

  const none = '| Version | Date | Summary | Consumers must |\n|---|---|---|---|';
  assert.throws(() => parseReleaseRows(none), /published no release rows/);
});

test('the parser ignores the header and separator without counting on position', () => {
  const table = [
    'Some prose above the table.',
    '',
    '| Version | Date | Summary | Consumers must |',
    '|---|---|---|---|',
    '| `1/2/3` | 2026-01-01 | Did a thing. | Nothing. |',
  ].join('\n');

  const releases = parseReleaseRows(table);
  assert.equal(releases.length, 1);
  assert.equal(releases[0].version, '1.2.3');
  assert.equal(releases[0].consumersMust, 'Nothing.');
});

test('versions parse in both spellings and compare numerically', () => {
  assert.deepEqual(parseVersion('1.0.0').label, '1.0.0');
  assert.deepEqual(parseVersion('1/0/0').label, '1.0.0');
  assert.deepEqual(parseVersion('`0/14/0`').label, '0.14.0');
  assert.equal(parseVersion('nope'), null);
  assert.equal(parseVersion(''), null);

  // Numeric, not lexical: 0.9.0 is older than 0.14.0, which string
  // comparison gets backwards and which this set has actually shipped.
  assert.ok(compareVersions(parseVersion('0.9.0'), parseVersion('0.14.0')) < 0);
  assert.ok(compareVersions(parseVersion('1.0.0'), parseVersion('0.14.0')) > 0);
  assert.equal(compareVersions(parseVersion('1.0.0'), parseVersion('1.0.0')), 0);
});

test('releasesSince returns only newer releases, oldest first', async () => {
  const registry = await loadRegistry();

  const { releases, current } = releasesSince(registry, '0.11.0');
  const versions = releases.map((release) => release.version);

  assert.deepEqual(versions, [...versions].sort((a, b) =>
    compareVersions(parseVersion(a), parseVersion(b)),
  ), 'oldest first — the lines compose and a newer one applied first is silently wrong');

  assert.ok(!versions.includes('0.11.0'), 'the version already adopted is not re-applied');
  assert.ok(versions.includes('0.14.0'));
  assert.equal(current, '0.14.0');
});

test('releasesSince reports a stamp ahead of the set instead of applying it', async () => {
  const registry = await loadRegistry();

  const { releases, ahead } = releasesSince(registry, '99.0.0');
  assert.equal(ahead, true);
  assert.equal(releases.length, 0);
});

test('releasesSince refuses a value that is not a version', async () => {
  const registry = await loadRegistry();
  assert.throws(() => releasesSince(registry, 'latest'), /not a version/);
});

test('releasesSince reports what is wrong with a broken index, not a reduce crash', () => {
  // The guard in readReleases must fire before anything walks the rows. An
  // unseeded reduce over an empty list throws "Reduce of empty array with no
  // initial value" — true, useless, and pointing at the wrong file.
  const emptyIndex = {
    get: () => ({ text: '| Version | Date | Summary | Consumers must |\n|---|---|---|---|' }),
  };

  assert.throws(() => releasesSince(emptyIndex, '1.0.0'), /published no release rows/);
});

test('releasesSince says which resource is missing when the index is absent', () => {
  const noIndex = { get: () => undefined };
  assert.throws(() => releasesSince(noIndex, '1.0.0'), /content missing from the registry/);
});
