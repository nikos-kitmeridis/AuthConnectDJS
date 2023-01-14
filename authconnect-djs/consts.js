export const WEB_REDIRECT_URL = "https://authconnect-djs.web.app/redir.html";
export const POLL_INTERVAL = 1000 * 5;
export const POLL_EXPIRY = 1000 * 60 * 5;
export const FIREBASE_CONFIG = {
    apiKey: "AIzaSyAqT874VwH5zS2rx4G5ke935PNj_GszTww",
    authDomain: "authconnect-djs.firebaseapp.com",
    projectId: "authconnect-djs",
    storageBucket: "authconnect-djs.appspot.com",
    messagingSenderId: "343281822649",
    appId: "1:343281822649:web:e07c207b706944470de468"
};

export const SERVICES = {
    spotify: {
        authUrl: "https://accounts.spotify.com/authorize?client_id={{CLIENT_ID}}&response_type=code&redirect_uri={{REDIR}}&scope={{SCOPE}}&state={{STATE}}",
        authCodeExchangeUrl: "https://accounts.spotify.com/api/token",
    },
    google: {
        authUrl: "https://accounts.google.com/o/oauth2/v2/auth?client_id={{CLIENT_ID}}&response_type=code&redirect_uri={{REDIR}}&scope={{SCOPE}}&access_type=offline&state={{STATE}}",
        authCodeExchangeUrl: "https://oauth2.googleapis.com/token",
    }
};

export const generateRandomString = () => Math.random().toString(36).substring(2);
