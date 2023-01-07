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
});

bot.on("message", async message => {
    if(message.guild !== null && message.content === "login" && message.member.permissions.has("ADMINISTRATOR")) {
        if(auth.isGuildLoggedIn("google", message.guild.id)) {
            message.channel.send("This server already has a Google account associated with it.");
        } else {
            const url = await auth.generateAuthURL("google", message.guild.id);
            message.channel.send(`Please visit this URL to log in: ${url}`);
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

### Custom credential storage solution
By default, AuthConnect stores tokens for each server in a local JSON file called `credentials.json`, as an easy way for amateur developers to get started.

If your bot is more robust and you have a database set up, you can change this behavior by overriding the credential store and retrieve functions. (WIP)

These callbacks will be called every time token data is requested or updated, so you will want to implement some simple caching solution to avoid unnecessary database calls.

## <3
Development by [Eric Yoon](https://yoonicode.com). PRs welcome. Licensed under GNU GPL v3; see LICENSE for details.