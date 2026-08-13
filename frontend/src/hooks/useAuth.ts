import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userAuthService } from '@/services/userAuthService';

const ME_KEY = ['auth', 'me'];

export function useCurrentUser() {
  return useQuery({
    queryKey: ME_KEY,
    queryFn: () => userAuthService.me(),
    staleTime: 1000 * 60,
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      userAuthService.login(username, password),
    onSuccess: (user) => {
      queryClient.setQueryData(ME_KEY, user);
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      userAuthService.register(username, password),
    onSuccess: (user) => {
      queryClient.setQueryData(ME_KEY, user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => userAuthService.logout(),
    onSuccess: () => {
      queryClient.setQueryData(ME_KEY, null);
      queryClient.clear();
    },
  });
}
