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

@Injectable({ providedIn: 'root' })
export class CalculatorService {
  private readonly moodService = inject(MoodService);
  private readonly i18n = inject(I18nService);

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
      this.refuse(this.i18n.t('refusal.compliment', { emoji: info.emoji, label: info.label }));
      return;
    }

    const expr = this.moodService.sanitizeExpression(rawExpr);

    // Déjà vu check
    if (expr === this.lastExpression) {
      this.refuse(this.i18n.t('refusal.deja-vu'));
      return;
    }

    // Cursed numbers check
    for (const [num, key] of Object.entries(CURSED_NUMBER_KEYS)) {
      if (new RegExp(`(?<!\\d)${num}(?!\\d)`).test(expr)) {
        this.refuse(this.i18n.t(key));
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
      this.refuse(this.i18n.t('refusal.unlucky-division'));
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
        this.outputText.set(this.i18n.t('error.division-by-zero'));
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
            this.refuse(this.i18n.t('refusal.bargain-resolved'));
            return;
          }
        } catch { /* ignore */ }
      }

      const formatted = this.i18n.formatNumber(value);
      this.outputText.set(`= ${formatted}`);
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
