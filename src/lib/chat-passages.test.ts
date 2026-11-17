import { describe, expect, it } from 'vitest';
import { buildDocumentContext, selectPassages, splitPassages } from './chat-passages';
describe('document passages', () => {
 it('sends short documents whole, including their final roadmap', () => {
  const content = 'Introducción\n\n' + 'a'.repeat(5600) + '\n\nRoadmap: funcionalidades añadidas hoy';
  expect(selectPassages(content, 'lo último sobre product builder', '"product builder"')).toBe(content);
 });
 it('selects relevant late passages instead of truncating the beginning', () => {
  const content = ('texto inicial irrelevante '.repeat(400)) + '\n\n# Roadmap\nFuncionalidades: suscripciones, pagos y facturación.';
  const selected = selectPassages(content, '¿qué funcionalidades de pagos hay en el roadmap?', '"pagos" OR "roadmap"');
  expect(selected).toContain('Funcionalidades: suscripciones, pagos y facturación.');
  expect(selected.length).toBeLessThanOrEqual(6000);
 });
 it('splits long blocks into passages around 800 characters', () => { expect(splitPassages('palabra '.repeat(1000)).every(p => p.text.length <= 800)).toBe(true); });
 it('caps document text at 6000 and combined text at 15000', () => {
  const docs = Array.from({length:8},(_,i)=>({document_id:String(i),excerpt:'fallback'}));
  const contents = new Map(docs.map(d=>[d.document_id,'tema '.repeat(3000)]));
  const result = buildDocumentContext(docs,contents,'tema','"tema"');
  expect(result.every(d=>d.excerpt.length<=6000)).toBe(true);
  expect(result.reduce((n,d)=>n+d.excerpt.length,0)).toBeLessThanOrEqual(15000);
  expect(result.reduce((n,d)=>n+d.excerpt.length,0)).toBeGreaterThan(10000);
 });
 it('keeps title and modification date and separates selected passages', () => {
  const doc={document_id:'1',excerpt:'old',title:'Product Builder',modified_at:'2026-11-17T17:58:00Z'};
  const [result]=buildDocumentContext([doc],new Map([['1','roadmap '.repeat(1200)]]),'roadmap','"roadmap"');
  expect(result?.title).toBe('Product Builder'); expect(result?.modified_at).toBe('2026-11-17T17:58:00Z');
  expect(result?.excerpt).toContain('\n\n--- PASAJE ---\n\n');
 });
});