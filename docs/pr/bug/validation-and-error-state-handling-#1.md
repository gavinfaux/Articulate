# PRD: Standardizing Form Error State Management to Prevent Silent Failures

**Document ID:** `validation-and-error-state-handling-#1`
**Status:** Approved for Implementation
**Author:** Cascade & USER
**Date:** 2025-06-26

## 1. Executive Summary

A bug investigation into inconsistent form validation behavior has revealed a systemic weakness in our client-side error handling. The process uncovered a pattern of "silent failures" where a component's UI could enter a `failed` state without displaying a corresponding error message. This document details the root cause analysis, the immediate fix, and a new, robust architectural pattern for error state management that must be adopted as a best practice.

## 2. The Original Issue

### 2.1. Symptoms

- The `blogml-exporter` component displayed both a browser validation message and a custom error message.
- The `blogml-importer` component only showed the browser validation message, failing to render the custom error.
- Console logs confirmed an inconsistent state: `renderErrorMessage called with errors: null`. This created a confusing UX where the submit button failed without explanation.

### 2.2. Root Cause Analysis

The investigation led to the browser's `form.reportValidity()` API, which surfaced a console **warning**: `An invalid form control with name='importFile' is not focusable.`

- **The Cause**: The `<uui-input-file>` custom element was not a "focusable" element. `reportValidity()` attempts to focus the invalid control; when it couldn't, it issued a non-catchable warning.
- **The Flaw**: Our `try...catch` block was never triggered. The code proceeded to the `if (!this._form.reportValidity())` check, which correctly evaluated to `true`. Inside this block, it set `this._formState = "failed"` and then immediately returned, **before an error object could be created**. This resulted in the silent failure.

---

## 3. The Solution: A Two-Pronged Attack

### 3.1. Part A: The Tactical Fix (Treating the Symptom)

The immediate "not focusable" warning is addressed by making the custom component a valid focus target.

- **File**: `src/Articulate/Client/src/components/blogml-importer.element.ts`
- **Action**: Add the `tabindex="0"` attribute to the `<uui-input-file>` element.
- **Rationale**: This includes the custom element in the page's tab order, making it focusable and allowing `reportValidity()` to function as intended.

    ```html
    <!-- Before -->
    <uui-input-file id="importFile" name="importFile" required></uui-input-file>

    <!-- After -->
    <uui-input-file id="importFile" name="importFile" required tabindex="0"></uui-input-file>
    ```

### 3.2. Part B: The Strategic Fix (Curing the Disease)

To eliminate the silent failure pattern and adhere to the DRY principle, we will abstract error handling into a centralized, reusable utility.

- **Action**: Create a shared error handling utility (e.g., a class or mixin) located at a central path like `src/utils/error-utils.ts`. This utility will provide a standard `#handleFormError` method to all form-based components. It's likely a mixin  is the best approach, as it can be easily extended to other components, ensuring a single source of truth for error handling logic.

Elements implementing using this mixin will be able to use the `messages?: UmbValidationMessage[]` property to observe error messages.

E.g.

```typescript

import { ProblemDetails } from "../api";

// declare the mixin
// {{...}}

// implement the mixin
// {{...}}

    @state()
    file: File | null = null;

    @state()
    nodeGuid = '';

    @state()
    formErrorCount = 0;

    @state()
    nodeGuidErrorCount = 0;

  readonly validation = new UmbValidationContext(this);

@state()
    messages?: UmbValidationMessage[];

// export type UmbValidationMessageType = 'client' | 'server' | 'config' | string;
// export interface UmbValidationMessage {
//     type: UmbValidationMessageType;
//     key: string;
//     path: string;
//     body: string;
// }


constructor() {
        super();

        this.consumeContext(UMB_VALIDATION_CONTEXT, (validationContext) => {
            this.observe(
                validationContext.messages.messages,
                (messages) => {
                    this.messages = messages;
                },
                'observeValidationMessages',
            );
        });
      this.validation.messages.messagesOfPathAndDescendant('$.').subscribe((value) => {
        this.formErrorCount = [...new Set(value.map((x) => x.path))].length;
      });
    // Observe errors for nodeGuid, note that we only use part of the full JSONPath
    this.validation.messages.messagesOfPathAndDescendant('$.nodeGuid').subscribe((value) => {
        this.nodeGuidErrorCount = [...new Set(value.map((x) => x.path))].length;
    });

    }

#handleSave() {
  // fake server validation-errors for all fields
  if (this.nodeGuid == '')
    this.validation.messages.addMessage(
      'server',
        '$.nodeGuid',
        'Node Guid server-error message',
        '4875e113-cd0c-4c57-ac92-53d677ba31ec',
    );

    result = await exportFake(this.nodeGuid);
    if (!result.response.ok || !result.data && !result.error) {
        this.validation.messages.addMessage(
      'server',
        '$.nodeGuid',
        'Articulate.exportFake server-error message',
        '5875e113-cd0c-4c57-ac92-53d677ba31ec',
      return;
    );
     this.handleFormError(result.error, "Failed to export blog content.");
      return;
    }
}

exportFake(string: nodeId)
{
    const problem = error as ProblemDetails & { errors?: Record<string, string[]> };
    // fill in all problem details and error messages ~
    // type ProblemDetails = {
    // type?: string | null;
    // title?: string | null;
    // status?: number | null;
    // detail?: string | null;
    // instance?: string | null;
    // [key: string]: unknown | (string | null) | (string | null) | (number | null) | (string | null) | (string | null) | undefined;
};
    return problem;
}
}
```

- **Responsibility**: This method becomes the single, authoritative source for putting a form into a failed state, ensuring state and error messages are always managed together.

#### New Helper Method Implementation (in shared utility)

```typescript
/**
 * Centralized method to handle all form failures.
 * @param error - The raw error object. For validation, this should be a new Error().
 * @param defaultMessage - The user-facing message to use if the error can't be parsed.
 */
protected handleFormError(error: unknown, defaultMessage: string) {
  this._formState = "failed";
  this._formError = formatApiError(error, defaultMessage);
};
```

#### Refactoring Component Code

All components will now import and use this shared utility. Independent state setting is forbidden.

**Example 1: The Improved `reportValidity` Case**

This now provides a specific, persistent error message to the user.

```typescript
// Before
if (!this._form.reportValidity()) {
  this._formState = "failed";
  return;
}

// After: Using the shared helper and providing specific feedback
if (!this._form.reportValidity()) {
  const invalidEl = this._form.querySelector(':invalid') as HTMLInputElement;
  const message = invalidEl?.validationMessage || 'Validation failed. Please check all fields.';
  this.handleFormError(new Error(message), message);
  return;
}
```

**Example 2: A `catch` Block Case**

```typescript
// Before
catch (error) {
  this._formError = formatApiError(error, "An unexpected error occurred.");
  this._formState = "failed";
}

// After: Using the shared helper
catch (error) {
  this.handleFormError(error, "An unexpected error occurred during import.");
}
```

---

## 4. In-Scope Components

The following files will be refactored to use the new **centralized error handling utility**:

- `src/Articulate/Client/src/components/blogml-importer.element.ts`
- `src/Articulate/Client/src/components/blogml-exporter.element.ts`
- `src/Articulate/Client/src/components/copy-theme.element.ts`

---

## 5. Testing Strategy

### Unit / Integration Tests

1. **Test Case: `handleFormError` with Mocks**
    - Simulate form submissions using a mock that can return `false` or throw an error.
    - Assert that both scenarios correctly trigger `handleFormError`.
    - Assert that for validation failures, `handleFormError` is called with a `new Error()` object.
    - Assert the render method displays the correct error message via `renderErrorMessage`.

2. **Test Case: Constraint Validation with `checkValidity()`**
    - **Setup**: Create a test form containing two `<uui-input-file>` elements:
        1. One element is correctly configured: `required`, `tabindex="0"`, and proper ARIA attributes.
        2. A second element is configured as optional: *not* `required` and no `tabindex`.
    - **Steps & Assertions**:
        1. With the required input empty, call `form.checkValidity()`. Assert it returns `false`.
        2. Provide a value for the required input. Call `form.checkValidity()`. Assert it returns `true`.
    - **Purpose**: This tests the underlying HTML5 constraint validation API without invoking the UI-blocking focus behavior of `reportValidity()`.

### End-to-End (E2E) / Manual Tests

1. **Test Case: Native Validation Failure (`reportValidity`)**
    - **Steps**: In the importer, leave the file input empty and click "Submit".
    - **Expected Outcome**: The browser's native validation bubble appears. The component's custom error message area renders the specific message (e.g., "Please select a file."), and the submit button enters its failed state.
2. **Test Case: Manual Validation Failure**
    - **Steps**: Select a file but do not select a blog node. Click "Submit".
    - **Expected Outcome**: The custom error message "Please select a blog node before importing." must be displayed.
3. **Test Case: API Exception**
    - **Steps**: Simulate a network error from an API endpoint.
    - **Expected Outcome**: A correctly formatted API error message is displayed.
4. **Test Case: Clear Error on Success**
    - **Steps**: After triggering an error, correct the input and submit successfully.
    - **Expected Outcome**: The form submission succeeds, and all error messages are cleared.

---

## 6. Go-Forward Best Practice

The pattern of using the **centralized error handling utility** is hereby established as the standard for all form development within this project.

- **Mandate**: All new components containing forms **must** use this shared utility.
- **Enforcement**: Future code reviews must reject direct manipulation of `_formState` and `_formError`, requiring refactoring to use the centralized helper.

---

## 7. High-Priority Follow-Up: Full Component Accessibility

The `tabindex="0"` fix is a tactical solution for the validation flow. Making the `<uui-input-file>` component fully accessible is a critical follow-up task to be addressed immediately after this implementation.

**Best Practice Checklist for `<uui-input-file>` Accessibility:**

1. **Define its Role**: Add `role="button"` to the primary clickable element inside the component's shadow DOM so a screen reader announces "button".
2. **Provide an Accessible Name**: Ensure the component has a `<label>` or uses `aria-label` to describe its purpose (e.g., "Upload Import File").
3. **Announce State Changes**:
    - Use `aria-invalid="true"` when the control is in an error state.
    - Use `aria-describedby` to programmatically link the input to its help text and, crucially, to the ID of the error message container. This allows screen readers to announce the specific error when the user focuses on the invalid input.
4. **Ensure Keyboard Interactivity**: Confirm that the "button" can be activated using both `Enter` and `Spacebar`, as is standard for button elements.

### Example of a `ValidateErrorResponseBodyModel` returned when using Umbraco Server Validation, we are using hey-api to handle this (ProblemDetails)

```typescript
interface ValidateErrorResponseBodyModel {
    detail: string;
    errors: Record<string, Array<string>>;
    operationStatus: string;
    status: number;
    title: string;
    type: string;
}
```
