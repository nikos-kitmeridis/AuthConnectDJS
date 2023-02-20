# AuthConnectDJS
Plug-and-play solution for adding Google, Spotify, etc auth to your DiscordJS projects where you access external APIs.

# Learn By Example
I've made plenty of open-source Discord bots which use this package:
- [Discord Playlist Saver](https://github.com/ericyoondotcom/discordplaylistsaver)
- [ReminderBot](https://github.com/ericyoondotcom/ReminderBot)

Or, for minimum code to get started, view the Quickstart section below!

# Installation
[Get it from NPM.](https://www.npmjs.com/package/authconnect-djs)
```bash
npm install authconnect-djs
```

# Service-specific setup

## Google Cloud
If you're using this package to interface with the Google API, follow the following steps:

1. From the Google Cloud Console, in the project you want to use, go to `APIs & Services` > `Credentials`.
2. Add an OAuth Client ID.
3. Add the following string as an Authorized Redirect URI: `https://authconnect-djs.web.app/redir.html`. This will allow your app to redirect to our website which will beam the data to your Discord bot.
4. Note your Client ID and your Client Secret. You'll need to paste these into your code (see Quickstart).

## Spotify
1. From the Spotify Developer Console, in the project you want to use, take note of the Client ID and Client Secret. You'll need to paste these into your code (see Quickstart).
2. Click "Edit Settings", and add the following string as an Authorized Redirect URI: `https://authconnect-djs.web.app/redir.html`. This will allow your app to redirect to our website which will beam the data to your Discord bot.

# Quickstart: Example Usage
```js
import AuthConnect from "authconnect-djs";
import {Client, GatewayIntentBits} from "discord.js";

// See section "Google Cloud setup" to learn how to get these secrets
const DISCORD_TOKEN = "123_your_discord_token_456";
const GOOGLE_CLIENT_ID = "123_your_google_client_id_456";
const GOOGLE_CLIENT_SECRET = "123_your_google_client_secret_456";

const bot = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ],
    partials: [
        "CHANNEL"
    ]
});
let auth;

bot.login(DISCORD_TOKEN);

bot.on("ready", () => {
    auth = new AuthConnect({
        google: {
            clientId: GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET
        }
    });

    // This is where your auth data will be stored on disk.
    // If you want to use Firestore or your own data storage solution, see README
    auth.useDefaultDataHandlers("./auth-data.json");
    console.log("Bot ready, and AuthConnect initialized.")
});

bot.on("messageCreate", async message => {
    if(message.guild !== null && message.content === "login" && message.member.permissions.has("ADMINISTRATOR")) {
        if(await auth.isGuildLoggedIn("google", message.guild.id)) {
            message.channel.send("This server already has a Google account associated with it.");
        } else {
            // Replace `https://www.googleapis.com/auth/youtube` with the scopes you want to request: https://developers.google.com/identity/protocols/oauth2/scopes
            const url = auth.generateAuthURL("google", message.guild.id, "https://www.googleapis.com/auth/youtube");
            message.channel.send("Please check your DMs for a link to log in.");
            message.member.send(`Please visit this URL to log in: ${url}`); // DM the link to the admin
        }
    }

    if(message.guild !== null && message.content === "call an API") {
        if(await auth.isGuildLoggedIn("google", message.guild.id)) {
            const token = await auth.getAccessToken("google", message.guild.id);

            // Now you can use this token to call Google APIs!
            message.channel.send(
                `My access token is \`${token}\`!\n` +
                "I can use this token to call a Google API, such as this Youtube search endpoint:\n" +
                "```js\n" +
                "await fetch('https://www.googleapis.com/youtube/v3/search', {\n" +
                "    headers: {\n" +
                `        'Authorization': 'Bearer ${token}',\n` +
                "        'Content-Type': 'application/json',\n" +
                "    },\n" +
                "});\n" +
                "```"
            );
        } else {
            message.channel.send("This server is not logged in to Google. Have an administrator type `login`.");
        }
    }
});
```

# Extensibility and Avanced Usage

## Easy local file data storage solution
If you want an easy way to store your auth data in a local file, you can simply call the function `useDefaultDataHandlers(filePath)`. See API Reference for usage.

## Easy Firebase Firestore data storage solution
If you want to store your auth data in Firebase Firestore, you can simply call the function `useFirestoreDataHandlers(firestore, collectionName)`. See API Reference for usage.

```js
// Copy the code from the Quickstart, but add the following lines:

import firebase from "firebase-admin";
// see https://stackoverflow.com/questions/70106880/err-import-assertion-type-missing-for-import-of-json-file
import serviceAccount from "./path/to/firebase-admin-key.json" assert {type: "json"};

// Firebase admin SDK details here: https://firebase.google.com/docs/admin/setup#add-sdk
firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount),
    databaseURL: "https://your-project-id.firebaseio.com"
});
const firestore = firebase.firestore();

// ... initialize discord, etc

bot.on("ready", () => {
    auth = new AuthConnect( /* ... */ );
    auth.useFirestoreDataHandlers(firestore, "server_auth_data"); // replace "server_auth_data" with the name of the collection in which you want to store auth data
});
```

## Custom data storage solution
If none of the built-in data storage solutions work for you and you have a database set up, you can change this behavior by overriding the credential store and retrieve functions. Just call `setDataHandlers`. (Detailed in API Reference section below)

# API Reference

## class AuthConnect

### constructor(client)
Parameter | Type | Description
--- | --- | ---
`serviceConstants` | object (see below) | An object with your client IDs and secrets for each service.

Creates the AuthConnect object.

#### serviceConstants
The `serviceConstants` object should be in the following format:
```js
{
    google: {
        clientId: string,
        clientSecret: string
    },
    spotify: {
        clientId: string,
        clientSecret: string
    },
    /* ... */
}
```

### async isGuildLoggedIn(service, guildId): boolean
Parameter | Type | Description
--- | --- | ---
`service` | string | The service to check (e.g. "google", "spotify").
`guildId` | string resolvable | The guild to check.

Checks if a guild has an account for a particular service associated with it.

### generateAuthURL(service, guildId, clientId, clientSecret, scope): string
Parameter | Type | Description
--- | --- | ---
`service` | string | The service to check (e.g. "google", "spotify").
`guildId` | string resolvable | The guild to check.
`clientId` | string | The client ID of your app for the service. See the service's documentation for how to get this. This string is directly passed as a URL parameter to the service's auth URL.
`clientId` | string | The client secret of your app for the service. See the service's documentation for how to get this. This string is directly passed as a URL parameter to the service's auth URL.
`scope` | string | The scopes to request from the service. See the service's documentation for a list of scopes. This string is directly passed as a URL parameter to the service's auth URL.

Generates an authorization URL for a guild admin to visit to link their account. This URL should then be sent to the guild admin via DM.

The user will be redirected to a Yoonicode-owned website which will upload their account token to our servers.
AuthConnect will then poll our servers for data every 5 seconds for 5 minutes, at which point you should consider the URL expired and have the user request a new one.

### async getAccessToken(service, guildId): string?
Parameter | Type | Description
--- | --- | ---
`service` | string | The service (e.g. "google", "spotify").
`guildId` | string resolvable | The guild for which to get the access token.

Gets the saved access token to use to call APIs. This function will automatically refresh the token if it has expired.

Returns `null` if no account has been linked yet. Otherwise, returns the access token.

> ⚠️ Note that for most services, you should prepend `Bearer ` to the token before you send your request.

### setDataHandlers(onDataGet, onDataUpdate): void
Parameter | Type | Description
--- | --- | ---
`onDataGet` | function (see below) | A callback that should return the data for a guild.
`onDataUpdate` | function (see below) | A callback that should update the data for a guild.

Overrides the default local file data storage solution (see "Custom data storage solution"). Call this function right after you call the constructor.

> **Make sure you call `.bind()` on the functions you supply!**

#### async onDataGet(service, guildId): object
This function should take two parameters, `service` and `guildId`, and return a Promise that returns the guild's data for the given service (e.g. "google", "spotify"), in the following format:
```json
{
    "refreshToken": string?,
    "accessToken": string?,
    "expiryDate": Date?
}
```

#### async onDataSet(service, guildId, newData): void
This function should take three parameters, `service`, `guildId` and `newData`, and return a Promise that sets the guild's data for the given service (e.g. "google", "spotify"), which will be in the following format:
```json
{
    "refreshToken": string?,
    "accessToken": string?,
    "expiryDate": Date?
}
```

> These callbacks will be called every time token data is requested or updated, so you will want to implement some simple caching solution to avoid unnecessary database calls.

### useDefaultDataHandlers(filePath): void
Parameter | Type | Description
--- | --- | ---
`filePath` | string | The path of the file in which to store the data.

Uses the default local file storage solution. Call this function right after you call the constructor.

### useFirestoreDataHandlers(firestore, collectionName): void
Parameter | Type | Description
--- | --- | ---
`firestore` | string | Your instance of Firestore from the `firebase-admin` SDK.
`collectionName` | string | The name of the collection in which to store the data.

See "Easy Firebase Firestore data storage solution" above.

Uses Firebase Firestore as a data storage solution. Call this function right after you call the constructor.

### setLinkedCallback(onLinked): void
Parameter | Type | Description
--- | --- | ---
`onLinked` | function (see below) | A function that is called whenever a user links their account.

It's often useful for a user to know when their account has been successfully linked. You can call a side effect, e.g. sending a DM to the user, by passing a callback to this function.

#### async onLinked(service, guildId): void
This function takes the parameters `service` and `guildId`.

# <3
Development by [Eric Yoon](https://yoonicode.com). PRs welcome. Licensed under GNU GPL v3; see LICENSE for details.