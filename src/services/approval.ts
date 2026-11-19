import { queryOptions } from '@tanstack/react-query';
import { getPendingApprovals } from '@/lib/approval.functions';
export { decideApproval } from '@/lib/approval.functions';
export const pendingApprovalsOptions = queryOptions({ queryKey: ['pending-approvals'], queryFn: () => getPendingApprovals(), refetchInterval: 30000 });