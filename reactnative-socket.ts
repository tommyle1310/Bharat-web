import { io, Socket } from 'socket.io-client';
import { resolveBaseUrl } from '../config';

export type VehicleWinnerUpdate = {
  vehicleId: number;
  winnerBuyerId: number;
  loserBuyerId: number | null;
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

  private ensureConnected() {
    if (this.socket) return;
    const base = resolveBaseUrl();
    const url = base; // As per requirement, use resolveBaseUrl directly
    this.socket = io(url, {
      transports: ['websocket'],
      withCredentials: true,
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      if (this.buyerId != null) {
        // Try both join patterns to be compatible with backend
        this.socket?.emit('joinBuyerRoom', { buyerId: this.buyerId });
        this.socket?.emit('join', { buyerId: this.buyerId });
      }
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
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
    const handler = (payload: VehicleWinnerUpdate) => cb(payload);
    this.socket?.on('vehicle:winner:update', handler);
    return () => this.socket?.off('vehicle:winner:update', handler);
  }

  public onVehicleEndtimeUpdate(cb: (p: VehicleEndtimeUpdate) => void): Disposer {
    this.ensureConnected();
    const handler = (payload: VehicleEndtimeUpdate) => cb(payload);
    this.socket?.on('vehicle:endtime:update', handler);
    return () => this.socket?.off('vehicle:endtime:update', handler);
  }

  public onIsWinning(cb: (p: IsWinning) => void): Disposer {
    this.ensureConnected();
    const handler = (payload: IsWinning) => cb(payload);
    this.socket?.on('isWinning', handler);
    return () => this.socket?.off('isWinning', handler);
  }

  public onIsLosing(cb: (p: IsLosing) => void): Disposer {
    this.ensureConnected();
    const handler = (payload: IsLosing) => cb(payload);
    this.socket?.on('isLosing', handler);
    return () => this.socket?.off('isLosing', handler);
  }

  // Optional alias for a generic bid update event name if used elsewhere
  public onVehicleBidUpdate(cb: (p: VehicleBidUpdate) => void): Disposer {
    this.ensureConnected();
    const handler = (payload: VehicleBidUpdate) => cb(payload);
    this.socket?.on('vehicle:winner:update', handler);
    return () => this.socket?.off('vehicle:winner:update', handler);
  }
}

export const socketService = new SocketService();

// Helper to normalize incoming endtime to ISO string for reliable Date parsing across platforms
export function normalizeAuctionEnd(auctionEndDttm: string): string {
  // Convert 'YYYY-MM-DD HH:mm:ss' to ISO with Z
  if (!auctionEndDttm) return '';
  const isoLike = auctionEndDttm.replace(' ', 'T');
  const withZ = isoLike.endsWith('Z') ? isoLike : `${isoLike}Z`;
  return withZ;
}


