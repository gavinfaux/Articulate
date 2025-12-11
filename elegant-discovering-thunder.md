# Plan: Consistent Label Styling for Markdown Editor

## Problem
The Editor View (Title input) and Optional View (Tags, Categories, Excerpt, Slug inputs) have inconsistent label styling. The Title label needs to be styled consistently with the Optional View fields.

## Current State

### Editor View (Title field)
- **File**: `md-editor.css` lines 647-651
- Label color when empty: `rgba(0, 0, 0, .26)` (gray)
- Label color when dirty/focused: `#3f51b5` (blue) - from lines 653-661
- Uses `.md-editor__title` class

### Optional View (Tags, Categories, etc.)
- Uses `.md-editor__field` class
- Uses default MDL floating-label styling
- Label floats above when field has content

## Required Changes

### File to Modify
`E:\int\Articulate15\src\Articulate.StaticAssets\wwwroot\App_Plugins\Articulate\MarkdownEditor\src\css\md-editor.css`

### Changes
1. **Update title label color when floating (is-dirty/is-focused)** - Change from blue (`#3f51b5`) to pink (`#e91e63`)
   - Add specific rule for `.md-editor__title` in the floating-label states

2. **Remove any left margin/padding on title label** - Ensure label aligns left without extra spacing

3. **Keep consistent floating-label behavior** - Label above when field has content, floating inside when empty

## Implementation

### Step 1: Add pink color for floating title label
Add a new CSS rule after line 651 to override the blue color for title labels specifically:

```css
.md-editor__title.mdl-textfield--floating-label.is-focused .mdl-textfield__label,
.md-editor__title.mdl-textfield--floating-label.is-dirty .mdl-textfield__label {
    color: #e91e63;
}
```

### Step 2: Verify label alignment
Check and fix any left padding/margin on the label element to ensure proper left alignment.

## Files to Modify
- `E:\int\Articulate15\src\Articulate.StaticAssets\wwwroot\App_Plugins\Articulate\MarkdownEditor\src\css\md-editor.css`

## Color Confirmed
- Pink: `#e91e63` (Material Design Pink 500, same as header)
