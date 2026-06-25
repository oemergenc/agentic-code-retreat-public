import { Injectable, signal, inject } from '@angular/core';
import { MoodService } from './mood.service';

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
  private readonly moodService = inject(MoodService);

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
    const rawExpr = this.displayExpression().trim();
    if (!rawExpr) return;

    // Handle compliments for mood negotiation
    if (this.moodService.isCompliment(rawExpr)) {
      this.moodService.raiseMood();
      const info = this.moodService.moodInfo();
      this.refuse(`Aww, thanks! Mood lifted to ${info.emoji} ${info.label}.`);
      return;
    }

    const expr = this.moodService.sanitizeExpression(rawExpr);

    // Déjà vu check
    if (expr === this.lastExpression) {
      this.refuse("You literally just asked me that. I'm bored.");
      return;
    }

    // Cursed numbers check
    for (const [num, msg] of Object.entries(CURSED_NUMBERS)) {
      if (new RegExp(`(?<!\\d)${num}(?!\\d)`).test(expr)) {
        this.refuse(msg);
        return;
      }
    }

    // Normalize unicode operators
    const normalized = expr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-');

    // Unlucky division by 13 check
    if (/\/\s*13(?!\d)/.test(normalized)) {
      this.refuse("Divide by thirteen? Not with my luck.");
      return;
    }

    // Check mood refusal (pre-eval: on-strike and petty checks)
    const preMoodRefusal = this.moodService.checkMoodRefusal(rawExpr);
    if (preMoodRefusal) {
      this.refuse(preMoodRefusal);
      return;
    }

    // Evaluate
    try {
      const value = this.safeEval(normalized);
      if (!isFinite(value) || isNaN(value)) {
        this.outputText.set('∞ Division by zero? Really.');
        this.state.set('error');
        return;
      }

      // Check grumpy mood refusal (post-eval: needs the result value)
      const postMoodRefusal = this.moodService.checkMoodRefusal(rawExpr, value);
      if (postMoodRefusal) {
        this.refuse(postMoodRefusal);
        return;
      }

      // Check bargain resolution
      const bargain = this.moodService.bargainExpression();
      if (bargain) {
        const bargainNorm = bargain.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
        try {
          const bargainValue = this.safeEval(bargainNorm);
          if (Math.abs(value - bargainValue) < 1e-9 && normalized.replace(/\s/g, '') === bargainNorm.replace(/\s/g, '')) {
            this.moodService.resolveBargain();
            this.refuse("Deal. Mood lifted. Now ask your original question again.");
            return;
          }
        } catch { /* ignore */ }
      }

      const formatted = this.formatResult(value);
      this.outputText.set(`= ${formatted}`);
      this.state.set('result');
      this.lastExpression = expr;
      this.moodService.onSuccessfulCalc();
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
