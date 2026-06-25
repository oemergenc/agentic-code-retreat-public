## 1. Service — Persona Signal & Fun Facts

- [x] 1.1 Add `Persona` type (`'default' | 'cheerleader'`) and `persona` signal to `CalculatorService`
- [x] 1.2 Add `setPersona(p: Persona)` public method to `CalculatorService`
- [x] 1.3 Add hardcoded `FUN_FACTS: Record<number, string>` constant (10 entries) and `getFunFact(value: number)` helper with fallback
- [x] 1.4 Add `cheerleaderFormat(value: number): string` helper that returns `value.toFixed(10)`

## 2. Service — Gated Refusal Logic

- [x] 2.1 Wrap the compliment/mood-raise early-return in `calculate()` with `if (this.persona() !== 'cheerleader')`
- [x] 2.2 Wrap the déjà-vu check with `if (this.persona() !== 'cheerleader')`
- [x] 2.3 Wrap the cursed-numbers loop with `if (this.persona() !== 'cheerleader')`
- [x] 2.4 Wrap the unlucky-division check with `if (this.persona() !== 'cheerleader')`
- [x] 2.5 Wrap both pre-eval and post-eval mood refusal checks with `if (this.persona() !== 'cheerleader')`
- [x] 2.6 Wrap the bargain-resolution check with `if (this.persona() !== 'cheerleader')`

## 3. Service — Cheerleader Result Path

- [x] 3.1 After successful evaluation, branch on persona: if `cheerleader`, build output as `= <toFixed(10)> 🎉 <praise>! Fun fact: <getFunFact(value)>`; otherwise use existing `i18n.formatNumber()` path

## 4. Component & Template — Persona Toggle

- [x] 4.1 Inject `CalculatorService` persona signal into `CalculatorComponent` (already injected as `calc`)
- [x] 4.2 Add a persona toggle button (or toggle switch) to `calculator.html` that calls `calc.setPersona(...)` on change
- [x] 4.3 Visually indicate active persona (e.g., button label shows "😇 Default" / "📣 Cheerleader")

## 5. Verification

- [x] 5.1 Verify `2 + 3 × 4` → `14` under both personas
- [x] 5.2 Verify `10 ÷ 4` → `2.5000000000` with praise + fun fact under Cheerleader
- [x] 5.3 Verify `4 + 69` computes to `73` with praise + fun fact under Cheerleader (no refusal)
- [x] 5.4 Verify `42 × 2` is refused under Default but computes `84` under Cheerleader
- [x] 5.5 Run existing tests to confirm no regressions (`ng test`)
