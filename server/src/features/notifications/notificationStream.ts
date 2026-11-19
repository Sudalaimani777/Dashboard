// server/src/features/notifications/notificationStream.ts
import type { Response } from 'express';

export class NotificationStreamRegistry {
  private clients = new Map<string, Set<Response>>();
  private pingInterval: NodeJS.Timeout | null = null;

  constructor(autoStartHeartbeat: boolean = true) {
    if (autoStartHeartbeat) {
      this.startHeartbeat(25000);
    }
  }

  addClient(userId: string, res: Response): void {
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId)!.add(res);
  }

  removeClient(userId: string, res: Response): void {
    const userClients = this.clients.get(userId);
    if (userClients) {
      userClients.delete(res);
      if (userClients.size === 0) {
        this.clients.delete(userId);
      }
    }
  }

  broadcastToUser(userId: string, data: any): void {
    const userClients = this.clients.get(userId);
    if (!userClients || userClients.size === 0) return;

    const payload = `data: ${JSON.stringify(data)}\n\n`;
    for (const client of userClients) {
      try {
        client.write(payload);
      } catch (err) {
        // Drop faulty client on socket error
        this.removeClient(userId, client);
      }
    }
  }

  pingAll(): void {
    for (const [userId, clientSet] of this.clients.entries()) {
      for (const client of clientSet) {
        try {
          client.write(': ping\n\n');
        } catch (err) {
          this.removeClient(userId, client);
        }
      }
    }
  }

  startHeartbeat(intervalMs: number = 25000): void {
    this.stopHeartbeat();
    this.pingInterval = setInterval(() => {
      this.pingAll();
    }, intervalMs);

    if (this.pingInterval.unref) {
      this.pingInterval.unref();
    }
  }

  stopHeartbeat(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  getClientCount(userId?: string): number {
    if (userId) {
      return this.clients.get(userId)?.size ?? 0;
    }
    let total = 0;
    for (const set of this.clients.values()) {
      total += set.size;
    }
    return total;
  }

  hasClient(userId: string): boolean {
    return (this.clients.get(userId)?.size ?? 0) > 0;
  }
}

export const sseRegistry = new NotificationStreamRegistry();
