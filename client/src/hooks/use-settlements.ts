import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertSettlement } from "@shared/schema";

export function useSettlements(groupId: number) {
  return useQuery({
    queryKey: [api.settlements.list.path, groupId],
    queryFn: async () => {
      const url = buildUrl(api.settlements.list.path, { groupId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch settlements");
      return api.settlements.list.responses[200].parse(await res.json());
    },
    enabled: !!groupId,
  });
}

export function useCreateSettlement(groupId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<InsertSettlement, "groupId" | "fromUserId">) => {
      const url = buildUrl(api.settlements.create.path, { groupId });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to record settlement");
      return api.settlements.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.settlements.list.path, groupId] });
    },
  });
}
