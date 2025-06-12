import type { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import {
  UMB_NOTIFICATION_CONTEXT,
  UmbNotificationColor,
} from "@umbraco-cms/backoffice/notification";

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
  const notificationContext = await contextHost.getContext(UMB_NOTIFICATION_CONTEXT);
  notificationContext.peek(type, {
    data: { message },
  });
}
