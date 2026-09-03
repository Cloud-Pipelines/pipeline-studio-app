import { useQuery } from "@tanstack/react-query";

import { Icon } from "@/components/ui/icon";
import { InlineStack } from "@/components/ui/layout";
import { Link as UILink } from "@/components/ui/link";
import { Text } from "@/components/ui/typography";
import { getExtraNavItems } from "@/config/extraNavItems";
import { userQueryOptions } from "@/hooks/useUserDetails";

interface ExtraNavItemsProps {
  className?: string;
}

/**
 * Renders the nav items a host page injects via `window.__TANGLE_EXTRA_NAV_ITEMS__`.
 *
 * Items carrying `requiresPermission` are hidden from users without it. That is
 * presentation only — whatever they link to must enforce its own access control.
 */
export function ExtraNavItems({ className }: ExtraNavItemsProps) {
  const { data: user } = useQuery(userQueryOptions);

  const items = getExtraNavItems(user?.permissions ?? []);

  return (
    <>
      {items.map((item) => (
        <UILink
          key={item.href}
          href={item.href}
          external={item.external}
          variant="block"
          size="sm"
          className={className}
        >
          <InlineStack gap="2" blockAlign="center" className="flex-1">
            {item.icon && <Icon name={item.icon} size="sm" />}
            <Text size="sm">{item.label}</Text>
          </InlineStack>
        </UILink>
      ))}
    </>
  );
}
