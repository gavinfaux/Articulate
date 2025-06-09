import type { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import {
  UMB_NOTIFICATION_CONTEXT,
  UmbNotificationColor,
} from "@umbraco-cms/backoffice/notification";

export const reviewLogsMessage = "Review back office logs for more details.";

/**
 * Shows a global Umbraco notification.
 * @param contextHost The LitElement (or other context consumer) instance, typically 'this', that can provide the UMB_NOTIFICATION_CONTEXT.
 * @param message The message to display.
 * @param type The type of notification: UmbNotificationColor - '' | 'default' | 'positive' | 'warning' | 'danger';
 */
export async function showUmbracoNotification(
  contextHost: UmbLitElement,
  message: string,
  type: UmbNotificationColor,
): Promise<void> {
  try {
    const notificationContext = await contextHost.getContext(UMB_NOTIFICATION_CONTEXT);
    if (notificationContext) {
      notificationContext.peek(type, {
        data: { message },
      });
    } else {
      console.error(
        "showUmbracoNotification: UMB_NOTIFICATION_CONTEXT not found. Unable to show notification.",
      );
    }
  } catch (e) {
    console.error("showUmbracoNotification: Failed to show Umbraco notification:", e);
  }
}

/**
 * Sets the form message state on a component.
 * @param component The component with _formMessageType and _formMessageText properties.
 * @param type The type of message: "positive" | "error" | "".
 * @param message The message to display.
 */
export function setFormMessage(
  component: { _formMessageType: string; _formMessageText: string },
  type: "positive" | "error" | "",
  message: string,
) {
  component._formMessageType = type;
  component._formMessageText = message;
}
