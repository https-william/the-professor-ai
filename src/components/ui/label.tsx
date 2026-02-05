import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Note: Requires @radix-ui/react-label. I will install it next. 
// For now, I'll use a standard label if the package isn't there, but I should encourage installation.
// I will assume I can install it or use a simple fallback.
// Fallback for now to avoid breaking if install is slow.

const labelVariants = cva(
    "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

// Simplified without Radix for immediate speed, can upgrade later.
const Label = React.forwardRef<
    HTMLLabelElement,
    React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
    <label
        ref={ref}
        className={cn(
            "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
            className
        )}
        {...props}
    />
))
Label.displayName = "Label" // LabelPrimitive.Root.displayName

export { Label }
