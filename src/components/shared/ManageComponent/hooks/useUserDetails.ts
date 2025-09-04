import { useSuspenseQuery } from "@tanstack/react-query";

import { getUserDetails } from "../utils/user";

export function useUserDetails() {
  return useSuspenseQuery({
    queryKey: ["user"],
    staleTime: 1000 * 60 * 60 * 0.5, // 30 minutes
    queryFn: () => getUserDetails(),
  });
}
