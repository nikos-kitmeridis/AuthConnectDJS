export const WEB_REDIRECT_URL = "https://authconnect-djs.web.app/redir.html";
export const POLL_INTERVAL = 1000 * 5;
export const POLL_EXPIRY = 1000 * 60 * 5;

export const SERVICES = {
    spotify: {
        authUrl: "https://accounts.spotify.com/authorize?client_id={{CLIENT_ID}}&response_type=code&redirect_uri={{REDIR}}&scope={{SCOPE}}&state={{STATE}}"
    },
    google: {
        authUrl: "https://accounts.google.com/o/oauth2/v2/auth?client_id={{CLIENT_ID}}&response_type=code&redirect_uri={{REDIR}}&scope={{SCOPE}}&access_type=offline&state={{STATE}}"
    }
};

export const generateRandomString = () => Math.random().toString(36).substring(2);
