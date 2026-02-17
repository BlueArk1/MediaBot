const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
ffmpeg.setFfmpegPath(ffmpegPath);

const fetch = (...args) => import("node-fetch").then(({ default: f }) => f(...args));

const { igdl } = require("btch-downloader");
const {
    Client,
    GatewayIntentBits,
    EmbedBuilder
} = require("discord.js");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const config = require("./config.json");
const channelTarget = "1373000402282217522";

const igRegex = /https?:\/\/(www\.)?instagram\.com\/\S+/i;

async function sendDownloadingMsg(channel) {
    try {
        return await channel.send("Downloading...");
    } catch (err) {
        console.error("Failed to send downloading message:", err);
    }
}

function extractUrl(str) {
    const urlMatch = str.match(/https?:\/\/\S+/);
    return urlMatch ? urlMatch[0] : null;
}

async function handleInstagram(message, url) {
    const m = await sendDownloadingMsg(message.channel);

    try {
        const data = await igdl(url);
        const hdUrl = data?.[0]?.url;
        if (!hdUrl) throw new Error("Failed to extract Instagram URL.");

        // Download raw media
        const response = await fetch(hdUrl);
        const buffer = Buffer.from(await response.arrayBuffer());

        // Check size before deciding to compress
        const sizeMB = buffer.length / 1024 / 1024;

        const embed = new EmbedBuilder()
            .setColor("Blue")
            .setTitle("Instagram video downloaded")
            .setTimestamp();

        if (sizeMB <= 10) {
            // Upload without compression
            await message.channel.send({
                embeds: [embed],
                files: [{ attachment: buffer, name: "video.mp4" }]
            });
        } else {
            // Compress using ffmpeg if size > 10 MB
            const input = path.join(__dirname, "input_temp.mp4");
            const output = path.join(__dirname, "output_compressed.mp4");

            fs.writeFileSync(input, buffer);

            await new Promise((resolve, reject) => {
                ffmpeg(input)
                    .outputOptions([
                        "-vf", "scale=640:-1",
                        "-b:v", "800k",
                        "-b:a", "64k",
                        "-preset", "fast"
                    ])
                    .on("end", resolve)
                    .on("error", reject)
                    .save(output);
            });

            const compressed = fs.readFileSync(output);
            const compressedSizeMB = compressed.length / 1024 / 1024;

            if (compressedSizeMB <= 10) {
                // Upload compressed video
                await message.channel.send({
                    embeds: [embed],
                    files: [{ attachment: compressed, name: "video.mp4" }]
                });
            } else {
                // Still too large, send direct link
                const tooBig = new EmbedBuilder()
                    .setColor("Orange")
                    .setTitle("Video extracted but too large after compression")
                    .setDescription("Direct link below:")
                    .addFields(
                        { name: "URL", value: hdUrl }
                    );

                await message.channel.send({ embeds: [tooBig] });
            }

            fs.unlinkSync(input);
            fs.unlinkSync(output);
        }

    } catch (err) {
        console.error(err);
        const errEmbed = new EmbedBuilder()
            .setColor("Orange")
            .setTitle("Instagram video error")
            .setDescription("Unable to download or upload the video.");

        await message.channel.send({ embeds: [errEmbed] });
    }

    if (m) m.delete().catch(() => { });
    message.delete().catch(() => { });
}


client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    if (message.channel.id !== channelTarget) return;

    const content = message.content;

    if (content === "!cute") {
        return message.reply("I am not cute! >~<");
    }

    if (igRegex.test(content)) {
        const url = extractUrl(content);
        if (url) return handleInstagram(message, url);
    }
});

// ----------------------------------------------------
client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);
});
client.login(config.token);
