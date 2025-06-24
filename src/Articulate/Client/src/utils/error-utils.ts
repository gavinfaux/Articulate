import { ProblemDetails } from "../api/articulate";

export async function handleApiError(response: Response, defaultMessage: string): Promise<string> {
  let errorDetails: ProblemDetails;
  try {
    errorDetails = await response.json();
  } catch {
    errorDetails = { title: `${response.status} ${response.statusText}` };
  }

  return errorDetails.title && errorDetails.detail
    ? `${errorDetails.title}: ${errorDetails.detail}`
    : errorDetails.title || defaultMessage;
}
