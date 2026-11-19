export type ApprovalStatus = 'pendiente' | 'aprobado' | 'rechazado';
export function approvalAllowsAccess(freeAccess: boolean, status: ApprovalStatus | null | undefined) {
 return freeAccess || status === 'aprobado';
}