"use client";

import React, { useState } from "react";
import { cn } from "@/utils/helpers";

interface SimpleCardProps {
  title: string;
  children: React.ReactNode;
  initialCollapsed?: boolean;
  collapsible?: boolean;
  className?: string;
  headerAction?: React.ReactNode;
}

export function SimpleCard({
  title,
  children,
  initialCollapsed = false,
  collapsible = false,
  className,
  headerAction,
}: SimpleCardProps) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  return (
    <div
      className={cn(
        "text-xs bg-white text-gray-900 rounded-lg shadow-md p-4 mb-4 transition-shadow duration-300 hover:shadow-lg",
        className
      )}
    >
      <div className="flex items-center cursor-pointer mb-2" onClick={() => collapsible && setCollapsed(!collapsed)}>
        {collapsible && (
          <span className="text-gray-600 mr-2">
            {collapsed ? "▼" : "▲"}
          </span>
        )}
        <h3 className="text-sm font-semibold flex-1">{title}</h3>
        {headerAction && <div>{headerAction}</div>}
      </div>
      <div
        className={cn(
          "transition-all duration-300",
          collapsed ? "hidden" : "block"
        )}
      >
        {children}
      </div>
    </div>
  );
}
