import { useState } from 'react'

// Mock hook for #5 coordination
export function useAlertCount() {
  const [count] = useState(0) // Replace with real logic later
  return count
}