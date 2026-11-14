import { describe, expect, it } from 'vitest';
import { blockText, contentHash, documentChange, MAX_NOTION_PAGES, SUMMARY_LENGTH, discoverySchema } from './notion';
describe('Reglas de Notion', () => {
 it('revisa como máximo 50 páginas por sincronización', () => expect(MAX_NOTION_PAGES).toBe(50));
 it('limita el resumen a 300 caracteres', () => expect('x'.repeat(400).slice(0, SUMMARY_LENGTH).length).toBe(300));
 it('omite un documento excluido aunque cambie el contenido', () => expect(documentChange({ excluded: true, content_hash: 'old' }, 'new')).toBe('skip'));
 it('no toca documentos cuya huella no ha cambiado', () => expect(documentChange({ excluded: false, content_hash: 'same' }, 'same')).toBe('skip'));
 it('actualiza documentos existentes con una huella distinta', () => expect(documentChange({ excluded: false, content_hash: 'old' }, 'new')).toBe('update'));
 it('inserta páginas que no existen', () => expect(documentChange(null, 'new')).toBe('insert'));
 it('extrae los tipos de texto solicitados', () => {
  for (const type of ['paragraph', 'heading_1', 'heading_2', 'heading_3', 'bulleted_list_item', 'numbered_list_item', 'to_do', 'quote', 'code']) expect(blockText({ type, [type]: { rich_text: [{ plain_text: 'Texto' }] } })).toBe('Texto');
 });
 it('ignora imágenes y tipos no solicitados', () => expect(blockText({ type: 'image', image: { rich_text: [{ plain_text: 'no' }] } })).toBeNull());
 it('calcula una huella estable que detecta cambios', async () => { expect(await contentHash('hola')).toBe(await contentHash('hola')); expect(await contentHash('hola')).not.toBe(await contentHash('adiós')); });
 it('persiste las páginas pendientes y las colecciones entre sincronizaciones', () => { const state = discoverySchema.parse({ cursor: 'next', sources: [{ id: 'table', cursor: 'row-next' }], seen: ['page'] }); expect(discoverySchema.parse(JSON.parse(JSON.stringify(state)))).toEqual(state); });
});