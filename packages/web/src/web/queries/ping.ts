import { useQuery } from "@tanstack/react-query";
import { orpc } from "../lib/api";

export function usePing() {
  return useQuery(orpc.ping.queryOptions());
}
