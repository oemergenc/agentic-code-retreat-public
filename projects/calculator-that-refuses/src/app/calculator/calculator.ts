import { Component, inject, effect, HostListener, AfterViewInit, ElementRef, viewChild, signal, computed } from '@angular/core';
import { DsaButtonComponent } from '@dsa/design-system-angular/button';
import { DsaToastService } from '@dsa/design-system-angular';
import { CalculatorService } from './calculator.service';
import { SoundService } from './sound.service';

interface CalcButton {
  label: string;
  value: string;
  type: 'digit' | 'operator' | 'action' | 'equals';
  wide?: boolean;
}

const DIGIT_BUTTON_INDICES = [4, 5, 6, 8, 9, 10, 12, 13, 14, 16, 17]; // indices of digit buttons in the array

@Component({
  selector: 'app-calculator',
  imports: [DsaButtonComponent],
  templateUrl: './calculator.html',
  styleUrl: './calculator.scss',
})
export class CalculatorComponent implements AfterViewInit {
  protected readonly calc = inject(CalculatorService);
  private readonly toast = inject(DsaToastService);
  private readonly sound = inject(SoundService);
  private readonly calcWrapper = viewChild<ElementRef>('calcWrapper');

  // --- mischief state ---
  protected readonly equalsOffset = signal({ x: 0, y: 0 });
  protected readonly swapMap = signal<Record<number, string>>({});
  protected readonly popupVisible = signal(false);
  protected readonly popupCountdown = signal(5);
  protected readonly fakeOutput = signal<string | null>(null);
  private pressCount = 0;
  private calcCount = 0;
  private popupTimer: ReturnType<typeof setInterval> | null = null;

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

  // Shrinking C button: shrinks as expression grows
  protected readonly cButtonScale = computed(() => {
    const len = this.calc.displayExpression().length;
    return Math.max(0.4, 1 - len * 0.04);
  });

  // Displayed label (with possible swap applied)
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
  }

  ngAfterViewInit(): void {
    this.calcWrapper()?.nativeElement.focus();
  }

  // --- Moving = button ---
  protected onEqualsHover(): void {
    const x = (Math.random() - 0.5) * 180;
    const y = (Math.random() - 0.5) * 80;
    this.equalsOffset.set({ x, y });
  }

  protected onEqualsLeave(): void {
    this.equalsOffset.set({ x: 0, y: 0 });
  }

  // --- Button press handler ---
  protected press(btn: CalcButton, idx: number): void {
    this.sound.playClick();
    this.pressCount++;

    // Every 7 presses, swap two random digit buttons
    if (this.pressCount % 7 === 0) {
      this.doSwap();
    }

    switch (btn.value) {
      case 'clear':
        this.calc.clear();
        this.swapMap.set({});
        break;
      case 'back':
        this.calc.backspace();
        break;
      case 'equals':
        this.equalsOffset.set({ x: 0, y: 0 });
        this.pressEquals();
        break;
      default: {
        // Use swapped value if this button was swapped
        const swapped = this.swapMap()[idx];
        this.calc.append(swapped ?? btn.value);
      }
    }
  }

  private pressEquals(): void {
    // 30% chance of fake result
    if (Math.random() < 0.3) {
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
    if (this.calc.state() === 'result') {
      this.calcCount++;
      if (this.calcCount % 3 === 0) {
        this.showBreakPopup();
      }
    }
  }

  // --- Random button swap ---
  private doSwap(): void {
    const i1 = DIGIT_BUTTON_INDICES[Math.floor(Math.random() * DIGIT_BUTTON_INDICES.length)];
    let i2 = DIGIT_BUTTON_INDICES[Math.floor(Math.random() * DIGIT_BUTTON_INDICES.length)];
    while (i2 === i1) {
      i2 = DIGIT_BUTTON_INDICES[Math.floor(Math.random() * DIGIT_BUTTON_INDICES.length)];
    }
    const label1 = this.swapMap()[i1] ?? this.buttons[i1].label;
    const label2 = this.swapMap()[i2] ?? this.buttons[i2].label;
    const val1 = this.swapMap()[i1] ?? this.buttons[i1].value;
    const val2 = this.swapMap()[i2] ?? this.buttons[i2].value;
    this.swapMap.update(m => ({ ...m, [i1]: label2, [i2]: label1 }));
    // Also swap values so typing still works
    this.buttons[i1] = { ...this.buttons[i1], value: val2 };
    this.buttons[i2] = { ...this.buttons[i2], value: val1 };
  }

  // --- Unsolicited break popup ---
  private showBreakPopup(): void {
    this.popupCountdown.set(5);
    this.popupVisible.set(true);
    this.popupTimer = setInterval(() => {
      this.popupCountdown.update(n => {
        if (n <= 1) {
          this.dismissPopup();
          return 0;
        }
        return n - 1;
      });
    }, 1000);
  }

  protected dismissPopup(): void {
    this.popupVisible.set(false);
    if (this.popupTimer) {
      clearInterval(this.popupTimer);
      this.popupTimer = null;
    }
  }

  @HostListener('document:keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent): void {
    if (this.popupVisible()) return; // block keyboard when popup is showing
    if (event.altKey || event.ctrlKey || event.metaKey) return;

    const key = event.key;
    if (/^[0-9]$/.test(key) || key === '.') {
      event.preventDefault();
      this.sound.playClick();
      this.calc.append(key);
    } else if (key === '+') {
      event.preventDefault();
      this.sound.playClick();
      this.calc.append('+');
    } else if (key === '-') {
      event.preventDefault();
      this.sound.playClick();
      this.calc.append('−');
    } else if (key === '*') {
      event.preventDefault();
      this.sound.playClick();
      this.calc.append('×');
    } else if (key === '/') {
      event.preventDefault();
      this.sound.playClick();
      this.calc.append('÷');
    } else if (key === '(' || key === ')') {
      event.preventDefault();
      this.sound.playClick();
      this.calc.append(key);
    } else if (key === 'Enter' || key === '=') {
      event.preventDefault();
      this.pressEquals();
    } else if (key === 'Backspace') {
      event.preventDefault();
      this.sound.playClick();
      this.calc.backspace();
    } else if (key === 'Escape' || key === 'Delete') {
      event.preventDefault();
      this.sound.playClick();
      this.calc.clear();
    }
  }
}
