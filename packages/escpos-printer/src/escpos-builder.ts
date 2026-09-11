export type PrinterPaperWidth = '58mm' | '80mm';

export interface EscPosOptions {
  paperWidth?: PrinterPaperWidth;
  encoding?: string;
}

export class EscPosBuilder {
  private buffer: Buffer[] = [];
  private readonly maxChars: number;

  constructor(options: EscPosOptions = {}) {
    const width = options.paperWidth || '80mm';
    this.maxChars = width === '58mm' ? 32 : 48;
    this.initialize();
  }

  public getColumnWidth(): number {
    return this.maxChars;
  }

  /**
   * ESC @ - Initialize printer
   */
  public initialize(): this {
    this.buffer.push(Buffer.from([0x1b, 0x40]));
    return this;
  }

  /**
   * Text alignment: 'left' | 'center' | 'right'
   */
  public align(alignment: 'left' | 'center' | 'right'): this {
    const alignMap = { left: 0, center: 1, right: 2 };
    this.buffer.push(Buffer.from([0x1b, 0x61, alignMap[alignment]]));
    return this;
  }

  /**
   * Set bold mode on/off
   */
  public bold(enabled: boolean = true): this {
    this.buffer.push(Buffer.from([0x1b, 0x45, enabled ? 1 : 0]));
    return this;
  }

  /**
   * Set character size (1-8 for width/height multiplier)
   */
  public size(widthMult: number = 1, heightMult: number = 1): this {
    const w = Math.min(8, Math.max(1, widthMult)) - 1;
    const h = Math.min(8, Math.max(1, heightMult)) - 1;
    const n = (w << 4) | h;
    this.buffer.push(Buffer.from([0x1d, 0x21, n]));
    return this;
  }

  /**
   * Inverted white-on-black mode
   */
  public invert(enabled: boolean = true): this {
    this.buffer.push(Buffer.from([0x1d, 0x42, enabled ? 1 : 0]));
    return this;
  }

  /**
   * Append raw text string with optional newline
   */
  public text(content: string, newLine: boolean = true): this {
    this.buffer.push(Buffer.from(content, 'latin1'));
    if (newLine) {
      this.newLine();
    }
    return this;
  }

  /**
   * Print empty line(s)
   */
  public newLine(count: number = 1): this {
    for (let i = 0; i < count; i++) {
      this.buffer.push(Buffer.from([0x0a]));
    }
    return this;
  }

  /**
   * Print horizontal divider line (dashes or equals)
   */
  public rule(char: '-' | '=' | '_' = '-'): this {
    this.text(char.repeat(this.maxChars));
    return this;
  }

  /**
   * Print two columns justified: Left text and Right text (e.g. Item Name .... $25.00)
   */
  public row(left: string, right: string): this {
    const totalSpaces = this.maxChars - (left.length + right.length);
    if (totalSpaces <= 0) {
      // Left text too long, truncate or wrap
      const truncatedLeft = left.substring(0, this.maxChars - right.length - 1);
      this.text(`${truncatedLeft} ${right}`);
    } else {
      this.text(`${left}${' '.repeat(totalSpaces)}${right}`);
    }
    return this;
  }

  /**
   * Print three columns (e.g., Description, Qty, Total)
   */
  public tableRow3(col1: string, col2: string, col3: string): this {
    const col2Width = 6;
    const col3Width = 10;
    const col1Width = this.maxChars - col2Width - col3Width;

    const c1 = col1.padEnd(col1Width).substring(0, col1Width);
    const c2 = col2.padStart(col2Width).substring(0, col2Width);
    const c3 = col3.padStart(col3Width).substring(0, col3Width);

    this.text(`${c1}${c2}${c3}`);
    return this;
  }

  /**
   * Cut paper command (Full or Partial with feed)
   */
  public cut(partial: boolean = false): this {
    this.newLine(3);
    this.buffer.push(Buffer.from([0x1d, 0x56, partial ? 0x01 : 0x00]));
    return this;
  }

  /**
   * Pulse cash drawer kick pin
   */
  public kickDrawer(): this {
    this.buffer.push(Buffer.from([0x1b, 0x70, 0x00, 0x19, 0xfa]));
    return this;
  }

  /**
   * Returns the combined raw byte buffer ready for printer transmission.
   */
  public toBuffer(): Buffer {
    return Buffer.concat(this.buffer);
  }
}
