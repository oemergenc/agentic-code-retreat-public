# cheerleader-persona

## Purpose

Define the Cheerleader calculator persona, including its refusal-free behavior, result formatting, and user-controlled persona switching.

## Requirements

### Requirement: Cheerleader persona skips all refusals
When the Cheerleader persona is active, the calculator SHALL evaluate every expression without applying cursed-number, déjà-vu, unlucky-division, or mood-based refusal checks.

#### Scenario: Cursed number computes normally
- **WHEN** persona is `cheerleader` and the user submits `4 + 69`
- **THEN** the calculator returns `73` (with praise and fun fact) and does NOT refuse

#### Scenario: Déjà vu is ignored
- **WHEN** persona is `cheerleader` and the user submits the same expression twice in a row
- **THEN** the calculator computes the result both times without a déjà-vu refusal

#### Scenario: Bad mood is ignored
- **WHEN** persona is `cheerleader` and the calculator mood is `on-strike`
- **THEN** the calculator computes the result without a mood refusal

### Requirement: Cheerleader result formatting
When the Cheerleader persona is active, results SHALL be formatted with exactly 10 decimal places, prefixed with a praise word, and suffixed with a fun fact about the result number.

#### Scenario: Division result padded to 10 decimals
- **WHEN** persona is `cheerleader` and the user computes `10 ÷ 4`
- **THEN** the output shows `2.5000000000` (10 decimal places, trailing zeros preserved)

#### Scenario: Praise and fun fact appended
- **WHEN** persona is `cheerleader` and the user computes any valid expression
- **THEN** the output includes a praise word (e.g., "Brilliant!") and a fun fact about the result

#### Scenario: Math is identical under both personas
- **WHEN** persona is `cheerleader` and the user computes `2 + 3 × 4`
- **THEN** the result value is `14` (operator precedence preserved, same as default persona)

### Requirement: Persona toggle
The calculator UI SHALL provide a control that allows the user to switch between `default` and `cheerleader` personas at any time.

#### Scenario: Switch to Cheerleader
- **WHEN** user activates the Cheerleader toggle
- **THEN** subsequent calculations use Cheerleader formatting and skip all refusals

#### Scenario: Switch back to Default
- **WHEN** user deactivates the Cheerleader toggle
- **THEN** subsequent calculations restore all refusal checks and normal formatting
