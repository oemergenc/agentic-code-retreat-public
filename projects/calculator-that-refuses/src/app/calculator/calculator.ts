import { Component, inject, effect, HostListener, AfterViewInit, ElementRef, viewChild, signal, computed } from '@angular/core';
import { DsaButtonComponent } from '@dsa/design-system-angular/button';
import { DsaToggleSwitchComponent } from '@dsa/design-system-angular/toggle-switch';
import { DsaToastService } from '@dsa/design-system-angular';
import { CalculatorService } from './calculator.service';
import { SoundService } from './sound.service';
import { MoodService } from './mood.service';
import { I18nService, Locale } from './i18n.service';

interface CalcButton {
  label: string;
  value: string;
  type: 'digit' | 'operator' | 'action' | 'equals';
  wide?: boolean;
}

const DIGIT_BUTTON_INDICES = [4, 5, 6, 8, 9, 10, 12, 13, 14, 16, 17];

const MISCHIEF_TOOLTIPS = [
  'Are you sure?', 'This button is tired.', 'Maybe not.',
  "I wouldn't.", 'Hmm.', 'Bold choice.', 'You again?',
  'This button has feelings.', '...really?', 'Ok fine.',
  'No guarantees.', 'Noted. Ignored.', 'Have you tried turning it off?',
];

@Component({
  selector: 'app-calculator',
  imports: [DsaButtonComponent, DsaToggleSwitchComponent],
  templateUrl: './calculator.html',
  styleUrl: './calculator.scss',
})
export class CalculatorComponent implements AfterViewInit {
  protected readonly calc = inject(CalculatorService);
  protected readonly mood = inject(MoodService);
  protected readonly i18n = inject(I18nService);
  private readonly toast = inject(DsaToastService);
  private readonly sound = inject(SoundService);
  private readonly calcWrapper = viewChild<ElementRef>('calcWrapper');

  // mood negotiate input
  protected readonly negotiateText = signal('');
  private breakTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly BREAK_RAISE_DELAY = 30_000;

  // existing mischief
  protected readonly equalsOffset = signal({ x: 0, y: 0 });
  protected readonly swapMap = signal<Record<number, string>>({});
  protected readonly popupVisible = signal(false);
  protected readonly popupCountdown = signal(5);
  protected readonly fakeOutput = signal<string | null>(null);
  private pressCount = 0;
  private calcCount = 0;
  private popupTimer: ReturnType<typeof setInterval> | null = null;

  // new disturbing features
  protected readonly mischiefEnabled = signal(true);
  protected readonly drunkLevel = signal(0);
  protected readonly isNapping = signal(false);
  protected readonly isSpinning = signal(false);
  protected readonly isGhostFlash = signal(false);
  protected readonly corruptedDisplay = signal<string | null>(null);
  protected readonly tooltip = signal<{ idx: number; text: string } | null>(null);

  private napTimer: ReturnType<typeof setTimeout> | null = null;
  private ghostTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly NAP_DELAY = 15_000;

  protected readonly buttons: CalcButton[] = [
    { label: 'C', value: 'clear', type: 'action' },
    { label: '⌫', value: 'back', type: 'action' },
    { label: '(', value: '(', type: 'operator' },
    { label: ')', value: ')', type: 'operator' },
    { label: '7', value: '7', type: 'digit' },
    { label: '8', value: '8', type: 'digit' },
    { label: '9', value: '9', type: 'digit' },
    { label: '÷', value: '÷', type: 'operator' },
    { label: '4', value: '4', type: 'digit' },
    { label: '5', value: '5', type: 'digit' },
    { label: '6', value: '6', type: 'digit' },
    { label: '×', value: '×', type: 'operator' },
    { label: '1', value: '1', type: 'digit' },
    { label: '2', value: '2', type: 'digit' },
    { label: '3', value: '3', type: 'digit' },
    { label: '−', value: '−', type: 'operator' },
    { label: '0', value: '0', type: 'digit', wide: true },
    { label: '.', value: '.', type: 'digit' },
    { label: '+', value: '+', type: 'operator' },
    { label: '=', value: 'equals', type: 'equals' },
  ];

  protected readonly cButtonScale = computed(() => {
    if (!this.mischiefEnabled()) return 1;
    const len = this.calc.displayExpression().length;
    return Math.max(0.4, 1 - len * 0.04);
  });

  protected readonly displayText = computed(() => {
    return this.corruptedDisplay() ?? this.calc.displayExpression();
  });

  protected getLabel(btn: CalcButton, idx: number): string {
    return this.swapMap()[idx] ?? btn.label;
  }

  constructor() {
    effect(() => {
      const state = this.calc.state();
      if (state === 'result') {
        this.sound.playResult();
        this.toast.success({
          title: '✨ Calculated!',
          description: this.calc.outputText(),
          timeout: 2500,
        });
      } else if (state === 'refusal') {
        this.sound.playRefusal();
      } else if (state === 'error') {
        this.sound.playError();
      }
    });
    this.resetNapTimer();
    this.resetBreakTimer();
  }

  ngAfterViewInit(): void {
    this.calcWrapper()?.nativeElement.focus();
  }

  private resetBreakTimer(): void {
    if (this.breakTimer) clearTimeout(this.breakTimer);
    this.breakTimer = setTimeout(() => {
      const before = this.mood.mood();
      this.mood.raiseMood();
      const after = this.mood.mood();
      if (before !== after) {
        this.toast.info({ title: `☕ Rested!`, description: `Mood lifted to ${this.mood.moodInfo().emoji} ${this.mood.moodInfo().label}`, timeout: 3000 });
      }
      this.resetBreakTimer();
    }, this.BREAK_RAISE_DELAY);
  }

  protected submitNegotiate(): void {
    const text = this.negotiateText().trim();
    if (!text) return;
    this.calc.append(text);
    this.calc.calculate();
    this.negotiateText.set('');
  }

  private resetNapTimer(): void {
    if (this.napTimer) clearTimeout(this.napTimer);
    if (!this.mischiefEnabled()) return;
    this.napTimer = setTimeout(() => this.isNapping.set(true), this.NAP_DELAY);
  }

  protected wakeUp(): void {
    this.isNapping.set(false);
    this.resetNapTimer();
    this.calcWrapper()?.nativeElement.focus();
  }

  protected toggleMischief(enabled: boolean): void {
    this.mischiefEnabled.set(enabled);
    if (!enabled) {
      // reset all mischief state
      this.drunkLevel.set(0);
      this.isNapping.set(false);
      this.isSpinning.set(false);
      this.isGhostFlash.set(false);
      this.corruptedDisplay.set(null);
      this.tooltip.set(null);
      this.equalsOffset.set({ x: 0, y: 0 });
      if (this.napTimer) { clearTimeout(this.napTimer); this.napTimer = null; }
      if (this.ghostTimer) { clearTimeout(this.ghostTimer); this.ghostTimer = null; }
    } else {
      this.resetNapTimer();
    }
  }

  protected switchLocale(locale: Locale): void {
    this.i18n.setLocale(locale);
  }

  protected onEqualsHover(): void {
    if (!this.mischiefEnabled()) return;
    const x = (Math.random() - 0.5) * 180;
    const y = (Math.random() - 0.5) * 80;
    this.equalsOffset.set({ x, y });
  }

  protected onEqualsLeave(): void {
    this.equalsOffset.set({ x: 0, y: 0 });
  }

  protected onBtnHover(idx: number): void {
    if (!this.mischiefEnabled()) return;
    if (Math.random() < 0.35) {
      const text = MISCHIEF_TOOLTIPS[Math.floor(Math.random() * MISCHIEF_TOOLTIPS.length)];
      this.tooltip.set({ idx, text });
    }
  }

  protected onBtnLeave(): void {
    this.tooltip.set(null);
  }

  protected press(btn: CalcButton, idx: number): void {
    if (this.isNapping()) { this.wakeUp(); return; }
    this.sound.playClick();
    this.tooltip.set(null);
    this.resetNapTimer();
    this.resetBreakTimer();
    this.pressCount++;

    if (this.mischiefEnabled()) {
      this.drunkLevel.set(Math.min(3, Math.floor(this.pressCount / 10)));
      if (this.pressCount % 7 === 0) this.doSwap();
    }

    switch (btn.value) {
      case 'clear':
        this.calc.clear();
        this.swapMap.set({});
        this.corruptedDisplay.set(null);
        break;
      case 'back':
        this.calc.backspace();
        break;
      case 'equals':
        this.equalsOffset.set({ x: 0, y: 0 });
        this.pressEquals();
        break;
      default: {
        const swapped = this.swapMap()[idx];
        this.calc.append(swapped ?? btn.value);
        if (this.mischiefEnabled()) {
          this.maybeGhostType();
          this.maybeCorruptDisplay();
        }
      }
    }
  }

  private maybeGhostType(): void {
    if (Math.random() < 0.15 && !this.ghostTimer) {
      this.ghostTimer = setTimeout(() => {
        const ghost = String(Math.floor(Math.random() * 9) + 1);
        this.isGhostFlash.set(true);
        this.calc.append(ghost);
        setTimeout(() => this.isGhostFlash.set(false), 300);
        this.ghostTimer = null;
      }, 700);
    }
  }

  private maybeCorruptDisplay(): void {
    if (Math.random() < 0.2) {
      const expr = this.calc.displayExpression();
      if (!expr) return;
      const pos = Math.floor(Math.random() * expr.length);
      if (/\d/.test(expr[pos])) {
        const corrupted = expr.substring(0, pos) + String((parseInt(expr[pos]) + 1) % 10) + expr.substring(pos + 1);
        this.corruptedDisplay.set(corrupted);
        setTimeout(() => this.corruptedDisplay.set(null), 600);
      }
    }
  }

  private pressEquals(): void {
    if (this.mischiefEnabled() && Math.random() < 0.3) {
      this.showFakeResult();
    } else {
      this.doRealCalculate();
    }
  }

  private showFakeResult(): void {
    const fakeNum = Math.floor(Math.random() * 9000) + 100;
    this.fakeOutput.set(`= ${fakeNum}`);
    setTimeout(() => {
      this.fakeOutput.set('Just kidding. 😈');
      setTimeout(() => {
        this.fakeOutput.set(null);
        this.doRealCalculate();
      }, 600);
    }, 800);
  }

  private doRealCalculate(): void {
    this.calc.calculate();
    if (this.calc.state() === 'result' && this.mischiefEnabled()) {
      this.calcCount++;
      if (Math.random() < 0.15) {
        this.isSpinning.set(true);
        setTimeout(() => this.isSpinning.set(false), 700);
      }
      if (this.calcCount % 3 === 0) this.showBreakPopup();
    }
  }

  private doSwap(): void {
    const i1 = DIGIT_BUTTON_INDICES[Math.floor(Math.random() * DIGIT_BUTTON_INDICES.length)];
    let i2 = DIGIT_BUTTON_INDICES[Math.floor(Math.random() * DIGIT_BUTTON_INDICES.length)];
    while (i2 === i1) i2 = DIGIT_BUTTON_INDICES[Math.floor(Math.random() * DIGIT_BUTTON_INDICES.length)];
    const label1 = this.swapMap()[i1] ?? this.buttons[i1].label;
    const label2 = this.swapMap()[i2] ?? this.buttons[i2].label;
    const val1 = this.buttons[i1].value;
    const val2 = this.buttons[i2].value;
    this.swapMap.update(m => ({ ...m, [i1]: label2, [i2]: label1 }));
    this.buttons[i1] = { ...this.buttons[i1], value: val2 };
    this.buttons[i2] = { ...this.buttons[i2], value: val1 };
  }

  private showBreakPopup(): void {
    this.popupCountdown.set(5);
    this.popupVisible.set(true);
    this.popupTimer = setInterval(() => {
      this.popupCountdown.update(n => {
        if (n <= 1) { this.dismissPopup(); return 0; }
        return n - 1;
      });
    }, 1000);
  }

  protected dismissPopup(): void {
    this.popupVisible.set(false);
    if (this.popupTimer) { clearInterval(this.popupTimer); this.popupTimer = null; }
  }

  @HostListener('document:keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent): void {
    if (this.isNapping()) { this.wakeUp(); return; }
    if (this.popupVisible()) return;
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    this.resetNapTimer();

    const key = event.key;
    if (/^[0-9]$/.test(key) || key === '.') {
      event.preventDefault(); this.sound.playClick(); this.calc.append(key);
    } else if (key === '+') {
      event.preventDefault(); this.sound.playClick(); this.calc.append('+');
    } else if (key === '-') {
      event.preventDefault(); this.sound.playClick(); this.calc.append('−');
    } else if (key === '*') {
      event.preventDefault(); this.sound.playClick(); this.calc.append('×');
    } else if (key === '/') {
      event.preventDefault(); this.sound.playClick(); this.calc.append('÷');
    } else if (key === '(' || key === ')') {
      event.preventDefault(); this.sound.playClick(); this.calc.append(key);
    } else if (key === 'Enter' || key === '=') {
      event.preventDefault(); this.pressEquals();
    } else if (key === 'Backspace') {
      event.preventDefault(); this.sound.playClick(); this.calc.backspace();
    } else if (key === 'Escape' || key === 'Delete') {
      event.preventDefault(); this.sound.playClick(); this.calc.clear();
    }
  }
}
