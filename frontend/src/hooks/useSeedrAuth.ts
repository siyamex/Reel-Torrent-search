import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import { quotaService } from '@/services/quotaService';

export function useSeedrStatus() {
  return useQuery({
    queryKey: ['seedr', 'status'],
    queryFn: () => authService.getStatus(),
    staleTime: 1000 * 60,
    retry: false,
  });
}

export function useSeedrQuota(enabled: boolean) {
  return useQuery({
    queryKey: ['seedr', 'quota'],
    queryFn: () => quotaService.getQuota(),
    enabled,
    staleTime: 1000 * 60,
    retry: 1,
  });
}

export function useDisconnectSeedr() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => authService.disconnectSeedr(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seedr'] });
    },
  });
}

export function useConnectSeedr() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authService.connectSeedr(email, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seedr'] });
    },
  });
}
