import AuthConnect from "../../authconnect-djs/AuthConnect.js";
import {Client, GatewayIntentBits} from "discord.js";
import { DISCORD_TOKEN, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from "./secrets.js";

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
    auth.useDefaultDataHandlers("./demo/auth-data.json");
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

    if(message.content === "call an API") {
        if(await auth.isGuildLoggedIn("google", message.guild.id)) {
            const token = auth.getAccessToken("google", message.guild.id);
            message.channel.send("The token is: " + token);
            // Now you can use this token to call Google APIs!
        }
    }
});
