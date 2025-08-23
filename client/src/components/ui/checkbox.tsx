import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-6 w-6 shrink-0 rounded-md border-2 ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
      // Unchecked states
      "border-gray-300 bg-white shadow-sm",
      "[data-theme='dark'] &:not([data-state='checked']):border-gray-500 [data-theme='dark'] &:not([data-state='checked']):bg-gray-800",
      // Checked states - MAXIMUM VISUAL IMPACT
      "data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 data-[state=checked]:text-white data-[state=checked]:shadow-2xl data-[state=checked]:shadow-green-500/60 data-[state=checked]:scale-110 data-[state=checked]:ring-4 data-[state=checked]:ring-green-400/30",
      "[data-theme='dark'] &[data-state='checked']:bg-green-500 [data-theme='dark'] &[data-state='checked']:border-green-500 [data-theme='dark'] &[data-state='checked']:shadow-2xl [data-theme='dark'] &[data-state='checked']:shadow-green-400/70 [data-theme='dark'] &[data-state='checked']:ring-green-300/40",
      // Hover states
      "hover:border-green-500 hover:shadow-lg hover:scale-105",
      "[data-theme='dark'] &:hover:border-green-400",
      "data-[state=checked]:hover:bg-green-700 data-[state=checked]:hover:border-green-700 data-[state=checked]:hover:scale-115 data-[state=checked]:hover:shadow-3xl data-[state=checked]:hover:shadow-green-500/80",
      "[data-theme='dark'] &[data-state='checked']:hover:bg-green-400 [data-theme='dark'] &[data-state='checked']:hover:border-green-400 [data-theme='dark'] &[data-state='checked']:hover:shadow-green-300/90",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current animate-in zoom-in-95 duration-300 ease-out")}
    >
      <Check className="h-5 w-5 stroke-[5] drop-shadow-lg animate-pulse" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }