// Holds all configuration, initialized dynamically from the main view.
const config = {
    // Dynamic URLs from the view's dataset
    authUrl: '',
    authEndUrl: '',
    tokenUrl: '',
    currentUserUrl: '',
    editorPostUrl: '',
    articulateBlogNode: null,
    isBackOfficeLoggedIn: false,

    // Static OAuth parameters
    oauth: {
        clientId: '',
        redirectUri: window.location.href.split('?')[0], // The current URL without query params
        scope: 'openid',
        responseType: 'code',
        codeChallengeMethod: 'S256',
    },

    // Keys for browser storage
    storageKeys: {
        accessToken: 'articulate_access_token',
        codeVerifier: 'articulate_code_verifier',
        oauthState: 'articulate_oauth_state',
    }
};

/**
 * Initializes the configuration object with dynamic values from the DOM.
 * @param {DOMStringMap} dataset The dataset from the document body.
 */
function initConfig(dataset) {
    const { authUrl, authEndUrl, tokenUrl, currentUserUrl, editorPostUrl, articulateBlogNode, oauthClientId, backofficeLoggedIn } = dataset;

    if (!authUrl || !editorPostUrl || !currentUserUrl || !tokenUrl || !authEndUrl || !articulateBlogNode || typeof backofficeLoggedIn === "undefined") {
        console.error("CRITICAL: One or more dataset values missing. The application cannot function.");
        throw new Error("Missing critical configuration from dataset.");
    }

    const trimmedClientId = typeof oauthClientId === "string" ? oauthClientId.trim() : "";
    if (!trimmedClientId) {
        console.error("CRITICAL: OAuth client configuration missing.");
        throw new Error("Missing OAuth client configuration.");
    }

    config.authUrl = authUrl;
    config.authEndUrl = authEndUrl;
    config.tokenUrl = tokenUrl;
    config.currentUserUrl = currentUserUrl;
    config.editorPostUrl = editorPostUrl;
    const normalizedBackoffice = typeof backofficeLoggedIn === "string" ? backofficeLoggedIn.trim().toLowerCase() : "";
    config.isBackOfficeLoggedIn = normalizedBackoffice === "true" || normalizedBackoffice === "1";
    config.articulateBlogNode = articulateBlogNode;
    config.oauth.clientId = trimmedClientId;
}

export { config, initConfig };

