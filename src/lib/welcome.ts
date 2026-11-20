export type WelcomeCounts = { activeConnections: number; documents: number };

/** Sample, excluded and inaccessible documents all count; disconnected/coming-soon rows do not. */
export function needsWelcome(counts: WelcomeCounts) {
 return counts.activeConnections === 0 && counts.documents === 0;
}