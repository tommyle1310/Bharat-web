type Listener = () => void;

class SimpleEvent {
  private listeners: Set<Listener> = new Set();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(): void {
    this.listeners.forEach(l => {
      try {
        l();
      } catch {}
    });
  }
}

// Watchlist related events
class WatchlistEvents {
  private changed = new SimpleEvent();

  subscribe(listener: Listener): () => void {
    return this.changed.subscribe(listener);
  }

  emitChanged(): void {
    this.changed.emit();
  }
}

export const watchlistEvents = new WatchlistEvents();


