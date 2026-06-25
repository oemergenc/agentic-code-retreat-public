# calculator-core

## Purpose

Define the calculator's core evaluation behavior, including when refusal rules apply without changing the underlying math engine.

## Requirements

### Requirement: Refusal checks are persona-gated
All existing refusal logic in `CalculatorService.calculate()` (cursed numbers, déjà vu, unlucky division, mood) SHALL only execute when the active persona is `default`. The math evaluation path SHALL remain unchanged regardless of persona.

#### Scenario: Default persona still refuses cursed number
- **WHEN** persona is `default` and the user submits an expression containing `42`
- **THEN** the calculator refuses with the cursed-42 message

#### Scenario: Cheerleader persona bypasses the same check
- **WHEN** persona is `cheerleader` and the user submits an expression containing `42`
- **THEN** the calculator computes the result without refusing
