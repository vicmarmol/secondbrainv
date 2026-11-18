import type { SourceConnector } from './types';
import { notionConnector } from '../notion-connector.server';

// Add a new source by writing its connector and listing it here. Nothing else changes.
const connectors: SourceConnector[] = [notionConnector];

export const registeredSources = connectors.map(c => c.source);
export function connectorFor(source: string) { return connectors.find(c => c.source === source) ?? null; }
