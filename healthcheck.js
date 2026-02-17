// healthcheck.js
const { Client, GatewayIntentBits } = require("discord.js");
const config = require("./config.json");

const client = new Client({
    intents: [GatewayIntentBits.Guilds],
    presence: { status: 'online' }
});

let healthy = false;

// Timeout if not connected within 10 seconds
const timeout = setTimeout(() => {
    process.exit(1);
}, 10000);

client.once("ready", () => {
    healthy = true;
    clearTimeout(timeout);
    client.destroy().then(() => process.exit(0));
});

client.login(config.token).catch(() => process.exit(1));