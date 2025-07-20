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
    return localStorage.getItem(config.storageKeys.accessToken);
}

function setAccessToken(token) {
    localStorage.setItem(config.storageKeys.accessToken, token);
}

function clearAccessToken() {
    localStorage.removeItem(config.storageKeys.accessToken);
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
}

function logout() {
    clearAccessToken();
    // For a full sign-out,redirect to the end session endpoint.
    window.location.href = config.authEndUrl;
}

export const authService = {
    redirectToLogin,
    handleLoginCallback,
    getAccessToken,
    logout
};