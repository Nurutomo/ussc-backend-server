/// <reference types="vite/client" />

declare global {
  interface Window {
    pannellum: {
      viewer: (element: HTMLElement, config: Record<string, unknown>) => {
        destroy: () => void
      }
    }
  }
}

export {}
