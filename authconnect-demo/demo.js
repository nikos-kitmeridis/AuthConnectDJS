import AuthConnect from "authconnect-djs";
import firebase from "firebase-admin";
import {Client, GatewayIntentBits} from "discord.js";
import { DISCORD_TOKEN, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, DATABASE_URL } from "./secrets.js";
import serviceAccount from "./firebase-admin-key.json" assert {type: "json"};

firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount),
    databaseURL: DATABASE_URL
});

const firestore = firebase.firestore();

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

const linker = {};

bot.login(DISCORD_TOKEN);

const linkedCallback = async (service, guildId) => {
    if(linker[guildId]) {
        linker[guildId].send(`Your server is now linked to ${service}!`);
        delete linker[guildId];
    }
}

bot.on("ready", () => {
    auth = new AuthConnect({
        google: {
            clientId: GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET
        }
    });
    auth.useFirestoreDataHandlers(firestore, "server_auth_data");
    auth.setLinkedCallback(linkedCallback);
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
            linker[message.guild.id] = message.member;
        }
    }

    if(message.guild !== null && message.content === "call an API") {
        if(await auth.isGuildLoggedIn("google", message.guild.id)) {
            const token = await auth.getAccessToken("google", message.guild.id);
            const expiryDate = await auth.getAccessTokenExpiryDate("google", message.guild.id);
            const refreshToken = await auth.getRefreshToken("google", message.guild.id);
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
                "```\n\n" +
                `This access token expires at \`${expiryDate.toISOString()}\`.\n` +
                `When the token expires, a new one will be generated using the refresh token \`${refreshToken}\`.`
            );
        } else {
            message.channel.send("This server is not logged in to Google. Have an administrator type `login`.");
        }
    }
});
