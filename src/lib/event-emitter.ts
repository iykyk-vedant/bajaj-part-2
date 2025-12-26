// Simple event emitter for tag entry updates
class EventEmitter {
  private events: { [key: string]: Array<(...args: any[]) => void> } = {};

  on(event: string, callback: (...args: any[]) => void) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  off(event: string, callback: (...args: any[]) => void) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    }
  }

  emit(event: string, ...args: any[]) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(...args));
    }
  }
}

export const tagEntryEventEmitter = new EventEmitter();

export const TAG_ENTRY_EVENTS = {
  ENTRY_SAVED: 'entry_saved',
  ENTRY_UPDATED: 'entry_updated',
  ENTRY_DELETED: 'entry_deleted',
} as const;