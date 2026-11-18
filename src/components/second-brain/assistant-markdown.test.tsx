import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AssistantMarkdown } from './assistant-markdown';

describe('assistant Markdown security', () => {
 it('discards raw HTML from assistant content', () => {
  const output = renderToStaticMarkup(<AssistantMarkdown content={'Texto\n\n<script>alert(1)</script>\n\n<img src="x" onerror="alert(2)">\n\nFinal'}/>);
  expect(output).not.toContain('<script');
  expect(output).not.toContain('<img');
  expect(output).not.toContain('onerror');
  expect(output).toContain('Final');
 });
 it('rejects executable Markdown link URLs', () => {
  const output = renderToStaticMarkup(<AssistantMarkdown content="[Enlace](javascript:alert%281%29)"/>);
  expect(output).not.toContain('javascript:');
 });
});