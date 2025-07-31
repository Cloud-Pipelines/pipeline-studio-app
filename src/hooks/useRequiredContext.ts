import type { Context } from "react";
import { createContext, useContext } from "react";

type RequiredContext<T> = Context<T> & { displayName: string };

export function createRequiredContext<T>(
  name: string,
): RequiredContext<T | null | undefined> {
  const context = createContext(null);
  context.displayName = name;
  return context as RequiredContext<T | null | undefined>;
}

export function useRequiredContext<T>(
  ctx: RequiredContext<T>,
): Exclude<T, null | undefined> {
  const context = useContext(ctx);

  if (context == null) {
    throw new Error(`Required context ${ctx.displayName} was not found`);
  }

  return context as Exclude<T, null | undefined>;
}
