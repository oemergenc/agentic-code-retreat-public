## Context

The calculator (`CalculatorService`) currently has a single hard-coded personality: it refuses certain inputs (cursed numbers, déjà vu, unlucky division, bad mood) and formats results via `I18nService.formatNumber()`. All refusal logic is inline inside `calculate()` as sequential early-return guards.

The curveball spec requires a second switchable persona — "The Cheerleader" — that never refuses, pads results to 10 decimal places, praises the user, and appends a fun fact. This proves personality is separable from math.

## Goals / Non-Goals

**Goals:**
- Add a `persona` signal (`'default' | 'cheerleader'`) to `CalculatorService`
- Gate all refusal logic on `persona !== 'cheerleader'` so it remains intact but bypassable
- Produce Cheerleader-formatted output: `= 2.5000000000 🎉 Brilliant! Fun fact: ...`
- Expose a UI toggle in the calculator component
- Keep math evaluation identical under both personas (`2 + 3 × 4 = 14` always)

**Non-Goals:**
- Refactoring refusal logic into a strategy/policy pattern (that's a future curveball)
- Internationalising Cheerleader messages (fun facts are English-only for now)
- Persisting persona preference across sessions

## Decisions

### Decision 1: Feature flag over strategy pattern

**Chosen**: Add a `persona` signal to `CalculatorService` and wrap existing refusal blocks with `if (this.persona() !== 'cheerleader')`.

**Alternative considered**: Extract an `ICalculatorPersonality` interface with `shouldRefuse()` and `formatResult()` methods.

**Rationale**: The strategy pattern is the cleaner long-term design, but the curveball spec explicitly probes whether the personality is pluggable — the test is whether the code *can* be separated, not whether it *is* fully separated today. The flag approach delivers the observable behaviour with minimal churn, and the seams become visible for the next curveball (Appeals process).

### Decision 2: Cheerleader formatting bypasses `I18nService.formatNumber()`

**Chosen**: `value.toFixed(10)` called directly in the Cheerleader result path.

**Rationale**: `Intl.NumberFormat` strips trailing zeros (`2.5` not `2.5000000000`). The spec requires forced 10 decimal places, which is a Cheerleader-specific concern, not a locale concern. Keeping it out of `I18nService` avoids polluting locale logic with persona logic.

### Decision 3: Hardcoded fun-facts map (10 entries + fallback)

**Chosen**: A `Record<number, string>` constant in `calculator.service.ts`, lookup by `Math.round(value)`, with a generic fallback.

**Rationale**: Simple, offline, no new dependencies. 10 entries cover the most interesting numbers a casual user is likely to encounter. The fallback ensures every result gets a fun fact.

## Risks / Trade-offs

- **Risk**: Refusal logic stays inline, making the next curveball (Appeals process) slightly harder if not refactored first. → **Mitigation**: The flag approach makes the seams explicit; a future change can extract to a strategy with clear before/after.
- **Trade-off**: Fun facts are not localised. The spec does not require it, and keeping them English-only avoids scope creep.
- **Trade-off**: Persona state is not persisted. Acceptable for a calculator demo; users expect it to reset on refresh.

## Open Questions

- None — scope is fully defined.
