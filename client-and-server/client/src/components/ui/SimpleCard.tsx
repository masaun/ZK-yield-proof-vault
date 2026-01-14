"use client";

import React, { useState } from "react";

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
  className = "",
  headerAction,
}: SimpleCardProps) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  return (
    <div className={`custom-card p-3 mb-3 ${className}`}>
      <div 
        className={`d-flex align-items-center mb-2 ${collapsible ? 'cursor-pointer' : ''}`}
        onClick={() => collapsible && setCollapsed(!collapsed)}
      >
        {collapsible && (
          <span className="text-muted me-2" style={{fontSize: '0.875rem'}}>
            {collapsed ? "▼" : "▲"}
          </span>
        )}
        <h3 className="fw-semibold flex-grow-1 mb-0" style={{fontSize: '0.875rem'}}>{title}</h3>
        {headerAction && <div>{headerAction}</div>}
      </div>
      {!collapsed && (
        <div>
          {children}
        </div>
      )}
    </div>
  );
}
