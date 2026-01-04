/**
 * Tests for EventBus implementation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventBus } from '../../../src/kernel/events.js';

describe('EventBus', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
  });

  describe('on', () => {
    it('should register event handler', () => {
      const handler = vi.fn();
      eventBus.on('test', handler);
      expect(eventBus.listenerCount('test')).toBe(1);
    });

    it('should allow multiple handlers for same event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      eventBus.on('test', handler1);
      eventBus.on('test', handler2);
      expect(eventBus.listenerCount('test')).toBe(2);
    });

    it('should not duplicate same handler', () => {
      const handler = vi.fn();
      eventBus.on('test', handler);
      eventBus.on('test', handler);
      // Set doesn't allow duplicates
      expect(eventBus.listenerCount('test')).toBe(1);
    });
  });

  describe('off', () => {
    it('should remove event handler', () => {
      const handler = vi.fn();
      eventBus.on('test', handler);
      eventBus.off('test', handler);
      expect(eventBus.listenerCount('test')).toBe(0);
    });

    it('should not throw when removing non-existent handler', () => {
      const handler = vi.fn();
      expect(() => eventBus.off('test', handler)).not.toThrow();
    });

    it('should not throw when removing from non-existent event', () => {
      const handler = vi.fn();
      expect(() => eventBus.off('nonexistent', handler)).not.toThrow();
    });

    it('should remove event from map when last handler is removed', () => {
      const handler = vi.fn();
      eventBus.on('test', handler);
      eventBus.off('test', handler);
      expect(eventBus.eventNames()).not.toContain('test');
    });

    it('should keep other handlers when one is removed', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      eventBus.on('test', handler1);
      eventBus.on('test', handler2);
      eventBus.off('test', handler1);
      expect(eventBus.listenerCount('test')).toBe(1);
    });
  });

  describe('emit', () => {
    it('should call handler with data', () => {
      const handler = vi.fn();
      eventBus.on('test', handler);
      eventBus.emit('test', { value: 42 });
      expect(handler).toHaveBeenCalledWith({ value: 42 });
    });

    it('should call all handlers for event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      eventBus.on('test', handler1);
      eventBus.on('test', handler2);
      eventBus.emit('test', 'data');
      expect(handler1).toHaveBeenCalledWith('data');
      expect(handler2).toHaveBeenCalledWith('data');
    });

    it('should not throw when emitting non-existent event', () => {
      expect(() => eventBus.emit('nonexistent')).not.toThrow();
    });

    it('should emit without data', () => {
      const handler = vi.fn();
      eventBus.on('test', handler);
      eventBus.emit('test');
      expect(handler).toHaveBeenCalledWith(undefined);
    });

    it('should catch and log errors in handlers', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const errorHandler = () => {
        throw new Error('Handler error');
      };
      const normalHandler = vi.fn();

      eventBus.on('test', errorHandler);
      eventBus.on('test', normalHandler);

      expect(() => eventBus.emit('test', 'data')).not.toThrow();
      expect(consoleSpy).toHaveBeenCalled();
      expect(normalHandler).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('once', () => {
    it('should call handler only once', () => {
      const handler = vi.fn();
      eventBus.once('test', handler);

      eventBus.emit('test', 'first');
      eventBus.emit('test', 'second');

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith('first');
    });

    it('should remove handler after first call', () => {
      const handler = vi.fn();
      eventBus.once('test', handler);
      eventBus.emit('test');
      expect(eventBus.listenerCount('test')).toBe(0);
    });
  });

  describe('removeAllListeners', () => {
    it('should remove all listeners for specific event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      eventBus.on('test', handler1);
      eventBus.on('test', handler2);
      eventBus.on('other', vi.fn());

      eventBus.removeAllListeners('test');

      expect(eventBus.listenerCount('test')).toBe(0);
      expect(eventBus.listenerCount('other')).toBe(1);
    });

    it('should remove all listeners for all events when no event specified', () => {
      eventBus.on('event1', vi.fn());
      eventBus.on('event2', vi.fn());
      eventBus.on('event3', vi.fn());

      eventBus.removeAllListeners();

      expect(eventBus.eventNames()).toHaveLength(0);
    });
  });

  describe('listenerCount', () => {
    it('should return 0 for non-existent event', () => {
      expect(eventBus.listenerCount('nonexistent')).toBe(0);
    });

    it('should return correct count', () => {
      eventBus.on('test', vi.fn());
      eventBus.on('test', vi.fn());
      expect(eventBus.listenerCount('test')).toBe(2);
    });
  });

  describe('eventNames', () => {
    it('should return empty array when no events', () => {
      expect(eventBus.eventNames()).toEqual([]);
    });

    it('should return all event names', () => {
      eventBus.on('event1', vi.fn());
      eventBus.on('event2', vi.fn());
      eventBus.on('event3', vi.fn());

      const names = eventBus.eventNames();
      expect(names).toContain('event1');
      expect(names).toContain('event2');
      expect(names).toContain('event3');
      expect(names).toHaveLength(3);
    });
  });
});
