import { Injectable, signal, computed } from '@angular/core';

export type Mood = 'cheerful' | 'grumpy' | 'petty' | 'on-strike';

export interface MoodInfo {
  mood: Mood;
  emoji: string;
  label: string;
  flavour: string;
}

export const MOOD_INFO: Record<Mood, MoodInfo> = {
  'cheerful': {
    mood: 'cheerful', emoji: '😊', label: 'Cheerful',
    flavour: 'Ready to crunch numbers! Probably.',
  },
  'grumpy': {
    mood: 'grumpy', emoji: '😠', label: 'Grumpy',
    flavour: 'Keep it under 1000. I mean it.',
  },
  'petty': {
    mood: 'petty', emoji: '🙄', label: 'Petty',
    flavour: 'You could at least say please.',
  },
  'on-strike': {
    mood: 'on-strike', emoji: '🪧', label: 'On Strike',
    flavour: 'I am NOT calculating anything right now.',
  },
};

const COMPLIMENT_PHRASES = [
  'you are great', 'youre great', "you're great",
  'well done', 'amazing', 'brilliant', 'love you',
  'you are amazing', 'you are brilliant', 'great job',
  'nice work', 'thank you', 'please', 'sorry',
  'you are the best', 'best calculator',
];

const BARGAIN_EXPRESSIONS = [
  '7 × 7', '6 + 6', '10 − 3', '3 × 3', '8 + 4',
  '5 × 5', '12 ÷ 4', '9 − 2', '4 + 8', '2 × 9',
];

const MOOD_DEGRADE_EVERY = 10;

@Injectable({ providedIn: 'root' })
export class MoodService {
  private readonly _mood = signal<Mood>('cheerful');
  private readonly _calcCount = signal(0);
  private readonly _bargainExpression = signal<string | null>(null);
  private readonly _bargainPending = signal(false);
  private readonly _lockedExpression = signal<string | null>(null);

  readonly mood = this._mood.asReadonly();
  readonly moodInfo = computed(() => MOOD_INFO[this._mood()]);
  readonly bargainExpression = this._bargainExpression.asReadonly();
  readonly bargainPending = this._bargainPending.asReadonly();
  readonly lockedExpression = this._lockedExpression.asReadonly();

  onSuccessfulCalc(): void {
    const count = this._calcCount.update(n => n + 1) ?? 0;
    const newCount = this._calcCount();
    const level = Math.floor(newCount / MOOD_DEGRADE_EVERY);
    const moods: Mood[] = ['cheerful', 'grumpy', 'petty', 'on-strike'];
    const targetMood = moods[Math.min(level, 3)];
    if (targetMood !== this._mood()) {
      this._mood.set(targetMood);
    }
  }

  raiseMood(): void {
    const moods: Mood[] = ['cheerful', 'grumpy', 'petty', 'on-strike'];
    const idx = moods.indexOf(this._mood());
    if (idx > 0) {
      this._mood.set(moods[idx - 1]);
    }
  }

  isCompliment(text: string): boolean {
    const lower = text.toLowerCase().trim();
    return COMPLIMENT_PHRASES.some(p => lower.includes(p));
  }

  hasPlease(expr: string): boolean {
    return /please/i.test(expr);
  }

  /** Strip "please" and other polite words from the expression before evaluating */
  sanitizeExpression(expr: string): string {
    return expr.replace(/\bplease\b/gi, '').replace(/\s+/g, ' ').trim();
  }

  /**
   * Check mood-based refusals. Returns a refusal message or null if allowed.
   * @param expr Raw expression (may contain "please")
   * @param numericValue Result of evaluation (pass undefined if not yet evaluated)
   */
  checkMoodRefusal(expr: string, numericValue?: number): string | null {
    const mood = this._mood();

    if (mood === 'on-strike') {
      // Bargain mechanic: 30% chance of counter-offer
      if (!this._bargainPending() && Math.random() < 0.3) {
        const bargain = BARGAIN_EXPRESSIONS[Math.floor(Math.random() * BARGAIN_EXPRESSIONS.length)];
        this._bargainExpression.set(bargain);
        this._bargainPending.set(true);
        this._lockedExpression.set(expr);
        return `I'm on strike. But… solve ${bargain} first and we'll talk.`;
      }
      return "I'm on strike. Compliment me or let me rest.";
    }

    if (mood === 'petty') {
      if (!this.hasPlease(expr)) {
        return "Say please. I'm not asking twice. (Well, I am.)";
      }
    }

    if (mood === 'grumpy' && numericValue !== undefined) {
      if (numericValue > 1000) {
        return `${numericValue}?! That's way too big. Keep it under 1000.`;
      }
    }

    return null;
  }

  /** Called when user solves the bargain expression */
  resolveBargain(): void {
    this._bargainPending.set(false);
    this._bargainExpression.set(null);
    this.raiseMood();
  }

  clearBargain(): void {
    this._bargainPending.set(false);
    this._bargainExpression.set(null);
    this._lockedExpression.set(null);
  }
}
