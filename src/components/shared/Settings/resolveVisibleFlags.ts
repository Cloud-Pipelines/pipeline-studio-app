import type { Flag } from "@/types/configuration";

/**
 * Drops flags whose `dependsOn` chain is not fully enabled, so a dependent flag
 * never renders as a toggle that controls an unreachable feature.
 *
 * Fails closed: a chain pointing at a missing flag, or one that cycles, hides
 * the dependent flag rather than exposing a control nothing can satisfy.
 */
export function resolveVisibleFlags(flags: Flag[]): Flag[] {
  const flagsByKey = new Map(flags.map((flag) => [flag.key, flag]));

  const hasSatisfiedDependencies = (flag: Flag) => {
    const visited = new Set([flag.key]);
    let dependencyKey = flag.dependsOn;

    while (dependencyKey) {
      if (visited.has(dependencyKey)) return false;
      visited.add(dependencyKey);

      const dependency = flagsByKey.get(dependencyKey);
      if (!dependency?.enabled) return false;

      dependencyKey = dependency.dependsOn;
    }

    return true;
  };

  return flags.filter(hasSatisfiedDependencies);
}
