import type { ProblemDetails } from "../api/types.gen";

// -----------------------------
// TODO: Remove this when we have proper error handling for the API, using hey-api for now & sends ProblemDetails
// Base class or mixin based on maybe https://github.com/umbraco/Umbraco-CMS/blob/main/src/Umbraco.Web.UI.Client/examples/validation-context/validation-context-dashboard.ts
// https://docs.umbraco.com/umbraco-cms/15.latest/customizing/foundation/validation/integrate-validation
// https://github.com/umbraco/Umbraco-CMS/blob/main/src/Umbraco.Web.UI.Client/src/packages/core/validation/context/validation.context.ts
// Umbraco sends ValidateErrorResponseBodyModel ?
// https://github.com/umbraco/Umbraco-CMS/tree/main/src/Umbraco.Web.UI.Client/src/packages/core/validation
// https://github.com/umbraco/Umbraco-CMS/blob/main/src/Umbraco.Web.UI.Client/src/packages/core/validation/context/server-model-validator.context.ts
// https://github.com/umbraco/Umbraco-CMS/blob/main/src/Umbraco.Web.UI.Client/src/packages/core/validation/controllers/form-control-validator.controller.ts
// -----------------------------

/**
 * Formats an API error into a user-friendly message.
 * It can handle ProblemDetails objects, standard Error objects, and strings.
 * @param {unknown} error The error object, which can be of any type.
 * @param {string} defaultMessage A fallback message if the error object is not recognized.
 * @returns {{title: string, details: string[]}} A user-friendly error message object with a title and an array of details.
 */
export function formatApiError(error: unknown, defaultMessage: string): { title: string; details: string[] } {
  console.info("[formatApiError] Received error:", error);

  // Check if it's a ProblemDetails-like object from the API
  if (
    error !== null &&
    typeof error === "object" &&
    "title" in error &&
    typeof (error as ProblemDetails).title === "string"
  ) {
    const problem = error as ProblemDetails & { detail?: string; errors?: Record<string, string[]> };
    const details: string[] = [];

    if (problem.detail) {
      details.push(problem.detail);
    }

    if (problem.errors) {
      details.push(...Object.values(problem.errors).flatMap((e) => e));
    }

    return {
      title: problem.title ?? defaultMessage,
      details,
    };
  }

  if (error instanceof Error) {
    // Use the error's name for the title if it's descriptive, otherwise use the default.
    const title = error.name !== "Error" ? error.name : defaultMessage;
    const details = error.message ? [error.message] : [];

    // During development, log the stack trace for much easier debugging.
    console.warn(`[${title}] Stack Trace:`, error.stack);
    return { title, details };
  }

  if (typeof error === "string") {
    return { title: defaultMessage, details: [error] };
  }

  return { title: defaultMessage, details: [] };
}
