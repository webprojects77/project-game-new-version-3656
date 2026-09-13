import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";

export function useTopScores() {
  return useQuery(orpc.scores.top.queryOptions({ staleTime: 15_000 }));
}

export function useSubmitScore() {
  const queryClient = useQueryClient();
  return useMutation(
    orpc.scores.submit.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: orpc.scores.key() }),
    }),
  );
}
