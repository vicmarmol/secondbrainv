import { queryOptions } from '@tanstack/react-query';
import { getInvitePanel } from '@/lib/invites.functions';
export { manageInviteCode } from '@/lib/invites.functions';
export const invitePanelOptions = queryOptions({ queryKey: ['admin-invites'], queryFn: () => getInvitePanel(), refetchInterval: 30000 });