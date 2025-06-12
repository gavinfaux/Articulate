import { ProblemDetails } from "../api/articulate";

export const reviewLogsMessage = "Review back office logs for more details.";

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
    return `${message}. ${reviewLogsMessage}`; // Return early if ProblemDetails found at top level
  }

  // 3. Check for standard Error objects
  if (error instanceof Error) {
    message = error.message;
    return `${message}. ${reviewLogsMessage}`; // Return early
  }

  // 4. Check for plain string errors
  if (typeof error === "string") {
    message = error;
    return `${message}. ${reviewLogsMessage}`; // Return early
  }

  // 5. Fallback to default message
  return `${message}. ${reviewLogsMessage}`;
}

export function isErrorWithMessage(error: unknown): error is { message: string } {
  return (
    error instanceof Error || (typeof error === "object" && error !== null && "message" in error)
  );
}
