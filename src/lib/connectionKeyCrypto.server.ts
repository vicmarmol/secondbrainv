import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
function key() {
 const raw = process.env['APP_USER_CONNECTION_KEY_SECRET'];
 if (!raw) throw new Error('Falta la clave de cifrado de conexiones.');
 return Buffer.from(raw, 'base64');
}
export function encryptConnectionKey(value: string) {
 const iv = randomBytes(12);
 const cipher = createCipheriv('aes-256-gcm', key(), iv);
 const ct = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
 return Buffer.concat([iv, cipher.getAuthTag(), ct]).toString('base64');
}
export function decryptConnectionKey(value: string) {
 const buf = Buffer.from(value, 'base64');
 const cipher = createDecipheriv('aes-256-gcm', key(), buf.subarray(0, 12));
 cipher.setAuthTag(buf.subarray(12, 28));
 return Buffer.concat([cipher.update(buf.subarray(28)), cipher.final()]).toString('utf8');
}