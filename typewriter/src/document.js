export const SAMPLE_TEXT = 'Hi, fellow followers of X how are you doing?';
export const COLUMNS = 38;
export const MAX_LINES = 18;

// Keep paper layout independent from rendering and input, so every input path wraps identically.
export function layoutText(text, columns = COLUMNS) {
  const lines = [''];
  for (const char of text.replace(/\r\n?/g, '\n')) {
    if (char === '\n') {
      lines.push('');
    } else {
      if (lines.at(-1).length >= columns) lines.push('');
      lines[lines.length - 1] += char;
    }
  }
  return { lines, row: lines.length - 1, column: lines.at(-1).length };
}

export class PaperDocument {
  text = '';
  get layout() { return layoutText(this.text); }
  get wordCount() { return this.text.trim() ? this.text.trim().split(/\s+/).length : 0; }
  append(char) {
    if (char === '\r') char = '\n';
    if (char !== '\n' && (char.length !== 1 || char.charCodeAt(0) < 32)) return false;
    if (layoutText(this.text + char).lines.length > MAX_LINES) return false;
    this.text += char;
    return true;
  }
  backspace() { this.text = this.text.slice(0, -1); }
  clear() { this.text = ''; }
}
