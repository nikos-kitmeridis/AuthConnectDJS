# AuthConnectDJS
Plug-and-play solution for adding Google, Spotify, etc auth to your DiscordJS projects where you access external APIs.

## Learn By Example
I've made plenty of open-source Discord bots which use this package:

WIP

## Installation
Coming soon to NPM!

## Quickstart: Example Usage
```js
import DiscordAPI from "discord.js";
import AuthConnect from "authconnect-djs";

const bot = new DiscordAPI.Client();
let auth;

bot.login(DISCORD_TOKEN);

bot.on("ready", () => {
    auth = new AuthConnect(bot);
    auth.useDefaultDataHandlers("./auth-data.json"); // Use the default local file data storage solution
});

bot.on("message", async message => {
    if(message.guild !== null && message.content === "login" && message.member.permissions.has("ADMINISTRATOR")) {
        if(auth.isGuildLoggedIn("google", message.guild.id)) {
            message.channel.send("This server already has a Google account associated with it.");
        } else {
            const url = await auth.generateAuthURL("google", message.guild.id);
            message.member.send(`Please visit this URL to log in: ${url}`); // DM the link to the admin
        }
    }

    if(message.content === "call an API") {
        if(auth.isGuildLoggedIn("google", message.guild.id)) {
            const token = await auth.getAccessToken("google", message.guild.id);
            // Now you can use this token to call Google APIs!
        }
    }
});

```

## Extensibility and Avanced Usage

### Easy local file data storage solution
If you want an easy way to store your auth data in a local file, you can simply call the function `useDefaultDataHandlers(filePath)`. See API Reference for usage.

### Easy Firebase Firestore data storage solution
If you want to store your auth data in Firebase Firestore, you can simply call the function `useFirestoreDataHandlers(firestore, collectionName)`. See API Reference for usage.

```js
TODO: code example
```

### Custom data storage solution
If none of the built-in data storage solutions work for you and you have a database set up, you can change this behavior by overriding the credential store and retrieve functions. Just call `setDataHandlers`. (Detailed in API Reference section below)

These callbacks will be called every time token data is requested or updated, so you will want to implement some simple caching solution to avoid unnecessary database calls.

## API Reference

### class AuthConnect

#### constructor(client)
Parameter | Type | Description
--- | --- | ---
`client` | `DiscordJS.Client` | Your DiscordJS client object.

Creates the AuthConnect object. **Only call this function after your Discord bot has called the "ready" callback.**

### isGuildLoggedIn(service, guildId): boolean
Parameter | Type | Description
--- | --- | ---
`service` | string | The service to check (e.g. "google", "spotify").
`guildId` | string resolvable | The guild to check.

Checks if a guild has an account for a particular service associated with it.

### generateAuthUrl(service, guildId): string
Parameter | Type | Description
--- | --- | ---
`service` | string | The service to check (e.g. "google", "spotify").
`guildId` | string resolvable | The guild to check.

Generates an authorization URL for a guild admin to visit to link their account. This URL should then be sent to the guild admin via DM.

### getAccessToken(service, guildId): string
Parameter | Type | Description
--- | --- | ---
`service` | string | The service (e.g. "google", "spotify").
`guildId` | string resolvable | The guild for which to get the access token.

Gets the saved access token to use to call APIs. This function will automatically refresh the token if it has expired.

### setDataHandlers(onDataGet, onDataUpdate): void
Parameter | Type | Description
--- | --- | ---
`onDataGet` | function (see below) | A callback that should return the data for a guild.
`onDataUpdate` | function (see below) | A callback that should update the data for a guild.

Overrides the default local file data storage solution (see "Custom data storage solution"). Call this function right after you call the constructor.

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

### useDefaultDataHandlers(filePath): void
Parameter | Type | Description
--- | --- | ---
`filePath` | string | The path of the file in which to store the data.

Resets the data storage behavior to the default local file solution.

### useFirestoreDataHandlers(firestore, collectionName): void
Parameter | Type | Description
--- | --- | ---
`firestore` | [Firestore object](https://googleapis.dev/nodejs/firestore/latest/Firestore.html) | The Firestore object created by the Firestore Admin SDK.
`collectionName` | string | The path of the collection in which to store documents with guild token data.

This function overrides the data save/update handlers with a plug-and-play solution to save data to Firestore database. See "Easy Firebase Firestore data storage solution" for example code.

## <3
Development by [Eric Yoon](https://yoonicode.com). PRs welcome. Licensed under GNU GPL v3; see LICENSE for details.