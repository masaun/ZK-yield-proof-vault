"use client";

import React, { useState } from "react";
import { cn } from "@/utils/helpers";

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  suffix?: string;
  max?: string;
  min?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  showMaxButton?: boolean;
  showMinButton?: boolean;
  className?: string;
}

function formatAmountWithSuffix(value: number): string {
  const absValue = Math.abs(value);
  if (absValue >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
  if (absValue >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (absValue >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (absValue >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return value.toFixed(2);
}

export function AmountInput({
  value,
  onChange,
  label,
  suffix,
  max,
  min,
  placeholder = "0.00",
  disabled = false,
  error,
  showMaxButton = true,
  showMinButton = false,
  className,
}: AmountInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  
  const isMaxValue = max && value && parseFloat(value) === parseFloat(max);

  const handleMaxClick = () => {
    if (max && !disabled) {
      onChange(max);
    }
  };

  const handleMinClick = () => {
    if (min && !disabled) {
      onChange(min);
    }
  };

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {label && (
        <label className="text-xs font-medium text-gray-700">
          {label}
        </label>
      )}
      <div
        className={cn(
          "relative flex items-center gap-2 rounded-md border bg-white px-2 py-1.5 transition-all duration-200",
          isFocused && !error && "border-[#5792FF] ring-2 ring-blue-200",
          error && "border-red-400",
          isMaxValue && "border-orange-400",
          !isFocused && !error && !isMaxValue && "border-gray-300",
          disabled && "bg-gray-50 cursor-not-allowed"
        )}
      >
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "flex-1 bg-transparent text-xs outline-none",
            "text-gray-900 placeholder:text-gray-400",
            disabled && "cursor-not-allowed"
          )}
          step="any"
        />
        
        <div className="flex items-center gap-1.5">
          {suffix && (
            <span className="text-xs font-medium text-gray-600">
              {suffix}
            </span>
          )}
          
          {showMinButton && min && (
            <button
              type="button"
              onClick={handleMinClick}
              disabled={disabled}
              className={cn(
                "px-1.5 py-0.5 text-2xs font-medium rounded transition-colors",
                "border border-gray-300 text-gray-700 hover:bg-gray-50",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              MIN
            </button>
          )}
          
          {showMaxButton && max && (
            <button
              type="button"
              onClick={handleMaxClick}
              disabled={disabled}
              className={cn(
                "px-1.5 py-0.5 text-2xs font-medium rounded transition-colors",
                "border border-[#5792FF] text-[#5792FF] hover:bg-blue-50",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              MAX
            </button>
          )}
        </div>
      </div>
      
      {error && (
        <p className="text-2xs text-red-600">{error}</p>
      )}
      
      {max && !error && (
        <p className="text-2xs text-gray-500">
          Available: {formatAmountWithSuffix(parseFloat(max))} {suffix}
        </p>
      )}
    </div>
  );
}
