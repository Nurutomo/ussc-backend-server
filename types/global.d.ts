interface AmbientLightSensor extends EventTarget {
  readonly illuminance: number
  start(): void
  stop(): void
}

declare global {
  const AmbientLightSensor: {
    new (options?: { frequency?: number }): AmbientLightSensor
  }

  interface Window {
    pannellum: {
      viewer(element: HTMLElement, config: Record<string, unknown>): { destroy(): void }
    }
  }
}

export {}