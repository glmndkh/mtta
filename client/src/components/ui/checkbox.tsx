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
      "peer h-6 w-6 shrink-0 rounded-md border-2 ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      // Unchecked states
      "border-gray-400 bg-white shadow-sm",
      "[data-theme='dark'] &:not([data-state='checked']):border-gray-400 [data-theme='dark'] &:not([data-state='checked']):bg-gray-800",
      // Checked states - very prominent
      "data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 data-[state=checked]:text-white data-[state=checked]:shadow-lg data-[state=checked]:shadow-green-500/30",
      "[data-theme='dark'] &[data-state='checked']:bg-green-500 [data-theme='dark'] &[data-state='checked']:border-green-500 [data-theme='dark'] &[data-state='checked']:shadow-green-400/40",
      // Hover states
      "hover:border-green-500 hover:shadow-md",
      "[data-theme='dark'] &:hover:border-green-400",
      "data-[state=checked]:hover:bg-green-700 data-[state=checked]:hover:border-green-700",
      "[data-theme='dark'] &[data-state='checked']:hover:bg-green-400 [data-theme='dark'] &[data-state='checked']:hover:border-green-400",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current animate-in zoom-in-75 duration-150")}
    >
      <Check className="h-4 w-4 stroke-[4] drop-shadow-sm" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }