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
  console.info(`At validation event: formatApiError started with defaultMessage: ${defaultMessage}`);

  // Check if it's a ProblemDetails-like object from the API
  if (error && typeof error === "object" && "title" in error) {
    console.info("At validation event: formatApiError identified a ProblemDetails-like object");
    const problem = error as ProblemDetails & { errors?: Record<string, string[]> };

    // Prioritize extracting and formatting detailed validation errors
    if (problem.errors) {
      console.info("At validation event: formatApiError found validation errors in ProblemDetails");
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
        const result = {
          title: problem.title || "One or more validation errors occurred",
          details: formattedErrors,
        };
        console.info(`At validation event: formatApiError returning formatted validation errors`);
        return result;
      }
    }

    // Fallback to title and detail if no specific validation errors are found
    if (problem.title) {
      const result = {
        title: problem.title,
        details: problem.detail ? [problem.detail] : [],
      };
      console.info(`At validation event: formatApiError returning ProblemDetails title and detail`);
      return result;
    }
  }

  // Fallback for standard JavaScript Error objects
  if (error instanceof Error) {
    const result = { title: error.message, details: [] };
    console.info(`At validation event: formatApiError returning standard Error message`);
    return result;
  }

  // Fallback for simple string errors
  if (typeof error === "string" && error) {
    const result = { title: error, details: [] };
    console.info(`At validation event: formatApiError returning string error`);
    return result;
  }

  // If the error is unrecognizable, use the default message.
  const result = { title: defaultMessage, details: [] };
  console.info(`At validation event: formatApiError returning default message`);
  return result;
}
