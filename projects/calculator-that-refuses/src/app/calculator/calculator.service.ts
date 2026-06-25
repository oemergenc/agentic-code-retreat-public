import { Injectable, signal, inject } from '@angular/core';
import { MoodService } from './mood.service';
import { I18nService } from './i18n.service';

const CURSED_NUMBER_KEYS: Record<string, string> = {
  '42': 'cursed.42',
  '666': 'cursed.666',
  '1337': 'cursed.1337',
  '9001': 'cursed.9001',
  '404': 'cursed.404',
};

export type CalculatorState = 'idle' | 'result' | 'refusal' | 'error';
export type Persona = 'default' | 'cheerleader';

const PRAISE = ['Brilliant!', 'Amazing!', 'Fantastic!', 'Superb!', 'Incredible!'];

const FUN_FACTS: Record<number, string> = {
  0:   'Zero is the only number that is neither positive nor negative.',
  1:   '1 is the only number that is its own factorial.',
  2:   '2 is the only even prime number.',
  3:   '3 is the smallest odd prime.',
  7:   '7 is considered the luckiest number in many cultures.',
  12:  '12 is the smallest abundant number.',
  42:  '42 is the Answer to Life, the Universe, and Everything.',
  73:  '73 is the 21st prime — Sheldon Cooper\'s favourite number.',
  100: '100 is a perfect square (10 × 10).',
  144: '144 is 12 squared and also a Fibonacci number.',
};

@Injectable({ providedIn: 'root' })
export class CalculatorService {
  private readonly moodService = inject(MoodService);
  private readonly i18n = inject(I18nService);

  readonly displayExpression = signal('');
  readonly outputText = signal('');
  readonly state = signal<CalculatorState>('idle');
  readonly persona = signal<Persona>('default');

  private lastExpression: string | null = null;

  setPersona(p: Persona): void {
    this.persona.set(p);
  }

  private getFunFact(value: number): string {
    const key = Math.round(value);
    return FUN_FACTS[key] ?? 'Every number has a story — this one is just getting started.';
  }

  private cheerleaderFormat(value: number): string {
    return value.toFixed(10);
  }

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

    const isCheerleader = this.persona() === 'cheerleader';

    // Handle compliments for mood negotiation
    if (!isCheerleader && this.moodService.isCompliment(rawExpr)) {
      this.moodService.raiseMood();
      const info = this.moodService.moodInfo();
      this.refuse(this.i18n.t('refusal.compliment', { emoji: info.emoji, label: info.label }));
      return;
    }

    const expr = this.moodService.sanitizeExpression(rawExpr);

    // Déjà vu check
    if (!isCheerleader && expr === this.lastExpression) {
      this.refuse(this.i18n.t('refusal.deja-vu'));
      return;
    }

    // Cursed numbers check
    if (!isCheerleader) {
      for (const [num, key] of Object.entries(CURSED_NUMBER_KEYS)) {
        if (new RegExp(`(?<!\\d)${num}(?!\\d)`).test(expr)) {
          this.refuse(this.i18n.t(key));
          return;
        }
      }
    }

    // Normalize unicode operators
    const normalized = expr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-');

    // Unlucky division by 13 check
    if (!isCheerleader && /\/\s*13(?!\d)/.test(normalized)) {
      this.refuse(this.i18n.t('refusal.unlucky-division'));
      return;
    }

    // Check mood refusal (pre-eval: on-strike and petty checks)
    if (!isCheerleader) {
      const preMoodRefusal = this.moodService.checkMoodRefusal(rawExpr);
      if (preMoodRefusal) {
        this.refuse(preMoodRefusal);
        return;
      }
    }

    // Evaluate
    try {
      const value = this.safeEval(normalized);
      if (!isFinite(value) || isNaN(value)) {
        this.outputText.set(this.i18n.t('error.division-by-zero'));
        this.state.set('error');
        return;
      }

      // Check grumpy mood refusal (post-eval: needs the result value)
      if (!isCheerleader) {
        const postMoodRefusal = this.moodService.checkMoodRefusal(rawExpr, value);
        if (postMoodRefusal) {
          this.refuse(postMoodRefusal);
          return;
        }
      }

      // Check bargain resolution
      if (!isCheerleader) {
        const bargain = this.moodService.bargainExpression();
        if (bargain) {
          const bargainNorm = bargain.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
          try {
            const bargainValue = this.safeEval(bargainNorm);
            if (Math.abs(value - bargainValue) < 1e-9 && normalized.replace(/\s/g, '') === bargainNorm.replace(/\s/g, '')) {
              this.moodService.resolveBargain();
              this.refuse(this.i18n.t('refusal.bargain-resolved'));
              return;
            }
          } catch { /* ignore */ }
        }
      }

      if (isCheerleader) {
        const praise = PRAISE[Math.floor(Math.random() * PRAISE.length)];
        const formatted = this.cheerleaderFormat(value);
        const funFact = this.getFunFact(value);
        this.outputText.set(`= ${formatted} 🎉 ${praise} Fun fact: ${funFact}`);
      } else {
        const formatted = this.i18n.formatNumber(value);
        this.outputText.set(`= ${formatted}`);
      }
      this.state.set('result');
      this.lastExpression = expr;
      this.moodService.onSuccessfulCalc();
    } catch {
      this.outputText.set(this.i18n.t('error.syntax'));
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
}
