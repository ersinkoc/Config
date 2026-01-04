/**
 * Event bus for inter-plugin communication.
 */

import type { PluginEventHandler } from '../types.js';

/**
 * Event bus implementation for handling events and listeners.
 */
export class EventBus implements EventBus {
  private handlers = new Map<string, Set<PluginEventHandler>>();

  /**
   * Subscribes to an event.
   *
   * @param event - Event name
   * @param handler - Event handler function
   *
   * @example
   * ```typescript
   * eventBus.on('config:loaded', (data) => {
   *   console.log('Config loaded:', data);
   * });
   * ```
   */
  on(event: string, handler: PluginEventHandler): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
  }

  /**
   * Unsubscribes from an event.
   *
   * @param event - Event name
   * @param handler - Event handler function
   *
   * @example
   * ```typescript
   * eventBus.off('config:loaded', handler);
   * ```
   */
  off(event: string, handler: PluginEventHandler): void {
    const eventHandlers = this.handlers.get(event);
    if (eventHandlers) {
      eventHandlers.delete(handler);
      if (eventHandlers.size === 0) {
        this.handlers.delete(event);
      }
    }
  }

  /**
   * Emits an event.
   *
   * @param event - Event name
   * @param data - Event data
   *
   * @example
   * ```typescript
   * eventBus.emit('config:loaded', { config: myConfig });
   * ```
   */
  emit(event: string, data?: unknown): void {
    const eventHandlers = this.handlers.get(event);
    if (eventHandlers) {
      for (const handler of eventHandlers) {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for '${event}':`, error);
        }
      }
    }
  }

  /**
   * Subscribes to an event once.
   *
   * @param event - Event name
   * @param handler - Event handler function
   *
   * @example
   * ```typescript
   * eventBus.once('config:loaded', (data) => {
   *   console.log('Config loaded once:', data);
   * });
   * ```
   */
  once(event: string, handler: PluginEventHandler): void {
    const onceHandler = (data: unknown) => {
      handler(data);
      this.off(event, onceHandler);
    };
    this.on(event, onceHandler);
  }

  /**
   * Removes all listeners for an event or all events.
   *
   * @param event - Event name (optional)
   *
   * @example
   * ```typescript
   * // Remove all listeners for a specific event
   * eventBus.removeAllListeners('config:loaded');
   *
   * // Remove all listeners for all events
   * eventBus.removeAllListeners();
   * ```
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.handlers.delete(event);
    } else {
      this.handlers.clear();
    }
  }

  /**
   * Gets the number of listeners for an event.
   *
   * @param event - Event name
   * @returns Number of listeners
   *
   * @example
   * ```typescript
   * const count = eventBus.listenerCount('config:loaded');
   * ```
   */
  listenerCount(event: string): number {
    const eventHandlers = this.handlers.get(event);
    return eventHandlers ? eventHandlers.size : 0;
  }

  /**
   * Gets all event names with listeners.
   *
   * @returns Array of event names
   *
   * @example
   * ```typescript
   * const events = eventBus.eventNames();
   * ```
   */
  eventNames(): string[] {
    return Array.from(this.handlers.keys());
  }
}
