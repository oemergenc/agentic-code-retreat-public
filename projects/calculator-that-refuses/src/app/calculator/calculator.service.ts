import { Injectable, signal } from '@angular/core';

const CURSED_NUMBERS: Record<string, string> = {
  '42': "That's the answer. I forgot the question.",
  '666': "I'm not touching that. Bad vibes.",
  '1337': 'Very elite. Still no.',
  '9001': "It's over 9000! I can't even.",
  '404': 'Cooperation not found.',
};

export type CalculatorState = 'idle' | 'result' | 'refusal' | 'error';

@Injectable({ providedIn: 'root' })
export class CalculatorService {
  readonly displayExpression = signal('');
  readonly outputText = signal('');
  readonly state = signal<CalculatorState>('idle');

  private lastExpression: string | null = null;

  append(value: string): void {
    this.displayExpression.update(d => d + value);
    this.outputText.set('');
    this.state.set('idle');
  }

  clear(): void {
    this.displayExpression.set('');
    this.outputText.set('');
    this.state.set('idle');
    this.lastExpression = null;
  }

  backspace(): void {
    this.displayExpression.update(d => d.slice(0, -1));
    this.outputText.set('');
    this.state.set('idle');
  }

  calculate(): void {
    const expr = this.displayExpression().trim();
    if (!expr) return;

    // Déjà vu check
    if (expr === this.lastExpression) {
      this.refuse("You literally just asked me that. I'm bored.");
      return;
    }

    // Cursed numbers check (match whole numbers, not substrings of larger ones)
    for (const [num, msg] of Object.entries(CURSED_NUMBERS)) {
      if (new RegExp(`(?<!\\d)${num}(?!\\d)`).test(expr)) {
        this.refuse(msg);
        return;
      }
    }

    // Normalize unicode operators for evaluation
    const normalized = expr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-');

    // Unlucky division by 13 check
    if (/\/\s*13(?!\d)/.test(normalized)) {
      this.refuse("Divide by thirteen? Not with my luck.");
      return;
    }

    // Evaluate
    try {
      const value = this.safeEval(normalized);
      if (!isFinite(value) || isNaN(value)) {
        this.outputText.set('∞ Division by zero? Really.');
        this.state.set('error');
      } else {
        const formatted = this.formatResult(value);
        this.outputText.set(`= ${formatted}`);
        this.state.set('result');
        this.lastExpression = expr;
      }
    } catch {
      this.outputText.set('Syntax error. Try harder.');
      this.state.set('error');
    }
  }

  private refuse(msg: string): void {
    this.outputText.set(msg);
    this.state.set('refusal');
    this.lastExpression = null;
  }

  private safeEval(expr: string): number {
    if (!/^[\d\s+\-*/.()\^]+$/.test(expr)) {
      throw new Error('Invalid characters');
    }
    // eslint-disable-next-line no-new-func
    return new Function(`return (${expr})`)() as number;
  }

  private formatResult(value: number): string {
    const rounded = Math.round(value * 1e10) / 1e10;
    return String(rounded);
  }
}
