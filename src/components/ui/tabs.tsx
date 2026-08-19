import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Two visual variants. `default` is the pill-style segmented control used
 * throughout Tangle. `panel` is an underlined, layout-filling tab strip whose
 * content panel can host a growing scroll region (chat, iframe) and which keeps
 * `forceMount`ed inactive panels hidden so they preserve their own state.
 */
type TabsVariant = "default" | "panel";

const TabsVariantContext = React.createContext<TabsVariant>("default");

const tabsVariants = cva("", {
  variants: {
    variant: {
      default: "flex flex-col gap-2",
      panel: "flex min-h-0 min-w-0 flex-1 flex-col",
    },
  },
  defaultVariants: { variant: "default" },
});

const tabsListVariants = cva("", {
  variants: {
    variant: {
      default:
        "bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-0.75",
      panel:
        "flex shrink-0 items-center gap-1 overflow-x-auto overflow-y-hidden border-b border-border px-2 subtle-scrollbar",
    },
  },
  defaultVariants: { variant: "default" },
});

const tabsTriggerVariants = cva("", {
  variants: {
    variant: {
      default:
        "data-[state=active]:bg-background dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 cursor-pointer",
      panel:
        "inline-flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-t-md border-b-2 border-transparent px-3 py-1.5 text-xs font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-primary data-[state=active]:text-foreground",
    },
  },
  defaultVariants: { variant: "default" },
});

const tabsContentVariants = cva("", {
  variants: {
    variant: {
      default: "flex-1 outline-none",
      panel:
        "min-h-0 min-w-0 flex-1 outline-none data-[state=active]:flex data-[state=active]:flex-col data-[state=inactive]:hidden",
    },
  },
  defaultVariants: { variant: "default" },
});

function Tabs({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root> &
  VariantProps<typeof tabsVariants>) {
  return (
    <TabsVariantContext.Provider value={variant ?? "default"}>
      <TabsPrimitive.Root
        data-slot="tabs"
        className={cn(tabsVariants({ variant }), className)}
        {...props}
      />
    </TabsVariantContext.Provider>
  );
}

function TabsList({
  className,
  variant,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) {
  const inherited = React.useContext(TabsVariantContext);
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        tabsListVariants({ variant: variant ?? inherited }),
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  variant,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger> &
  VariantProps<typeof tabsTriggerVariants>) {
  const inherited = React.useContext(TabsVariantContext);
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        tabsTriggerVariants({ variant: variant ?? inherited }),
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  variant,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content> &
  VariantProps<typeof tabsContentVariants>) {
  const inherited = React.useContext(TabsVariantContext);
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn(
        tabsContentVariants({ variant: variant ?? inherited }),
        className,
      )}
      {...props}
    />
  );
}

export { Tabs, TabsContent, TabsList, TabsTrigger };
