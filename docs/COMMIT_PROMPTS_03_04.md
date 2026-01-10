# Commit Message - Prompts 03 & 04

## Suggested Commit Message

```
feat: implement parser and storage layer (Prompts 03 & 04)

- Add theatrical text parser with full AST construction
  - Tokenizer for metadata, acts, scenes, characters, dialogues
  - Automatic character detection and UUID assignment
  - Support for inline and standalone stage directions
  - Roman and Arabic numeral support for acts/scenes
  - Text segment parsing with nested didascalies

- Add IndexedDB storage layer with Dexie.js
  - RepetDatabase with plays and settings tables
  - Complete CRUD repository for plays (7 methods)
  - Settings repository with get/update/reset
  - Automatic initialization on app startup
  - Automatic timestamps (createdAt, updatedAt)
  - Explicit error handling throughout

- Add UUID v4 utility generator

- Update Character model to accept optional id parameter

- Add test theatrical file (Le Bourgeois Gentilhomme)

Technical notes:
- Workaround for Dexie circular type issue (get→merge→put pattern)
- Remove console.log statements (ESLint compliance)
- Zero TypeScript errors, zero ESLint warnings
- Build passes (242KB bundle, 79KB gzipped)

Closes #3, #4
```

## Detailed Changes

### New Files (10)

**Parser (Prompt 03)**
- `src/core/parser/types.ts` - Token, TokenType, ParserContext types
- `src/core/parser/tokenizer.ts` - Text tokenization (~135 lines)
- `src/core/parser/parser.ts` - AST parser (~309 lines)
- `src/core/parser/index.ts` - Centralized exports
- `src/utils/uuid.ts` - UUID v4 generator
- `public/test-play.txt` - Test theatrical file

**Storage (Prompt 04)**
- `src/core/storage/database.ts` - Dexie config & init (~56 lines)
- `src/core/storage/plays.ts` - Plays repository (~149 lines)
- `src/core/storage/settings.ts` - Settings repository (~79 lines)
- `src/core/storage/index.ts` - Centralized exports

### Modified Files (2)

- `src/core/models/Character.ts` - Add optional id parameter to createCharacter()
- `src/main.tsx` - Add database initialization on startup

### Documentation (3)

- `docs/PROMPT_03_COMPLETED.md` - Parser implementation summary
- `docs/PROMPT_04_COMPLETED.md` - Storage implementation summary
- `docs/EXECUTION_PROMPTS_03_04.md` - Combined execution report
- `PROGRESS.md` - Updated with Prompts 03 & 04 completion

## Commit Checklist

Before committing, verify:

- [ ] All new files have copyright headers
- [ ] `npm run type-check` passes (0 errors)
- [ ] `npm run lint` passes (0 warnings)
- [ ] `npm run build` succeeds
- [ ] `npm run dev` starts without errors
- [ ] No console.log statements (only console.error/warn)
- [ ] All public functions have JSDoc comments
- [ ] No `any` types (except necessary casts)
- [ ] Git status shows expected files only

## Files to Stage

```bash
# New directories
git add src/core/parser/
git add src/core/storage/
git add src/utils/

# Modified files
git add src/core/models/Character.ts
git add src/main.tsx

# Test file
git add public/test-play.txt

# Documentation
git add docs/PROMPT_03_COMPLETED.md
git add docs/PROMPT_04_COMPLETED.md
git add docs/EXECUTION_PROMPTS_03_04.md
git add docs/COMMIT_PROMPTS_03_04.md
git add PROGRESS.md

# Commit
git commit -F docs/COMMIT_PROMPTS_03_04.md
```

## Post-Commit

Optional: Tag the commit for easy reference

```bash
git tag -a prompt-03-04 -m "Parser and Storage implementation"
git push origin main --tags
```

---

**Note**: This represents ~800 lines of new TypeScript code implementing the core parsing and persistence functionality for the Répét application.