import * as React from "react"

// Bootstrap-based Card components
function Card({ className = "", ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={`custom-card ${className}`}
      {...props}
    />
  )
}

function CardHeader({ className = "", ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={`px-3 pt-3 ${className}`}
      {...props}
    />
  )
}

function CardTitle({ className = "", ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={`fw-semibold text-dark ${className}`}
      style={{fontSize: '0.875rem', lineHeight: 1}}
      {...props}
    />
  )
}

function CardDescription({ className = "", ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={`text-muted ${className}`}
      style={{fontSize: '0.75rem'}}
      {...props}
    />
  )
}

function CardContent({ className = "", ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={`px-3 pb-3 ${className}`}
      {...props}
    />
  )
}

function CardFooter({ className = "", ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={`d-flex align-items-center px-3 pt-3 ${className}`}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
}
