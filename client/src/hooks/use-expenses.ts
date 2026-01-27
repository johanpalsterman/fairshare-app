import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type CreateExpenseRequest } from "@shared/schema";

export function useExpenses(groupId: number) {
  return useQuery({
    queryKey: [api.expenses.list.path, groupId],
    queryFn: async () => {
      const url = buildUrl(api.expenses.list.path, { groupId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch expenses");
      return api.expenses.list.responses[200].parse(await res.json());
    },
    enabled: !!groupId,
  });
}

export function useCreateExpense(groupId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<CreateExpenseRequest, "groupId" | "paidBy">) => {
      const url = buildUrl(api.expenses.create.path, { groupId });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create expense");
      return api.expenses.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.expenses.list.path, groupId] });
      queryClient.invalidateQueries({ queryKey: [api.settlements.list.path, groupId] }); // Expenses change settlements likely
    },
  });
}

export function useDeleteExpense(groupId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.expenses.delete.path, { id });
      const res = await fetch(url, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete expense");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.expenses.list.path, groupId] });
    },
  });
}
