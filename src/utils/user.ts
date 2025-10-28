import { getCurrentUserApiUsersMeGet } from "@/api/sdk.gen";
import type { GetUserResponse } from "@/api/types.gen";

/**
 * Get the user details from the server.
 *
 * @returns The user details.
 */
export async function getUserDetails() {
  const user = await getCurrentUserApiUsersMeGet();

  if (user?.response.status !== 200) {
    return { id: "Unknown", permissions: [] } as GetUserResponse;
  }

  return user.data;
}
