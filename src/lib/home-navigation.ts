/** Only the public-home destination; the protected layout still enforces access. */
export function homeDestination(hasSession: boolean) {
 return hasSession ? '/chat' as const : null;
}