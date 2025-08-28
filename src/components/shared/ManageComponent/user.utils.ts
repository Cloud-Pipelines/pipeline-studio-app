import { testGetUserDetailsApiTestGetUserDetailsGet } from "@/api/sdk.gen";

interface UserDetails {
  name: string;
  permissions: {
    read?: boolean;
    write?: boolean;
    admin?: boolean;
    [key: string]: boolean | undefined;
  };
}

function parseUserDetails(userDetailsStr: string): UserDetails | null {
  if (!userDetailsStr || typeof userDetailsStr !== "string") {
    return null;
  }

  try {
    // Check if the string starts with "UserDetails("
    if (!userDetailsStr.startsWith("UserDetails(")) {
      return null;
    }

    // Extract the content between the outer parentheses
    const match = userDetailsStr.match(/^UserDetails\((.*)\)$/);
    if (!match) {
      return null;
    }

    const content = match[1];

    // Parse name field
    const nameMatch = content.match(/name='([^']*)'|name="([^"]*)"/);
    if (!nameMatch) {
      return null;
    }
    const name = nameMatch[1] || nameMatch[2];

    // Parse permissions field
    const permissionsMatch = content.match(/permissions=\{([^}]*)\}/);
    if (!permissionsMatch) {
      // If no permissions found, return with empty permissions
      return { name, permissions: {} };
    }

    const permissionsStr = permissionsMatch[1];
    const permissions: UserDetails["permissions"] = {};

    // Parse each permission key-value pair
    const permissionPairs = permissionsStr
      .split(",")
      .map((pair) => pair.trim());

    for (const pair of permissionPairs) {
      if (!pair) continue;

      // Match both single and double quotes for keys
      const pairMatch = pair.match(
        /['"]?(\w+)['"]?\s*:\s*(True|False|true|false)/i,
      );
      if (pairMatch) {
        const key = pairMatch[1];
        const value = pairMatch[2].toLowerCase() === "true";
        permissions[key] = value;
      }
    }

    return {
      name,
      permissions,
    };
  } catch (error) {
    console.error("Failed to parse UserDetails string:", error);
    return null;
  }
}

/**
 * Get the user details from the server.
 *
 * This API is available only on a proprietary version
 * todo: figure out how to get the user details on a public version
 *
 * @returns The user details.
 */
export async function getUserDetails() {
  const user = await testGetUserDetailsApiTestGetUserDetailsGet();

  if (user?.response.status !== 200) {
    return { name: "Unknown", permissions: {} };
  }

  const userDetails = parseUserDetails(user?.data as string);

  if (!userDetails) {
    return { name: "Unknown", permissions: {} };
  }

  return userDetails;
}
