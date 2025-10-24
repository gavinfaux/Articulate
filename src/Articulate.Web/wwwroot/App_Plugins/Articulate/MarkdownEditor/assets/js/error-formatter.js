/**
 * Cleans up a field name for display in the UI.
 * e.g., '$.articulateBlogNode' -> 'Articulate Blog Node'
 * @param {string} fieldName The raw field name.
 * @returns {string} A cleaned, human-readable field name.
 */
function cleanFieldName(fieldName) {
  const cleanedName = fieldName.startsWith('$.') ? fieldName.substring(2) : fieldName;
  return cleanedName.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/^./, (str) => str.toUpperCase());
}

/**
 * Formats an API error into a user-friendly message object.
 * It can handle ProblemDetails objects, standard Error objects, and network failures.
 * @param {unknown} error The error object, which can be of any type.
 * @param {string} defaultMessage A fallback message if the error object is not recognized.
 * @returns {{title: string, details: string[]}} A user-friendly error message object.
 */
export function formatApiError(error, defaultMessage = 'An unexpected error occurred.') {
  console.warn('[formatApiError] Received error:', error);

  // Handle ProblemDetails from ASP.NET Core
  if (error && typeof error === 'object' && 'title' in error) {
    const problem = error;

    // Handle ValidationProblemDetails
    if (problem.errors && typeof problem.errors === 'object') {
      const formattedErrors = Object.entries(problem.errors).flatMap(([key, messages]) => {
        const fieldName = cleanFieldName(key);
        return messages.filter(msg => !!msg).map(msg => `${fieldName}: ${msg}`);
      });

      if (formattedErrors.length > 0) {
        return {
          title: problem.title || 'One or more validation errors occurred.',
          details: formattedErrors,
        };
      }
    }

    // Handle standard ProblemDetails
    const details = [];
    if (problem.detail) {
      details.push(problem.detail);
    }
    return {
      title: problem.title || defaultMessage,
      details: details,
    };
  }

  // Handle standard JavaScript Error objects
  if (error instanceof Error) {
    // Special case for network errors
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
        return { title: 'Network Error', details: ['Could not connect to the server. Please check your internet connection.'] };
    }
    const title = error.name !== 'Error' ? error.name : defaultMessage;
    return { title, details: [error.message] };
  }

  // Handle plain string errors
  if (typeof error === 'string') {
    return { title: defaultMessage, details: [error] };
  }

  // Fallback for unknown error types
  return { title: defaultMessage, details: [] };
}
