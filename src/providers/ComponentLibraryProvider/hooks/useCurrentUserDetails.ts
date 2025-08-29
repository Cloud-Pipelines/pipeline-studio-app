import { useSuspenseQuery } from "@tanstack/react-query";

// todo: move to utils
import { getUserDetails } from "@/components/shared/ManageComponent/user.utils";

export const useCurrentUserDetails = () => {
  return useSuspenseQuery({
    queryKey: ["user"],
    staleTime: 1000 * 60 * 60 * 0.5, // 30 minutes
    queryFn: () => getUserDetails(),
  });
};
