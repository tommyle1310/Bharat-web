import { io, Socket } from 'socket.io-client';

export type VehicleWinnerUpdate = {
  vehicleId: number;
  winnerBuyerId: number;
  loserBuyerId: number | null;
  auctionEndDttm?: string; // Optional end time update
};

export type VehicleEndtimeUpdate = {
  vehicleId: number;
  auctionEndDttm: string; // e.g. '2025-10-14 04:05:45'
};

export type IsWinning = {
  vehicleId: number;
};

export type IsLosing = {
  vehicleId: number;
};

// Optional alias if backend emits a generic bid update
export type VehicleBidUpdate = VehicleWinnerUpdate;

type Disposer = () => void;

class SocketService {
  private socket: Socket | null = null;
  private buyerId: number | null = null;
  private isConnected = false;
  private baseUrl = 'http://13.203.1.159:1310'; // Update with your actual backend URL

  private ensureConnected() {
    if (this.socket) return;
    
    this.socket = io(this.baseUrl, {
      transports: ['websocket'],
      withCredentials: true,
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log('Socket connected');
      if (this.buyerId != null) {
        // Try both join patterns to be compatible with backend
        this.socket?.emit('joinBuyerRoom', { buyerId: this.buyerId });
        this.socket?.emit('join', { buyerId: this.buyerId });
      }
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      console.log('Socket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }

  public setBuyerId(buyerId?: number | null) {
    this.buyerId = buyerId ?? null;
    this.ensureConnected();
    if (this.isConnected && this.buyerId != null) {
      this.socket?.emit('joinBuyerRoom', { buyerId: this.buyerId });
      this.socket?.emit('join', { buyerId: this.buyerId });
    }
  }

  public onVehicleWinnerUpdate(cb: (p: VehicleWinnerUpdate) => void): Disposer {
    this.ensureConnected();
    const handler = (payload: VehicleWinnerUpdate) => {
      console.log('Vehicle winner update received:', payload);
      cb(payload);
    };
    this.socket?.on('vehicle:winner:update', handler);
    return () => this.socket?.off('vehicle:winner:update', handler);
  }

  public onVehicleEndtimeUpdate(cb: (p: VehicleEndtimeUpdate) => void): Disposer {
    this.ensureConnected();
    const handler = (payload: VehicleEndtimeUpdate) => {
      console.log('Vehicle endtime update received:', payload);
      cb(payload);
    };
    this.socket?.on('vehicle:endtime:update', handler);
    return () => this.socket?.off('vehicle:endtime:update', handler);
  }

  public onIsWinning(cb: (p: IsWinning) => void): Disposer {
    this.ensureConnected();
    const handler = (payload: IsWinning) => {
      console.log('Is winning received:', payload);
      cb(payload);
    };
    this.socket?.on('isWinning', handler);
    return () => this.socket?.off('isWinning', handler);
  }

  public onIsLosing(cb: (p: IsLosing) => void): Disposer {
    this.ensureConnected();
    const handler = (payload: IsLosing) => {
      console.log('Is losing received:', payload);
      cb(payload);
    };
    this.socket?.on('isLosing', handler);
    return () => this.socket?.off('isLosing', handler);
  }

  // Optional alias for a generic bid update event name if used elsewhere
  public onVehicleBidUpdate(cb: (p: VehicleBidUpdate) => void): Disposer {
    this.ensureConnected();
    const handler = (payload: VehicleBidUpdate) => {
      console.log('Vehicle bid update received:', payload);
      cb(payload);
    };
    this.socket?.on('vehicle:winner:update', handler);
    return () => this.socket?.off('vehicle:winner:update', handler);
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }
}

export const socketService = new SocketService();

// Helper to normalize incoming endtime to ISO string for reliable Date parsing across platforms
export function normalizeAuctionEnd(auctionEndDttm: string): string {
  // Normalize variants like 'YYYY-MM-DD HH:mm:ss' or 'YYYY-MM-DD\u00A012:00:00' to ISO-like.
  // Also pass through already-ISO strings like 'YYYY-MM-DDTHH:mm:ssZ' or with timezone offsets.
  if (!auctionEndDttm) return '';

  const trimmed = String(auctionEndDttm).trim();
  console.log('normalizeAuctionEnd input:', trimmed);

  // Handle 'DD-MMM-YYYY HH:mm:ss AM/PM' (e.g., '08-Oct-2025 05:20:00 PM')
  // Convert to 'YYYY-MM-DDTHH:mm:ssZ' (assume incoming time is UTC if no TZ given)
  const m = /^(\d{2})-([A-Za-z]{3})-(\d{4})[\s\u00A0]+(\d{1,2}):(\d{2}):(\d{2})[\s\u00A0]*([AP]M)$/i.exec(trimmed);
  if (m) {
    console.log('DD-MMM-YYYY format matched:', m);
    const day = m[1];
    const monAbbr = m[2].toLowerCase();
    const year = m[3];
    let hour = parseInt(m[4], 10);
    const minute = m[5];
    const second = m[6];
    const ampm = m[7].toUpperCase();
    const monthMap: Record<string, string> = {
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
    };
    const month = monthMap[monAbbr];
    if (month) {
      if (ampm === 'AM') {
        if (hour === 12) hour = 0; // 12:xx AM -> 00:xx
      } else {
        if (hour !== 12) hour += 12; // 1-11 PM -> +12
      }
      const hourStr = String(hour).padStart(2, '0');
      const result = `${year}-${month}-${day}T${hourStr}:${minute}:${second}Z`;
      console.log('DD-MMM-YYYY converted to:', result);
      return result;
    }
  }

  // Replace any whitespace (including NBSP) between date and time with 'T' if 'T' is not already present
  const hasTSeparator = trimmed.includes('T');
  const ensuredT = hasTSeparator
    ? trimmed
    : trimmed.replace(/(\d{4}-\d{2}-\d{2})[\s\u00A0]+(\d{2}:\d{2}:\d{2}(?:\.\d+)??)/, '$1T$2');

  // If there's already a timezone designator (Z or +hh:mm / -hh:mm), return as is. Otherwise, assume UTC and append Z
  const hasTimezone = /[Zz]$|[+-]\d{2}:\d{2}$/.test(ensuredT);
  const result = hasTimezone ? ensuredT : `${ensuredT}Z`;
  console.log('Final normalized result:', result);
  return result;
}

// Helper to convert IST time to milliseconds for countdown
export function getIstEndMs(istTimeString: string): number {
  // IST is UTC+5:30, so we need to adjust the time
  const date = new Date(istTimeString);
  // Add 5.5 hours to convert IST to UTC, then get milliseconds
  return date.getTime() + (5.5 * 60 * 60 * 1000);
}
