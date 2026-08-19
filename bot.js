const mineflayer = require('mineflayer');
const http = require('http');

// =========================
// Configuration
// =========================
const config = {
  host: 'pixelglitch.mcsh.io',
  port: 25565,
  username: 'mincraftarbic',
  version: '1.21.11',
  auth: 'offline',
  viewDistance: 'tiny'
};

const password = process.env.BOT_PASSWORD;

if (!password) {
  console.error('❌ BOT_PASSWORD is not set in Abasthan Environment Variables.');
  process.exit(1);
}

// Health server for Abasthan Web Service
const healthPort = Number(process.env.PORT || 3000);

http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Minecraft bot is running');
}).listen(healthPort, '0.0.0.0', () => {
  console.log(`🌐 Health server listening on port ${healthPort}`);
});

let bot = null;
let reconnectAttempts = 0;
let reconnectTimer = null;
let loginHandled = false;

const reconnectDelay = 5000;

function scheduleReconnect() {
  if (reconnectTimer) return;

  const delay = Math.min(
    reconnectDelay * Math.pow(1.5, Math.min(reconnectAttempts, 8)),
    300000
  );

  reconnectAttempts++;

  console.log(`⏳ Reconnecting in ${delay / 1000} seconds...`);

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    createBot();
  }, delay);
}

function handleNLoginMessage(text) {
  const msg = text.toLowerCase();

  if (
    (msg.includes('login') ||
      msg.includes('log in') ||
      msg.includes('entrar')) &&
    !loginHandled
  ) {
    loginHandled = true;

    console.log('🔐 nLogin requested login. Sending /login...');

    setTimeout(() => {
      if (bot) {
        bot.chat(`/login ${password}`);
      }
    }, 500);

    return;
  }

  if (
    (msg.includes('register') ||
      msg.includes('registr') ||
      msg.includes('not registered') ||
      msg.includes('unregistered')) &&
    !loginHandled
  ) {
    loginHandled = true;

    console.log('📝 nLogin requested registration. Sending /register...');

    setTimeout(() => {
      if (bot) {
        bot.chat(`/register ${password} ${password}`);
      }
    }, 500);
  }

  if (
    msg.includes('already registered') &&
    !loginHandled
  ) {
    loginHandled = true;

    console.log('🔐 Account already registered. Sending /login...');

    setTimeout(() => {
      if (bot) {
        bot.chat(`/login ${password}`);
      }
    }, 500);
  }
}

function createBot() {
  loginHandled = false;

  try {
    console.log(`🚀 Connecting to ${config.host}:${config.port}...`);

    bot = mineflayer.createBot({
      host: config.host,
      port: config.port,
      username: config.username,
      version: config.version,
      auth: config.auth,
      viewDistance: config.viewDistance
    });

    bot.once('login', () => {
      console.log(`✅ Connected as ${bot.username}`);
      reconnectAttempts = 0;
    });

    bot.once('spawn', () => {
      console.log('✅ Spawned in world');

      setTimeout(() => {
        if (!bot || loginHandled) return;

        console.log('🔐 Sending /login...');

        bot.chat(`/login ${password}`);
      }, 2500);
    });

    bot.on('messagestr', (message) => {
      console.log(`📩 Server: ${message}`);
      handleNLoginMessage(message);
    });

    bot.on('chat', (username, message) => {
      if (username === bot.username) return;

      console.log(`💬 ${username}: ${message}`);

      if (
        message.toLowerCase().includes('hello') ||
        message.toLowerCase().includes('hi')
      ) {
        bot.chat(`Hello ${username}!`);
      }
    });

    bot.on('kicked', (reason) => {
      console.error(`❌ Kicked: ${JSON.stringify(reason)}`);

      bot = null;
      scheduleReconnect();
    });

    bot.on('error', (err) => {
      console.error(`❌ Bot error: ${err.message}`);
    });

    bot.on('end', () => {
      console.log('🔌 Connection ended');

      bot = null;
      scheduleReconnect();
    });

  } catch (error) {
    console.error(`❌ Failed to create bot: ${error.message}`);

    bot = null;
    scheduleReconnect();
  }
}

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down bot...');

  if (bot) {
    bot.quit('shutdown');
  }

  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down bot...');

  if (bot) {
    bot.quit('shutdown');
  }

  process.exit(0);
});

console.log('🚀 Starting Minecraft bot...');

createBot();
