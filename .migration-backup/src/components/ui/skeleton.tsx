import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200",
        "animate-pulse",
        "after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/50 after:to-transparent",
        "after:animate-[shimmer_2.5s_ease-in-out_infinite]",
        className
      )}
      style={{
        backgroundSize: '200% 100%',
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite, shimmer 2.5s ease-in-out infinite',
        ...props.style,
      }}
      {...props}
    />
  )
}

export { Skeleton }
