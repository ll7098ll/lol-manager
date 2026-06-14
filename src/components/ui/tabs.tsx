import * as React from "react"

const TabsContext = React.createContext<{
  value?: string
  onValueChange?: (value: string) => void
} | null>(null)

export const Tabs = ({
  value,
  onValueChange,
  children,
  className,
  ...props
}: {
  value?: string
  onValueChange?: (value: string) => void
  children?: React.ReactNode
  className?: string
  [key: string]: any
}) => {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={className} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

export const TabsList = ({
  children,
  className,
  ...props
}: {
  children?: React.ReactNode
  className?: string
  [key: string]: any
}) => {
  return (
    <div
      className={className}
      {...props}
    >
      {children}
    </div>
  )
}

export const TabsTrigger = ({
  value,
  children,
  className,
  ...props
}: {
  value: string
  children?: React.ReactNode
  className?: string
  [key: string]: any
}) => {
  const context = React.useContext(TabsContext)
  if (!context) throw new Error("TabsTrigger must be used within Tabs")

  const isActive = context.value === value

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      data-state={isActive ? "active" : "inactive"}
      onClick={() => context.onValueChange?.(value)}
      className={`${className} cursor-pointer`}
      {...props}
    >
      {children}
    </button>
  )
}

export const TabsContent = ({
  value,
  children,
  className,
  ...props
}: {
  value: string
  children?: React.ReactNode
  className?: string
  [key: string]: any
}) => {
  const context = React.useContext(TabsContext)
  if (!context) throw new Error("TabsContent must be used within Tabs")

  const isActive = context.value === value

  if (!isActive) return null

  return (
    <div
      role="tabpanel"
      data-state={isActive ? "active" : "inactive"}
      className={className}
      {...props}
    >
      {children}
    </div>
  )
}
