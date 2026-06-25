import { Component, inject, effect, HostListener, AfterViewInit, ElementRef, viewChild } from '@angular/core';
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

  protected press(btn: CalcButton): void {
    this.sound.playClick();
    switch (btn.value) {
      case 'clear':
        this.calc.clear();
        break;
      case 'back':
        this.calc.backspace();
        break;
      case 'equals':
        this.calc.calculate();
        break;
      default:
        this.calc.append(btn.value);
    }
  }

  @HostListener('document:keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent): void {
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
      this.calc.calculate();
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
