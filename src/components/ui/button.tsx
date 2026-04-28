import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "jelly" | "jelly-ghost" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "skeuo" | "skeuo-primary"
    size?: "default" | "sm" | "lg" | "icon" | "xl"
    asChild?: boolean
    loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "jelly", size = "default", asChild = false, loading = false, children, disabled, ...props }, ref) => {

        const baseStyles = "inline-flex items-center justify-center whitespace-nowrap text-sm font-bold tracking-tight ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-30"

        const variants = {
            jelly: "btn-jelly",
            "jelly-ghost": "btn-jelly-ghost",
            default: "btn-jelly",
            destructive: "bg-error text-white shadow-lg hover:brightness-110",
            outline: "border-2 border-border bg-transparent hover:bg-accent/10 hover:text-accent hover:border-accent",
            secondary: "btn-jelly-ghost",
            ghost: "hover:bg-accent/10 hover:text-accent",
            link: "text-accent underline-offset-4 hover:underline font-medium",
            skeuo: "btn-skeuo font-black",
            "skeuo-primary": "btn-skeuo-primary font-black",
        }

        const sizes = {
            default: "h-11 px-6 rounded-[1.25rem]",
            sm: "h-9 px-4 rounded-xl text-xs",
            lg: "h-14 px-10 rounded-[1.5rem] text-base",
            xl: "h-16 px-12 rounded-[2rem] text-lg",
            icon: "h-11 aspect-square rounded-xl",
        }

        if (asChild) {
            return (
                <Slot
                    className={cn(baseStyles, variants[variant], sizes[size], className)}
                    ref={ref as any}
                    {...props}
                >
                    {children}
                </Slot>
            )
        }

        return (
            <motion.button
                ref={ref}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={cn(baseStyles, variants[variant], sizes[size], className, loading && "cursor-wait")}
                disabled={disabled || loading}
                {...props}
            >
                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div
                            key="loader"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="flex items-center justify-center gap-2"
                        >
                            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full motion-safe:animate-spin" />
                            <span className="sr-only">Loading...</span>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="content"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center justify-center gap-2"
                        >
                            {children}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>
        )
    }
)
Button.displayName = "Button"

export { Button }
