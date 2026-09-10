# Lessons

Patterns learned from user corrections. Agents: skim at session start; append after any correction.

## How to add a lesson

```
## YYYY-MM-DD — short title

- **Mistake**: what went wrong
- **Correction**: what the user said or what was actually required
- **Rule**: what to do next time
```

## Lessons

## 2026-09-10 — Knowledge goes in lessons.md, not a new rule

- **Mistake**: After a SonarQube correction, created `.cursor/rules/sonarqube-ide.mdc`.
- **Correction**: Rules are for essential constraints. Operational knowledge belongs in `.cursor/lessons.md`.
- **Rule**: Append lessons here. Do not add a `.cursor/rules` file unless the user asks, or the constraint is essential safety/never-do that must always apply.

## 2026-09-10 — SonarQube is the IDE panel, not npm

- **Mistake**: Installed ESLint + eslint-plugin-sonarjs to approximate SonarQube instead of using the SonarQube for IDE extension already in Cursor.
- **Correction**: Findings live in the SonarQube panel (and its terminal). Do not npm-install linters for this.
- **Rule**: After homepage JS/CSS edits, use ReadLints and the SonarQube panel issues. Fix those. Never add ESLint/SonarJS/npm lint tooling to this repo.
