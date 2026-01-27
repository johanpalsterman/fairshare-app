import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useSubscription() {
  return useQuery({
    queryKey: [api.subscription.get.path],
    queryFn: async () => {
      const res = await fetch(api.subscription.get.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch subscription");
      return res.json();
    },
  });
}

export function useUpgradeSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.subscription.upgrade.path, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to upgrade");
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      } else {
        queryClient.invalidateQueries({ queryKey: [api.subscription.get.path] });
      }
    },
  });
}

export function useOpenCustomerPortal() {
  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/subscription/portal', {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to open portal");
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });
}
