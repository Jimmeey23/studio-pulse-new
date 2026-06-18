
import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-16 items-center justify-center rounded-2xl bg-white/80 backdrop-blur-xl border border-white/30 p-2 text-muted-foreground shadow-xl transition-all duration-500 hover:shadow-2xl hover:scale-[1.02]",
      className
    )}
    style={{
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1), 0 8px 16px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
    }}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-xl px-6 py-3.5 text-sm font-semibold transition-all duration-400 ease-out relative overflow-hidden group backdrop-blur-sm",
      "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
      "text-slate-600 hover:text-slate-800 hover:bg-white/60 hover:scale-105 hover:-translate-y-0.5 hover:shadow-lg border border-transparent hover:border-white/50",
      "data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-700 data-[state=active]:to-slate-900 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-blue-500/30 data-[state=active]:border-white/20 data-[state=active]:scale-105 data-[state=active]:-translate-y-1",
      "before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:via-white/40 before:to-white/20 before:opacity-0 before:transition-all before:duration-500 before:-skew-x-12 hover:before:opacity-100 data-[state=active]:before:opacity-30",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-8 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
      "animate-fade-in animate-slide-up opacity-0 [&[data-state=active]]:opacity-100 transition-all duration-500",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
