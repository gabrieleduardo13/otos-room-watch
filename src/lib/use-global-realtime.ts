import { useEffect } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const tableQueries = {
  consultorios: [["consultorios"], ["consultorio"]],
  historico: [["historico"], ["historico-recente"]],
  estoque_itens: [["estoque-itens"]],
  estoque_movimentacoes: [["estoque-movimentacoes"]],
} as const;

/** One shared subscription keeps every mounted view current across devices. */
export function useGlobalRealtime(queryClient: QueryClient) {
  useEffect(() => {
    const invalidate = (keys: readonly (readonly string[])[]) => {
      for (const queryKey of keys) {
        void queryClient.invalidateQueries({ queryKey });
      }
    };
    let channel = supabase.channel("otos-global-data");
    for (const [table, keys] of Object.entries(tableQueries)) {
      channel = channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => invalidate(keys),
      );
    }
    channel.subscribe((status) => {
      // Refetch after initial connection or reconnection to close the gap
      // between the initial read and subscribing (including offline edits).
      if (status === "SUBSCRIBED") {
        for (const keys of Object.values(tableQueries)) invalidate(keys);
      }
    });
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);
}