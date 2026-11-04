import { vi } from 'vitest'

export function createTestStorage() {
  const entries = new Map<string, string>()

  return {
    getItem: vi.fn((key: string) => {
      return entries.get(key) ?? null
    }),
    setItem: vi.fn((key: string, value: string) => {
      entries.set(key, value)
    }),
    removeItem: vi.fn((key: string) => {
      entries.delete(key)
    }),
  }
}
