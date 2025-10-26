import React from 'react'

export default function Logo({ size = 44 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="g1" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#06b6d4" />
          <stop offset="1" stopColor="#0ea5a4" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="12" fill="url(#g1)" />
      <path d="M16 36c6-12 18-12 24 0" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10 44c8-10 20-10 28 0" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" opacity="0.8"/>
    </svg>
  )
}
