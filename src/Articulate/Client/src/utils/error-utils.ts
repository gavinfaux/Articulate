import { ProblemDetails } from "../api";

/**
 * Formats an error from an API call into a user-friendly object.
 * It intelligently handles ProblemDetails objects, standard Error objects, and strings.
 *
 * @param error The error object, typically from the `error` property of an API result.
 * @param defaultMessage A fallback message if the error object is not recognized.
 * @returns A user-friendly error message object with a title and an array of details.
 */
export function formatApiError(error: unknown, defaultMessage: string): { title: string; details: string[] } {
  // Log the raw error for debugging purposes
  console.error("An API error occurred:", error);

  // Check if it's a ProblemDetails-like object from the API
  if (error && typeof error === "object" && "title" in error) {
    const problem = error as ProblemDetails & { errors?: Record<string, string[]> };

    // Prioritize extracting and formatting detailed validation errors
    if (problem.errors) {
      const formattedErrors = Object.entries(problem.errors).flatMap(([key, messages]) => {
        // Clean up the field name (e.g., '$.articulateNodeId' -> 'articulateNodeId')
        const fieldName = key.startsWith("$.") ? key.substring(2) : key;

        // Map over all messages for the current key, filtering out any null/empty ones first
        return messages
          .filter((msg) => !!msg)
          .map((msg) => {
            // Clean up the message, but fall back to the original if the split fails
            const cleanedMsg = msg.split(" Path: $.")[0] || msg;
            return `${fieldName}: ${cleanedMsg}`;
          });
      });

      if (formattedErrors.length > 0) {
        return {
          title: problem.title || "One or more validation errors occurred",
          details: formattedErrors,
        };
      }
    }

    // Fallback to title and detail if no specific validation errors are found
    if (problem.title) {
      return {
        title: problem.title,
        details: problem.detail ? [problem.detail] : [],
      };
    }
  }

  // Fallback for standard JavaScript Error objects
  if (error instanceof Error) {
    return { title: error.message, details: [] };
  }

  // Fallback for simple string errors
  if (typeof error === "string" && error) {
    return { title: error, details: [] };
  }

  // If the error is unrecognizable, use the default message.
  return { title: defaultMessage, details: [] };
}
