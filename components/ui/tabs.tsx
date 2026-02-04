"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const Tabs = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("w-full", className)} {...props} />
))
Tabs.displayName = "Tabs"

const TabsList = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "inline-flex h-10 items-center justify-center rounded-md bg-white/5 p-1 text-foreground-muted",
            className
        )}
        {...props}
    />
))
TabsList.displayName = "TabsList"

const TabsTrigger = React.forwardRef<
    HTMLButtonElement,
    React.HTMLAttributes<HTMLButtonElement> & { value: string; activeValue?: string; setActiveValue?: (v: string) => void }
>(({ className, value, activeValue, setActiveValue, onClick, ...props }, ref) => (
    <button
        ref={ref}
        type="button"
        className={cn(
            "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
            activeValue === value
                ? "bg-neon-purple text-white shadow-sm"
                : "hover:bg-white/10 hover:text-foreground",
            className
        )}
        onClick={(e) => {
            setActiveValue?.(value);
            onClick?.(e);
        }}
        {...props}
    />
))
TabsTrigger.displayName = "TabsTrigger"

const TabsContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { value: string; activeValue?: string }
>(({ className, value, activeValue, ...props }, ref) => {
    if (value !== activeValue) return null;
    return (
        <div
            ref={ref}
            className={cn(
                "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                className
            )}
            {...props}
        />
    )
})
TabsContent.displayName = "TabsContent"

// Simplified Context-less Tabs container for manual state management if preferred, 
// or simpler implementation without context. 
// For this simple implementation, I'll rely on props passing in the parent or a simple wrapper if I were using Context.
// To keep it simple and robust without Radix, I'll export a managed version or expect props.
// BUT to match Shadcn syntax in the consumer, I will make a simple Context wrapper.

import { createContext, useContext } from "react"

const TabsContext = createContext<{ value: string; onValueChange: (v: string) => void } | null>(null)

const TabsRoot = ({ value, onValueChange, children, className }: any) => {
    return (
        <TabsContext.Provider value={{ value, onValueChange }}>
            <div className={cn("w-full", className)}>
                {children}
            </div>
        </TabsContext.Provider>
    )
}

const TabsListWrapper = ({ className, children }: any) => (
    <div className={cn("inline-flex h-10 items-center justify-center rounded-lg bg-background-secondary p-1 text-foreground-muted", className)}>
        {children}
    </div>
)

const TabsTriggerWrapper = ({ className, value, children }: any) => {
    const context = useContext(TabsContext)
    if (!context) return null
    return (
        <button
            type="button"
            className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                context.value === value
                    ? "bg-neon-purple text-white shadow-sm"
                    : "hover:bg-white/5 hover:text-foreground",
                className
            )}
            onClick={() => context.onValueChange(value)}
        >
            {children}
        </button>
    )
}

const TabsContentWrapper = ({ className, value, children }: any) => {
    const context = useContext(TabsContext)
    if (!context || context.value !== value) return null
    return (
        <div className={cn("mt-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className)}>
            {children}
        </div>
    )
}

export { TabsRoot as Tabs, TabsListWrapper as TabsList, TabsTriggerWrapper as TabsTrigger, TabsContentWrapper as TabsContent }
