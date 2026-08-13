import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { seedrTasksService } from '@/services/seedrTasksService';
import type { SeedrTask } from '@/types/seedr';

const TASKS_KEY = ['seedr', 'tasks'];

export function useSeedrTasks(enabled: boolean) {
  return useQuery({
    queryKey: TASKS_KEY,
    queryFn: () => seedrTasksService.list(),
    enabled,
    refetchInterval: enabled ? 10_000 : false,
    staleTime: 5_000,
  });
}

function snapshotTasks(qc: QueryClient) {
  return qc.getQueryData<SeedrTask[]>(TASKS_KEY);
}

interface MutationContext {
  previous: SeedrTask[] | undefined;
}

export function useSendToSeedr() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (torrentUrl: string) => seedrTasksService.create(torrentUrl),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TASKS_KEY });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation<void, unknown, string, MutationContext>({
    mutationFn: (id) => seedrTasksService.remove(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: TASKS_KEY });
      const previous = snapshotTasks(qc);
      qc.setQueryData<SeedrTask[]>(TASKS_KEY, (tasks) => tasks?.filter((t) => t.id !== id));
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(TASKS_KEY, ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: TASKS_KEY }),
  });
}
