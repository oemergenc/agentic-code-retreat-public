## Why

The calculator currently has a single personality — a grumpy, refusal-prone calculator. The curveballs spec requires a second, switchable "Cheerleader" persona that skips all refusals and over-delivers on results with praise and fun facts, proving that personality is cleanly separable from the math engine.

## What Changes

- Add a `persona` signal (`'default' | 'cheerleader'`) to `CalculatorService`
- In `cheerleader` mode, bypass all refusal checks (cursed numbers, déjà vu, unlucky division, mood)
- In `cheerleader` mode, format results with 10 fixed decimal places, prepend praise, and append a fun fact
- Add a persona toggle button to the calculator UI
- Add a small hardcoded fun-facts map (10 entries + fallback)

## Capabilities

### New Capabilities

- `cheerleader-persona`: Switchable calculator personality that never refuses, pads decimals to 10 places, praises the user, and appends a fun fact about the result

### Modified Capabilities

- `calculator-core`: Refusal logic in `CalculatorService.calculate()` must be gated on the active persona so it can be bypassed without being removed

## Impact

- `projects/calculator-that-refuses/src/app/calculator/calculator.service.ts` — persona signal, guarded refusal checks, cheerleader result formatting
- `projects/calculator-that-refuses/src/app/calculator/calculator.ts` — persona toggle wiring
- `projects/calculator-that-refuses/src/app/calculator/calculator.html` — persona toggle button UI
- No new dependencies; no API or breaking changes
