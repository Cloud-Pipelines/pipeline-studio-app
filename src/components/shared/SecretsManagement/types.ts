import type {
  DynamicDataArgument,
  SecretArgument,
} from "@/utils/componentSpec";

export interface Secret {
  id: string;
  name: string;
  value?: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  description?: string;
}

export function isValidSecretName(name: string): boolean {
  return name.trim().length > 0;
}

export function isValidSecretValue(value: string): boolean {
  return value.length > 0;
}

function isSecretDynamicData(
  dynamicData: DynamicDataArgument["dynamicData"],
): dynamicData is SecretArgument {
  return "secret" in dynamicData;
}

export function createSecretArgument(secretName: string): DynamicDataArgument {
  return { dynamicData: { secret: { name: secretName } } };
}

export function extractSecretName(arg: DynamicDataArgument): string | null {
  if (isSecretDynamicData(arg.dynamicData)) {
    return arg.dynamicData.secret.name;
  }
  return null;
}

/**
 * Query keys for React Query.
 */
export const SecretsQueryKeys = {
  All: () => ["secrets"] as const,
  Id: (id: string) => ["secrets", id] as const,
} as const;
