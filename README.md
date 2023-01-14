# AuthConnectDJS
Plug-and-play solution for adding Google, Spotify, etc auth to your DiscordJS projects where you access external APIs.

# Learn By Example
I've made plenty of open-source Discord bots which use this package:

WIP

# Installation
Coming soon to NPM!

# Google Cloud setup
1. From the Google Cloud Console, go to `APIs & Services` > `Credentials`.
2. Add an OAuth Client ID.
3. Add the following string as an Authorized Redirect URI: `https://authconnect-djs.web.app/redir.html`. This will allow your app to redirect to our website which will beam the data to your Discord bot.

# Quickstart: Example Usage
```js
TODO
```

# Extensibility and Avanced Usage

## Easy local file data storage solution
If you want an easy way to store your auth data in a local file, you can simply call the function `useDefaultDataHandlers(filePath)`. See API Reference for usage.

## Easy Firebase Firestore data storage solution
If you want to store your auth data in Firebase Firestore, you can simply call the function `useFirestoreDataHandlers(firestore, collectionName)`. See API Reference for usage.

```js
TODO: code example
```

## Custom data storage solution
If none of the built-in data storage solutions work for you and you have a database set up, you can change this behavior by overriding the credential store and retrieve functions. Just call `setDataHandlers`. (Detailed in API Reference section below)

These callbacks will be called every time token data is requested or updated, so you will want to implement some simple caching solution to avoid unnecessary database calls.

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

**Make sure you call `.bind()` on the functions you supply!**

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

# <3
Development by [Eric Yoon](https://yoonicode.com). PRs welcome. Licensed under GNU GPL v3; see LICENSE for details.