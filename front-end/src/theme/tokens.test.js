import test from 'node:test';
import assert from 'node:assert/strict';
import { colors, contrastRatio, eventStyle, installThemeVariables, chartColors } from './tokens.js';

test('brand palette stays consistent across CSS and charts', () => {
  const properties = new Map();
  installThemeVariables({ style: { setProperty: (key, value) => properties.set(key, value) } });
  for (const [name, value] of Object.entries(colors)) {
    assert.equal(properties.get(`--color-${name}`), value);
    assert.match(properties.get(`--color-${name}-rgb`), /^\d+ \d+ \d+$/);
  }
  assert.equal(new Set(chartColors).size, 6);
  assert.equal(colors.primary, '#492F2A');
  assert.equal(colors.background, '#FDFAF9');
});

test('normal text and action labels have accessible contrast', () => {
  for (const background of [colors.background, colors.surface, colors.white]) {
    for (const text of [colors.text, colors.secondary, colors.success, colors.warning, colors.error, colors.info]) {
      assert.ok(contrastRatio(text, background) >= 4.5, `${text} on ${background}`);
    }
  }
  assert.ok(contrastRatio(colors.white, colors.primary) >= 4.5);
  assert.ok(contrastRatio(colors.text, colors.accent) >= 4.5);
});

test('calendar preserves valid stored colors and normalizes legacy values', () => {
  assert.equal(eventStyle('789DBC').backgroundColor, '#789DBC');
  assert.equal(eventStyle('#abc').backgroundColor, '#aabbcc');
  assert.equal(eventStyle('#22100C').color, colors.white);
  assert.equal(eventStyle('#ffffff').color, colors.text);
  for (const invalid of [null, undefined, '', 'red', 'invalid', {}]) {
    assert.equal(eventStyle(invalid).backgroundColor, colors.accent);
  }
});
