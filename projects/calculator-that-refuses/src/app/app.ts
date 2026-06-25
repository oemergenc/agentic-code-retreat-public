import { Component } from '@angular/core';
import { DsaAppShellComponent } from '@dsa/design-system-angular';
import { CalculatorComponent } from './calculator/calculator';

@Component({
  selector: 'app-root',
  imports: [DsaAppShellComponent, CalculatorComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
