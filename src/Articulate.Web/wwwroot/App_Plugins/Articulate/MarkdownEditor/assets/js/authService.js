/* Simple OAuth2 client for Articulate
alternative: oidc-client-ts: replace auth calls with this library:
<script src="https://cdn.jsdelivr.net/npm/oidc-client-ts@3.3.0/dist/browser/oidc-client-ts.min.js" integrity="sha256-DYkis2iqspb2cTcme2DYHL8VsYe2sRBkFzb+pVBfNkQ=" crossorigin="anonymous"></script>
[authorization-code-grant-with-pkce](https://github.com/authts/oidc-client-ts/blob/main/docs/protocols/authorization-code-grant-with-pkce.md)
*/

import { config } from './config.js';

// Helper functions for PKCE
async function generateCodeChallenge(codeVerifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return base64urlencode(digest);
}

function generateRandomString(length) {
    const array = new Uint32Array(length / 2);
    window.crypto.getRandomValues(array);
    return Array.from(array, dec => ('0' + dec.toString(16)).slice(-2)).join('');
}

function base64urlencode(buffer) {
    return btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

// Token and session management
function getAccessToken() {
    const key = config.storageKeys.accessToken;
    const sessionToken = sessionStorage.getItem(key);
    if (sessionToken) {
        return sessionToken;
    }

    // Migrate any legacy tokens that might still exist in localStorage.
    const legacyToken = localStorage.getItem(key);
    if (legacyToken) {
        sessionStorage.setItem(key, legacyToken);
        localStorage.removeItem(key);
        return legacyToken;
    }

    return null;
}

function setAccessToken(token) {
    const key = config.storageKeys.accessToken;
    if (token) {
        sessionStorage.setItem(key, token);
        localStorage.removeItem(key);
    }
}

function clearAccessToken() {
    const key = config.storageKeys.accessToken;
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
}

// Main authentication functions
async function redirectToLogin() {
    const state = generateRandomString(32);
    const codeVerifier = generateRandomString(128);

    sessionStorage.setItem(config.storageKeys.oauthState, state);
    sessionStorage.setItem(config.storageKeys.codeVerifier, codeVerifier);

    const codeChallenge = await generateCodeChallenge(codeVerifier);

    const params = new URLSearchParams({
        client_id: config.oauth.clientId,
        redirect_uri: config.oauth.redirectUri,
        response_type: config.oauth.responseType,
        scope: config.oauth.scope,
        state: state,
        code_challenge: codeChallenge,
        code_challenge_method: config.oauth.codeChallengeMethod,
    });

    window.location.href = `${config.authUrl}?${params.toString()}`;
}

async function handleLoginCallback() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const storedState = sessionStorage.getItem(config.storageKeys.oauthState);
    const codeVerifier = sessionStorage.getItem(config.storageKeys.codeVerifier);

    // Clean up URL and session storage
    window.history.replaceState({}, document.title, window.location.pathname);
    sessionStorage.removeItem(config.storageKeys.oauthState);
    sessionStorage.removeItem(config.storageKeys.codeVerifier);

    if (!code || !state || state !== storedState) {
        throw new Error('Invalid state or code from authentication server.');
    }

    if (!codeVerifier) {
        throw new Error('Code verifier not found in session storage.');
    }

    const tokenResponse = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: config.oauth.redirectUri,
            client_id: config.oauth.clientId,
            code_verifier: codeVerifier,
        }),
    });

    if (!tokenResponse.ok) {
        throw new Error('Failed to exchange authorization code for access token.');
    }

    const tokenData = await tokenResponse.json();
    setAccessToken(tokenData.access_token);

    const sessionEstablished = await ensureBackOfficeSession();
    if (!sessionEstablished) {
        throw new Error('Back-office session could not be established.');
    }
}

async function ensureBackOfficeSession() {
    // Rely on bearer tokens for Management API access; no cookie bootstrap required.
    // Keeping this function to maintain call sites and future extensibility.
    const token = getAccessToken();
    return Boolean(token);
}

async function logout() {
    const token = getAccessToken();

    try {
        if (token) {
            await fetch(config.authEndUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        }
    } catch (error) {
        console.warn('[authService] Failed to sign out from Umbraco.', error);
    } finally {
        clearAccessToken();
        // Reload current path to reinitialize the app into the login step.
        window.location.href = window.location.pathname;
    }
}

export const authService = {
    redirectToLogin,
    handleLoginCallback,
    getAccessToken,
    ensureBackOfficeSession,
    logout
};
