import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PaperDocument, layoutText, COLUMNS, MAX_LINES, SAMPLE_TEXT } from '../src/document.js';

test('sample sentence is preserved exactly while wrapping onto the paper', () => {
  const paper = new PaperDocument();
  for (const char of SAMPLE_TEXT) assert.equal(paper.append(char), true);
  assert.equal(paper.text, 'Hi, fellow followers of X how are you doing?');
  assert.deepEqual(paper.layout.lines, ['Hi, fellow followers of X how are you ', 'doing?']);
  assert.equal(paper.wordCount, 9);
});

test('the last column is filled before the carriage returns', () => {
  assert.deepEqual(layoutText('a'.repeat(COLUMNS)), { lines: ['a'.repeat(COLUMNS)], row: 0, column: COLUMNS });
  assert.equal(layoutText('a'.repeat(COLUMNS + 1)).column, 1);
  assert.equal(layoutText('a'.repeat(COLUMNS + 1)).row, 1);
});

test('backspacing across an automatic return restores the previous line', () => {
  const paper = new PaperDocument();
  for (const char of 'x'.repeat(COLUMNS + 1)) paper.append(char);
  paper.backspace();
  assert.equal(paper.layout.row, 0);
  assert.equal(paper.layout.column, COLUMNS);
});

test('newlines, empty lines, and Windows line endings are handled consistently', () => {
  assert.deepEqual(layoutText('One\r\n\r\nTwo').lines, ['One', '', 'Two']);
  const paper = new PaperDocument();
  paper.append('\n');
  paper.append('\n');
  assert.equal(paper.layout.row, 2);
  paper.clear();
  assert.equal(paper.layout.row, 0);
  assert.equal(paper.wordCount, 0);
});

test('the end of the paper rejects extra ink without changing the document', () => {
  const paper = new PaperDocument();
  for (let i = 0; i < MAX_LINES * COLUMNS; i++) assert.equal(paper.append('a'), true);
  const full = paper.text;
  assert.equal(paper.append('b'), false);
  assert.equal(paper.append('\n'), false);
  assert.equal(paper.text, full);
});
