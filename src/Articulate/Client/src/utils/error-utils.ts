import { ProblemDetails } from "../api/core";

/**
 * Extracts an error message from various error types.
 * Fetch API does not throw on HTTP errors, so we need to check for that.
 * This function prioritizes errors with a `response.data` structure (like ProblemDetails),
 * then standard `Error` objects, then plain strings.
 * @param error The error object (unknown type).
 * @param defaultMessage A default message to use if a specific one cannot be extracted.
 * @returns The extracted error message string.
 */
export function extractErrorMessage(error: unknown, defaultMessage: string): string {
  let message = defaultMessage;

  // 1. Check if the error itself is a ProblemDetails-like object
  if (error && typeof error === "object" && "title" in error && "status" in error) {
    const problem = error as Partial<ProblemDetails>;
    if (problem.title) {
      message = problem.title;
      if (problem.detail) {
        message += `: ${problem.detail}`;
      }
    } else if (problem.detail) {
      message = problem.detail;
    }
    // If neither title nor detail, defaultMessage is used (already set)
    return message; // Return early if ProblemDetails found at top level
  }

  // 3. Check for standard Error objects
  if (error instanceof Error) {
    message = error.message;
    return message; // Return early
  }

  // 4. Check for plain string errors
  if (typeof error === "string") {
    message = error;
    return message; // Return early
  }

  // 5. Fallback to default message
  return message;
}

// Original content of the function is replaced by the above logic.
// The following is a placeholder to ensure the chunk replacement targets the function body.
// It will be effectively removed by replacing the entire function's opening brace.
// Ensure the actual function content starting from its opening brace is replaced.
