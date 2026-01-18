const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');

// Configuration - Set these as environment variables
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
const BOT_ID = process.env.BOT_ID;

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// When bot is ready
client.once('ready', () => {
  console.log(`✅ Bot is online as ${client.user.tag}`);
  console.log(`🤖 Bot ID: ${client.user.id}`);
});

// Listen for messages
client.on('messageCreate', async (message) => {
  try {
    // Ignore messages from bots
    if (message.author.bot) return;

    // Check if bot was mentioned
    const wasMentioned = message.mentions.users.has(BOT_ID) || 
                         message.mentions.users.has(client.user.id);

    if (wasMentioned) {
      console.log(`📨 Message from ${message.author.username}: ${message.content}`);

      // Prepare data to send to n8n
      const payload = {
        type: 0,
        content: message.content,
        mentions: message.mentions.users.map(user => ({
          id: user.id,
          username: user.username,
          bot: user.bot
        })),
        id: message.id,
        channel_id: message.channel.id,
        author: {
          id: message.author.id,
          username: message.author.username,
          bot: message.author.bot,
          global_name: message.author.globalName
        },
        timestamp: message.createdAt.toISOString()
      };

      // Send to n8n webhook
      const response = await axios.post(N8N_WEBHOOK_URL, payload, {
        headers: { 'Content-Type': 'application/json' }
      });

      console.log('✅ Sent to n8n successfully');

      // If n8n returns a response, send it back to Discord
      if (response.data && response.data.reply) {
        await message.reply(response.data.reply);
        console.log('✅ Replied to Discord');
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    // Optionally send error message to Discord
    try {
      await message.reply('Sorry, I encountered an error processing your message.');
    } catch (replyError) {
      console.error('❌ Could not send error message:', replyError.message);
    }
  }
});

// Login to Discord
client.login(DISCORD_TOKEN)
  .then(() => console.log('🔑 Logging in to Discord...'))
  .catch(error => {
    console.error('❌ Failed to login:', error.message);
    process.exit(1);
  });

// Handle errors
process.on('unhandledRejection', error => {
  console.error('❌ Unhandled promise rejection:', error);
});