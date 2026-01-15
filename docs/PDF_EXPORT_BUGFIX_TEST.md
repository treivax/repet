# PDF Export Bug Fixes - Quick Test Guide

## Bug Fixes Applied

### Fix 1: Bottom Margin Enforcement ✅
**Problem**: Text was overflowing beyond the bottom margin, causing truncated content.

**Solution**: 
- Line-by-line space checking before adding content
- Strict enforcement of bottom margin (15mm)
- Automatic page breaks when space is insufficient
- Proper handling of long dialogues spanning multiple pages

### Fix 2: Character Name Colors ✅
**Problem**: Character names were displayed in black instead of their assigned colors.

**Solution**:
- Import and use `generateCharacterColor()` utility
- Convert hex colors to RGB for jsPDF
- Character names now match application display colors

### Fix 3: Stage Directions Formatting ✅
**Problem**: 
- Stage directions within dialogues were not italic
- All stage directions were black instead of gray

**Solution**:
- Parse dialogue text to extract stage directions using `parseTextWithStageDirections()`
- Render all stage directions (inline and standalone) in gray (RGB: 128,128,128)
- Apply italic formatting to all stage directions
- Matches application display exactly

### Fix 4: Text Spacing Issues ✅
**Problem**: Some lines had abnormal character spacing, making them unreadable and extending beyond margins.

**Solution**:
- Replaced `pdf.splitTextToSize()` with custom `splitTextManually()` function
- Manual word-based text wrapping to prevent spacing issues
- Proper line width calculation for all text types

## Quick Test Procedure

### Test 1: Bottom Margin Verification ✅

1. **Import a long play** (3+ acts with many dialogues)
2. **Export to PDF**
3. **Open the PDF in any viewer**
4. **Check each page**:
   - Scroll through all pages
   - Verify that NO text touches the bottom edge
   - Verify a consistent white margin at the bottom (~15mm)
   - Verify no text is cut off mid-line

**Expected Result**: ✅ All pages have proper bottom margin, no truncated text

**How to measure**: 
- Print a page or use PDF ruler tool
- Bottom margin should be ~15mm from page edge
- All text should end well before the margin

---

### Test 2: Character Name Colors ✅

1. **Open a play in the application** (normal reading mode)
2. **Note the colors of 3-4 character names**
   - Example: Hamlet (blue), Ophélie (pink), Claudius (orange)
3. **Export to PDF**
4. **Open the PDF**
5. **Compare character name colors**:
   - Find dialogues from the same characters
   - Verify colors match exactly

**Expected Result**: ✅ Character names in PDF have the SAME colors as in the app

**Visual Check**:
```
APP Display:          PDF Export:
HAMLET (blue)    →    HAMLET (blue)    ✅
OPHÉLIE (pink)   →    OPHÉLIE (pink)   ✅
CLAUDIUS (orange)→    CLAUDIUS (orange)✅
```

---

### Test 3: Stage Directions Formatting ✅

1. **Open a play in the application**
2. **Find a dialogue with inline stage directions**
   - Example: "Bonjour (souriant) comment allez-vous?"
3. **Note the formatting**:
   - Stage direction "(souriant)" should be in gray and italic
4. **Export to PDF**
5. **Find the same dialogue in PDF**
6. **Verify**:
   - Stage direction is in gray (not black)
   - Stage direction is in italic
   - Formatting matches the app display

**Expected Result**: ✅ Stage directions (inline and standalone) are gray and italic

**Visual Check**:
```
APP Display:          PDF Export:
Bonjour (souriant)    Bonjour (souriant)
  - souriant in gray    - souriant in gray  ✅
  - souriant italic     - souriant italic   ✅
```

---

### Test 4: Text Spacing Normal ✅

1. **Export a play to PDF**
2. **Open the PDF**
3. **Scan through all pages**
4. **Look for any lines with abnormal spacing**:
   - Characters too far apart (like: "H e l l o")
   - Text extending beyond right margin
   - Unreadable text due to spacing
5. **Verify all text is normally spaced**

**Expected Result**: ✅ All text has normal, readable character spacing

**Bad vs Good**:
```
BAD (before fix):    GOOD (after fix):
H  e  l  l  o        Hello
T  e  x  t           Text
```

---

### Test 5: Long Dialogue Spanning Pages ✅

1. **Find or create a play with a very long dialogue** (10+ lines of text)
2. **Export to PDF**
3. **Locate the long dialogue in the PDF**
4. **Verify**:
   - Dialogue starts on one page
   - Respects bottom margin on first page
   - Continues on next page if needed
   - Both pages have proper margins

**Expected Result**: ✅ Long dialogues split correctly across pages with margins respected

---

### Test 6: Multiple Characters on Same Page ✅

1. **Export a play with dialogue between multiple characters**
2. **Open PDF to a page with 3+ different characters**
3. **Verify each character has a unique color**
4. **Verify colors are consistent throughout the PDF**

**Expected Result**: ✅ Each character has a distinct, consistent color

---

## Regression Tests (Ensure Nothing Broke)

### Regression 1: Cover Page Still Works
- [ ] Cover page present
- [ ] Title and author displayed correctly
- [ ] "Généré avec Répét" footer present

### Regression 2: Cast Section Still Works
- [ ] Cast section on page 2 (if present in play)
- [ ] Character names bold
- [ ] Descriptions italic and indented

### Regression 3: Page Numbers Still Work
- [ ] Page numbers present on all pages
- [ ] Centered at bottom
- [ ] Sequential numbering
- [ ] Starts after cover page

### Regression 4: Typography Still Correct
- [ ] Act titles: 16pt, bold, black
- [ ] Scene titles: 14pt, bold, black
- [ ] Character names: 11pt, bold, **IN COLOR**
- [ ] Dialogues: 11pt, normal, black, indented
- [ ] Stage directions: 11pt, italic, **GRAY** (both inline and standalone)

---

## Pass/Fail Criteria

### ✅ PASS if:
- All pages have visible bottom margin (~15mm)
- No text is truncated or cut off
- Character names appear in color (not black)
- Stage directions are gray and italic (inline and standalone)
- No abnormal text spacing issues
- Colors match the application display
- All regression tests pass

### ❌ FAIL if:
- Any page has text touching the bottom edge
- Any text is cut off mid-word or mid-line
- Character names are black instead of colored
- Stage directions are black instead of gray
- Stage directions within dialogues are not italic
- Any text has abnormal character spacing
- Colors don't match the application
- Any previously working feature is broken

---

## Test Results Template

**Date**: _______________  
**Tester**: _______________  
**Version**: _______________  

| Test | Status | Notes |
|------|--------|-------|
| Bottom Margin | ☐ Pass ☐ Fail | |
| Character Colors | ☐ Pass ☐ Fail | |
| Stage Directions | ☐ Pass ☐ Fail | |
| Text Spacing | ☐ Pass ☐ Fail | |
| Long Dialogues | ☐ Pass ☐ Fail | |
| Multiple Characters | ☐ Pass ☐ Fail | |
| Regression: Cover | ☐ Pass ☐ Fail | |
| Regression: Cast | ☐ Pass ☐ Fail | |
| Regression: Page Numbers | ☐ Pass ☐ Fail | |
| Regression: Typography | ☐ Pass ☐ Fail | |

**Overall Result**: ☐ PASS ☐ FAIL

**Issues Found**: 
_____________________________________________

_____________________________________________

**Screenshots Attached**: ☐ Yes ☐ No

---

## Visual Comparison Examples

### Before Fix vs After Fix

**Bottom Margin Issue**:
```
BEFORE (❌):                    AFTER (✅):
┌─────────────────┐            ┌─────────────────┐
│ ...text...      │            │ ...text...      │
│ More dialogue   │            │ More dialogue   │
│ Character: Blah │ ← Cutoff   │ Character: ...  │
└─────────────────┘            │                 │ ← Margin!
                               └─────────────────┘
```

**Character Color Issue**:
```
BEFORE (❌):                    AFTER (✅):
HAMLET: To be...  (black)      HAMLET: To be...  (blue)
OPHÉLIE: My lord... (black)    OPHÉLIE: My lord... (pink)
```

**Stage Direction Issue**:
```
BEFORE (❌):                    AFTER (✅):
(souriant) - black, not italic (souriant) - gray, italic
```

**Text Spacing Issue**:
```
BEFORE (❌):                    AFTER (✅):
C  o  m  m  e  n  t            Comment allez-vous?
a  l  l  e  z  -  v  o  u  s
```

---

## Automated Verification (Optional)

If you want to verify programmatically:

```bash
# Check PDF page count
pdfinfo your_export.pdf | grep Pages

# Extract text from last page (should not be truncated)
pdftotext -f [last_page] -l [last_page] your_export.pdf -

# Visual inspection
# Open in Adobe Acrobat Reader, Foxit, or browser
```

---

## Done! ✅

Once all tests pass, the bug fixes are validated and ready for merge.
---

### Test 7: Character Name + Dialogue Cohesion (No Orphans) ✅

1. **Export a long play to PDF**
2. **Scroll through all pages carefully**
3. **Check the bottom of each page**:
   - Look for character names alone at the bottom
   - Verify each character name is followed by at least one line of dialogue
4. **Verify no orphaned names**:
   - No character name should appear at page bottom without text
   - Character name + first line should always be together

**Expected Result**: ✅ No orphaned character names at page bottoms

**Good Example**:
```
Page N bottom:
[margin space]

Page N+1 top:
HAMLET: To be or not to be...  ✅ (entire dialogue moved)
```

**Bad Example (before fix)**:
```
Page N bottom:
HAMLET:                         ❌ (orphaned name)

Page N+1 top:
To be or not to be...
```

---
