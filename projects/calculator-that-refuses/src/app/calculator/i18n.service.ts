import { Injectable, signal, computed } from '@angular/core';

export type Locale = 'en-US' | 'de-DE';

type Messages = Record<string, string>;

const EN: Messages = {
  // Cursed numbers
  'cursed.42': "That's the answer. I forgot the question.",
  'cursed.666': "I'm not touching that. Bad vibes.",
  'cursed.1337': 'Very elite. Still no.',
  'cursed.9001': "It's over 9000! I can't even.",
  'cursed.404': 'Cooperation not found.',

  // Core refusals
  'refusal.deja-vu': "You literally just asked me that. I'm bored.",
  'refusal.unlucky-division': "Divide by thirteen? Not with my luck.",
  'refusal.compliment': 'Aww, thanks! Mood lifted to {emoji} {label}.',
  'refusal.bargain-resolved': 'Deal. Mood lifted. Now ask your original question again.',

  // Errors
  'error.division-by-zero': '∞ Division by zero? Really.',
  'error.syntax': 'Syntax error. Try harder.',

  // Mood labels
  'mood.cheerful.label': 'Cheerful',
  'mood.grumpy.label': 'Grumpy',
  'mood.petty.label': 'Petty',
  'mood.on-strike.label': 'On Strike',

  // Mood flavour
  'mood.cheerful.flavour': 'Ready to crunch numbers! Probably.',
  'mood.grumpy.flavour': 'Keep it under 1000. I mean it.',
  'mood.petty.flavour': 'You could at least say please.',
  'mood.on-strike.flavour': 'I am NOT calculating anything right now.',

  // Mood refusals
  'refusal.on-strike.bargain': "I'm on strike. But… solve {bargain} first and we'll talk.",
  'refusal.on-strike.basic': "I'm on strike. Compliment me or let me rest.",
  'refusal.petty.please': "Say please. I'm not asking twice. (Well, I am.)",
  'refusal.grumpy.too-big': "{value}?! That's way too big. Keep it under 1000.",
};

const DE: Messages = {
  // Cursed numbers
  'cursed.42': 'Das ist die Antwort. Ich habe die Frage vergessen.',
  'cursed.666': 'Das fasse ich nicht an. Schlechte Schwingungen.',
  'cursed.1337': 'Sehr elite. Trotzdem nein.',
  'cursed.9001': 'Es ist über 9000! Ich kann nicht.',
  'cursed.404': 'Kooperation nicht gefunden.',

  // Core refusals
  'refusal.deja-vu': 'Das hast du gerade erst gefragt. Ich langweile mich.',
  'refusal.unlucky-division': 'Durch dreizehn teilen? Nicht mit meinem Glück.',
  'refusal.compliment': 'Aww, danke! Stimmung gehoben auf {emoji} {label}.',
  'refusal.bargain-resolved': 'Deal. Stimmung gehoben. Stell deine ursprüngliche Frage noch einmal.',

  // Errors
  'error.division-by-zero': '∞ Division durch null? Ernsthaft.',
  'error.syntax': 'Syntaxfehler. Versuch es nochmal.',

  // Mood labels
  'mood.cheerful.label': 'Fröhlich',
  'mood.grumpy.label': 'Mürrisch',
  'mood.petty.label': 'Kleinlich',
  'mood.on-strike.label': 'Im Streik',

  // Mood flavour
  'mood.cheerful.flavour': 'Bereit zum Rechnen! Wahrscheinlich.',
  'mood.grumpy.flavour': 'Bleib unter 1000. Ich meine es ernst.',
  'mood.petty.flavour': 'Du könntest wenigstens bitte sagen.',
  'mood.on-strike.flavour': 'Ich berechne GERADE GAR NICHTS.',

  // Mood refusals
  'refusal.on-strike.bargain': 'Ich streike. Aber… löse zuerst {bargain} und wir reden.',
  'refusal.on-strike.basic': 'Ich streike. Mach mir ein Kompliment oder lass mich ruhen.',
  'refusal.petty.please': 'Sag bitte. Ich frage nicht zweimal. (Doch, tue ich.)',
  'refusal.grumpy.too-big': '{value}?! Das ist viel zu groß. Bleib unter 1000.',
};

const DICTIONARIES: Record<Locale, Messages> = { 'en-US': EN, 'de-DE': DE };

@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly locale = signal<Locale>('en-US');

  readonly localeName = computed(() => this.locale() === 'de-DE' ? 'DE 🇩🇪' : 'EN 🇬🇧');

  setLocale(locale: Locale): void {
    this.locale.set(locale);
  }

  t(key: string, params: Record<string, string> = {}): string {
    const dict = DICTIONARIES[this.locale()];
    let msg = dict[key] ?? EN[key] ?? key;
    for (const [k, v] of Object.entries(params)) {
      msg = msg.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    }
    return msg;
  }

  formatNumber(value: number): string {
    const rounded = Math.round(value * 1e10) / 1e10;
    return new Intl.NumberFormat(this.locale()).format(rounded);
  }
}
