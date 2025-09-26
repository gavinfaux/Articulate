/**
 * Displays a modal dialog.
 * @param {HTMLDialogElement} dialogElement The dialog element from the DOM.
 * @param {object} dialogState The reactive state object for the dialog in Alpine.
 * @param {string} title The title of the dialog.
 * @param {string} message The message content of the dialog.
 * @param {function} onConfirm The callback function to execute when the confirmation button is clicked.
 * @param {string} buttonText Optional text for the confirmation button.
 */
function showDialog(dialogElement, dialogState, title, message, onConfirm, buttonText) {
    dialogState.title = title;
    dialogState.message = message;
    dialogState.onConfirm = onConfirm || (() => {}); // Default to an empty function
    dialogState.buttonText = buttonText || 'OK';

    if (dialogElement && typeof dialogElement.showModal === 'function' && !dialogElement.open) {
        dialogElement.showModal();
    }
}

export const uiService = {
    showDialog,
};
