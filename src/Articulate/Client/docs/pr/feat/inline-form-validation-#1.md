# Pull Request: [FEAT] Implement Inline Form Validation UI

## Description

This change introduces a more intuitive user experience for handling form validation errors. Instead of only showing a summary message, API validation errors are now displayed directly underneath the corresponding form fields.

This is achieved by centralizing the error handling logic in `error-utils.ts` and making minimal, standardized changes to consuming components. The system is designed to be robust, handling standard inputs and providing a flexible mechanism for non-input validation targets.

**Related to:** [Pull Request: [FEAT] Implement Inline Form Validation UI #1](https://github.com/gavinfaux/Articulate/issues/1)

---

## Technical Context

- Project folder relative to root: src\Articulate\Client
- Node TypeScript project using @umbraco-cms/backoffice and Umbraco UUI lit web components
- Create a PR branch named `pr/feat/#1-inline-form-validation` from the head of the pr/um15-core branch

---

## Notes

- Field matching strategy: For each API validation error field, the system will attempt to match both PascalCase and camelCase `name` attributes on form controls (`uui-input`, `uui-input-file`, `uui-toggle`).
- If no matching standard input is found, the system will look for an element with a `data-validation-for` attribute matching the field name (in either case format). This allows handling of edge cases, such as selection-based fields (e.g., `copy-theme.element.ts` using a `uui-card` grid for `themeName`).
- If a matching anchor is found, the error message is injected immediately after it. If it's a standard input, the `invalid` attribute is set for visual feedback.
- Toggles are not currently validated server-side but are supported for future-proofing.
- All validation error styles must support both light and dark mode. The `.field-validation-error` class uses UUI/Umbraco design tokens (e.g., `--uui-color-danger-standalone`) to ensure accessible color contrast on both backgrounds (e.g., #2D333B for dark mode) and to avoid hardcoded colors. This leverages Umbraco's theming system and ensures accessibility (WCAG AA compliance).
- The rest of the plan remains as detailed below.

## Task List

- [x] Brainstorm and agree on high-level approach
- [x] Analyze current error handling in components (e.g., `blogml-importer.element.ts`)
- [x] Draft detailed PR-style plan document
- [x] Validate and finalize plan with stakeholders
- [ ] Implement `clearValidationErrors(form)` in `error-utils.ts`
- [ ] Implement `displayValidationErrors(form, errors)` in `error-utils.ts`
- [ ] Refactor `formatApiError` to support form integration
- [ ] Update component error clearing logic to call `clearValidationErrors`
- [ ] Audit and update all `this._formError = null` usages
- [ ] Update form submission `catch` blocks to pass form to `formatApiError`
- [ ] Add/adjust supporting styles for inline error messages
- [ ] Test and verify UX in all affected components

## Current Goal

Begin implementation, starting with Step 1: Add Shared Styles

---

### **Step 1: Add Shared Styles for Inline Errors**

We need a consistent look for our new error messages that works in both light and dark mode. Use Umbraco/UUI CSS custom properties (design tokens) for color and font, as these automatically adapt to theme changes and provide accessible contrast.

- **File to Modify:** `f:\int\Articulate6-wip\src\Articulate\Client\src\utils\form-styles.ts`
- **Action:** Add the following CSS rule to the existing `formStyles` literal. This will style the `div` we inject with the error message and ensure theme support.

```css
/* Add this inside the const formStyles = css`...` block */
.field-validation-error {
  color: var(--uui-color-danger-standalone); /* Accessible in both themes */
  font-size: var(--uui-font-size-small);
  margin-top: var(--uui-size-space-1);
}
```

---

### **Step 2: Create the Core Logic in `error-utils.ts`**

This is where the main functionality will live.

- **File to Modify:** `f:\int\Articulate6-wip\src\Articulate\Client\src\utils\error-utils.ts`

**2a. Create `clearValidationErrors` function:**
This function will clean up any errors we've previously displayed.

- **Action:** Add this new exported function to the file.

```typescript
/**
 * Removes all dynamically added validation error messages and resets invalid states on a form.
 * @param form The HTMLFormElement to clear.
 */
export function clearValidationErrors(form: HTMLFormElement) {
  // Remove the error message elements we added
  form.querySelectorAll('.field-validation-error').forEach((el) => el.remove());

  // Find all uui-inputs within the form and remove their 'invalid' attribute
  form.querySelectorAll('uui-input, uui-input-file, uui-toggle').forEach((el) => {
    el.removeAttribute('invalid');
  });
}
```

**2b. Create `displayValidationErrors` function:**
This function will find the form fields and inject the error messages.

- **Action:** Add this new (internal, not exported) function to the file.

```typescript
/**
 * Displays validation errors from the API directly on the corresponding form fields.
 * @param form The form element to display errors on.
 * @param errors An object where keys are field names and values are error messages.
 */
function displayValidationErrors(form: HTMLFormElement, errors: Record<string, string[]>) {
  for (const fieldName in errors) {
    // API returns PascalCase, form names are often camelCase. We must try both.
    const camelCaseName = fieldName.charAt(0).toLowerCase() + fieldName.slice(1);
    // Try matching by name attribute first (inputs, toggles, etc)
    let anchor = form.querySelector(`[name="${fieldName}"], [name="${camelCaseName}"]`) as HTMLElement | null;
    // If not found, try data-validation-for (for edge cases like themeName selection)
    if (!anchor) {
      anchor = form.querySelector(`[data-validation-for="${fieldName}"], [data-validation-for="${camelCaseName}"]`) as HTMLElement | null;
    }
    if (anchor) {
      // Set invalid state if it's a standard input
      if (anchor.hasAttribute('name')) {
        anchor.setAttribute('invalid', '');
      }
      // Get the first error message for this field
      const errorMessage = errors[fieldName]?.[0];
      if (errorMessage) {
        const errorEl = document.createElement('div');
        errorEl.className = 'field-validation-error';
        errorEl.textContent = errorMessage;
        // Insert the message directly after the anchor element
        anchor.parentElement?.insertBefore(errorEl, anchor.nextSibling);
      }
    }
  }
}
```

**2c. Upgrade `formatApiError`:**
This function will now orchestrate the clearing and displaying of errors.

- **Action:** Modify the existing `formatApiError` function.

**Before:**

```typescript
export function formatApiError(error: unknown, defaultMessage: string): { title: string; details: string[] } {
  // ... existing implementation
}
```

**After:**

```typescript
export function formatApiError(
  error: unknown,
  defaultMessage: string,
  form?: HTMLFormElement, // <-- Add optional form parameter
): { title:string; details: string[] } {
  // Always clear previous inline errors if a form is passed
  if (form) {
    clearValidationErrors(form);
  }

  // Log the raw error for debugging purposes
  console.error("An API error occurred:", error);

  // Check if it's a ProblemDetails-like object from the API
  if (error && typeof error === "object" && "title" in error) {
    const problem = error as ProblemDetails & { errors?: Record<string, string[]> };

    // If it's a validation error AND we have a form, display errors inline
    if (problem.errors && form) {
      displayValidationErrors(form, problem.errors);
      // Return a generic summary message for the main error banner
      return {
        title: "Validation Failed",
        details: ["Please correct the issues highlighted below and try again."],
      };
    }
    
    // ... THE REST OF THE ORIGINAL FUNCTION LOGIC REMAINS HERE ...
    // This part will now act as a fallback for non-validation errors
    // or when no form is provided.
    if (problem.errors) {
      // ...
    }
    // ...
  }
  // ...
  return { title: defaultMessage, details: [] };
}
```

*Note: You will be inserting the new logic at the top and modifying the `if (problem.errors)` block.*

---

### **Step 3: Integrate into `blogml-importer.element.ts`**

Now we apply our new utilities to the component.

- **File to Modify:** `f:\int\Articulate6-wip\src\Articulate\Client\src\components\blogml-importer.element.ts`
- **Action:** Import the new `clearValidationErrors` function at the top of the file.

```typescript
import { clearValidationErrors, formatApiError } from "../utils/error-utils";
```

**3a. Update `#clearError()`:**
This method is triggered on any form input, making it the perfect place to clear all error states.

- **Action:** Modify the `#clearError` method.

**Before:**

```typescript
#clearError() {
  this._formError = null;
}
```

**After:**

```typescript
#clearError() {
  this._formError = null;
  if (this._form) {
    clearValidationErrors(this._form);
  }
}
```

**3b. Update `#handleSubmit()`:**
This is where we call our new error display logic.

- **Action:** Modify the `catch` block within the `#handleSubmit` method.

**Before:**

```typescript
} catch (error) {
  this._formError = formatApiError(error, "An unexpected error occurred during import.");
  this._formState = "failed";
  this._postCount = undefined;
}
```

**After:**

```typescript
} catch (error) {
  this._formError = formatApiError(error, "An unexpected error occurred during import.", this._form);
  this._formState = "failed";
  this._postCount = undefined;
}
```

**3c. Update `_handleReset()`:**
Ensure a manual reset also clears the inline errors.

- **Action:** Modify the `_handleReset` method to call `#clearError`.

**Before:**

```typescript
private _handleReset = (e: Event) => {
  e.preventDefault();
  this._formState = undefined;
  this._formError = null;
  // ... rest of method
};
```

**After:**

```typescript
private _handleReset = (e: Event) => {
  e.preventDefault();
  this._formState = undefined;
  this.#clearError(); // <-- Use the centralized clear method
  this._articulateNodeId = undefined;
  this._selectedBlogNodeName = "";
  this._postCount = undefined;
  this._formRenderKey++;
};
```

---
