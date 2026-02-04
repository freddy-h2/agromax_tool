"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
    {
        variants: {
            variant: {
                default:
                    "bg-[var(--background-secondary)] text-[var(--foreground)] border border-[var(--border)] hover:border-[var(--border-hover)] hover:bg-[var(--sidebar-hover)]",
                neon:
                    "bg-gradient-to-r from-[var(--neon-blue)] to-[var(--primary)] text-[var(--background)] font-semibold neon-glow hover:opacity-90",
                neonPurple:
                    "bg-gradient-to-r from-[var(--neon-purple)] to-purple-600 text-white font-semibold neon-glow-purple hover:opacity-90",
                outline:
                    "border border-[var(--border)] bg-transparent hover:bg-[var(--background-secondary)] hover:border-[var(--border-hover)]",
                ghost:
                    "hover:bg-[var(--background-secondary)] hover:text-[var(--foreground)]",
                destructive:
                    "bg-red-600 text-white hover:bg-red-700",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-9 rounded-md px-3 text-xs",
                lg: "h-11 rounded-md px-8 text-base",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean;
    animated?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, animated = true, children, ...props }, ref) => {
        const buttonClassName = cn(buttonVariants({ variant, size, className }));

        if (animated) {
            return (
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={buttonClassName}
                    {...(props as React.ComponentProps<typeof motion.button>)}
                >
                    {children}
                </motion.button>
            );
        }

        return (
            <button
                className={buttonClassName}
                ref={ref}
                {...props}
            >
                {children}
            </button>
        );
    }
);
Button.displayName = "Button";

export { Button, buttonVariants };
