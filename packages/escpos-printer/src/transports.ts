import net from 'node:net';

export interface IPrinterTransport {
  send(data: Buffer): Promise<void>;
  testConnection(): Promise<boolean>;
}

export class NetworkPrinterTransport implements IPrinterTransport {
  constructor(private host: string, private port: number = 9100, private timeoutMs: number = 5000) {}

  public async send(data: Buffer): Promise<void> {
    return new Promise((resolve, reject) => {
      const socket = new net.Socket();
      socket.setTimeout(this.timeoutMs);

      socket.connect(this.port, this.host, () => {
        socket.write(data, () => {
          socket.end();
          resolve();
        });
      });

      socket.on('timeout', () => {
        socket.destroy();
        reject(new Error(`Printer connection timed out at ${this.host}:${this.port}`));
      });

      socket.on('error', (err) => {
        socket.destroy();
        reject(err);
      });
    });
  }

  public async testConnection(): Promise<boolean> {
    try {
      return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(this.timeoutMs);

        socket.connect(this.port, this.host, () => {
          socket.end();
          resolve(true);
        });

        socket.on('error', () => resolve(false));
        socket.on('timeout', () => {
          socket.destroy();
          resolve(false);
        });
      });
    } catch {
      return false;
    }
  }
}

export class MockPrinterTransport implements IPrinterTransport {
  public printedBuffers: Buffer[] = [];

  public async send(data: Buffer): Promise<void> {
    this.printedBuffers.push(data);
  }

  public async testConnection(): Promise<boolean> {
    return true;
  }

  public clear(): void {
    this.printedBuffers = [];
  }
}
