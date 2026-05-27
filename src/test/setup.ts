import '@testing-library/jest-dom'

// Mock ResizeObserver for AutoTextarea component (only in jsdom)
if (typeof window !== 'undefined') {
  class MockResizeObserver {
    constructor(_callback: ResizeObserverCallback) {}
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    value: MockResizeObserver,
  })
}
