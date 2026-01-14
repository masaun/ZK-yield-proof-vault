'use client'

import { useState } from 'react'

export function CopyButton({ label, content }: { label: string; content: string }) {
  const [copied, setCopied] = useState(false)

  const handleClick = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (e) {
      console.error('Failed to copy:', e)
    }
  }

  return (
    <button
      className="btn btn-sm btn-secondary mt-2"
      style={{fontSize: '0.75rem'}}
      onClick={handleClick}
    >
      {copied ? 'Copied!' : `Copy ${label}`}
    </button>
  )
}
