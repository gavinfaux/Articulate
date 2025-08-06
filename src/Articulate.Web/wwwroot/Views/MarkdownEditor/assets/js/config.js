// Holds all configuration, initialized dynamically from the main view.
const config = {
    // Dynamic URLs from the view's dataset
    authUrl: '',
    authEndUrl: '',
    tokenUrl: '',
    currentUserUrl: '',
    editorPostUrl: '',
    articulateNodeId: null,

    // Static OAuth parameters
    oauth: {
        clientId: 'umbraco-back-office',
        redirectUri: window.location.href.split('?')[0], // The current URL without query params
        scope: 'umbraco-api',
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
    const { authUrl, authEndUrl, tokenUrl, currentUserUrl, editorPostUrl, articulateNodeId } = dataset;

    if (!authUrl || !editorPostUrl || !currentUserUrl || !tokenUrl || !authEndUrl || !articulateNodeId) {
        console.error("CRITICAL: One or more dataset values missing. The application cannot function.");
        throw new Error("Missing critical configuration from dataset.");
    }

    config.authUrl = authUrl;
    config.authEndUrl = authEndUrl;
    config.tokenUrl = tokenUrl;
    config.currentUserUrl = currentUserUrl;
    config.editorPostUrl = editorPostUrl;
    config.articulateNodeId = articulateNodeId;
}

export { config, initConfig };
