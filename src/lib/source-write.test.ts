import { describe, it, expect } from 'vitest';
import { verbatimContent, verbatimTitle, sourceFromName, SAVE_PATTERN } from './source-write';
import { notionContent, notionParagraphs, blockText } from './notion';

describe('guardar desde el chat', () => {
 it('nunca usa texto inventado por el modelo', () => {
  expect(verbatimContent('guarda en Notion: comprar pan', 'Recordatorio: comprar pan integral')).toBe('comprar pan');
  expect(verbatimContent('guarda en Notion: comprar pan', 'comprar pan')).toBe('comprar pan');
 });
 it('el título sale del texto del usuario', () => {
  expect(verbatimTitle('apunta que mañana llamo a Ana', 'Llamada importante', 'mañana llamo a Ana')).toBe('mañana llamo a Ana');
 });
 it('reconoce fuentes y peticiones de guardado', () => {
  expect(sourceFromName('Google Drive')).toBe('drive');
  expect(sourceFromName('Strava')).toBe('garmin');
  expect(SAVE_PATTERN.test('apunta que tengo médico')).toBe(true);
  expect(SAVE_PATTERN.test('¿qué es Product Builder?')).toBe(false);
 });
 it('lo que se guarda coincide con lo que la sincronización leerá (mismo hash)', () => {
  const text = 'línea uno\n\nlínea dos\n' + 'x'.repeat(4500);
  const read = notionParagraphs(text).map(b => blockText(b as never)).join('\n\n');
  expect(read).toBe(notionContent(text));
 });
});
