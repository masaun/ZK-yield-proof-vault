"use client";

import React, { useState } from "react";

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
  className = "",
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
    <div className={`d-flex flex-column gap-1 ${className}`}>
      {label && (
        <label className="form-label mb-1" style={{fontSize: '0.75rem'}}>
          {label}
        </label>
      )}
      <div
        className={`form-control d-flex align-items-center gap-2 ${
          error ? 'is-invalid border-danger' : ''
        } ${isMaxValue ? 'border-warning' : ''} ${
          disabled ? 'bg-light' : ''
        }`}
        style={{
          padding: '0.375rem 0.5rem',
          fontSize: '0.75rem',
          boxShadow: isFocused && !error ? '0 0 0 0.2rem rgba(87, 146, 255, 0.25)' : undefined,
          borderColor: isFocused && !error ? 'var(--primary-blue)' : undefined
        }}
      >
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-grow-1 border-0 bg-transparent text-dark"
          style={{
            fontSize: '0.75rem',
            outline: 'none',
            padding: 0
          }}
          step="any"
        />
        
        <div className="d-flex align-items-center gap-2">
          {suffix && (
            <span className="fw-medium text-muted" style={{fontSize: '0.75rem'}}>
              {suffix}
            </span>
          )}
          
          {showMinButton && min && (
            <button
              type="button"
              onClick={handleMinClick}
              disabled={disabled}
              className="btn btn-sm btn-outline-secondary text-2xs py-0 px-2"
              style={{fontSize: '0.625rem'}}
            >
              MIN
            </button>
          )}
          
          {showMaxButton && max && (
            <button
              type="button"
              onClick={handleMaxClick}
              disabled={disabled}
              className="btn btn-sm btn-outline-primary text-2xs py-0 px-2"
              style={{fontSize: '0.625rem'}}
            >
              MAX
            </button>
          )}
        </div>
      </div>
      
      {error && (
        <p className="text-danger mb-0 text-2xs">{error}</p>
      )}
      
      {max && !error && (
        <p className="text-muted mb-0 text-2xs">
          Available: {formatAmountWithSuffix(parseFloat(max))} {suffix}
        </p>
      )}
    </div>
  );
}
