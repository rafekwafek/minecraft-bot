const mineflayer = require('mineflayer');
const http = require('http');

const config = {
  host: 'pixelglitch.mcsh.io',
  port: 25565,
  username: 'mincraftarbic',
  version: '1.21.11',
  auth: 'offline',
  viewDistance: 'tiny'
};

// nLogin password
const password = 'MincraftArbic_7X9!Q2';

// Health server for Abasthan Web Service
const healthPort = Number(process.env.PORT || 3000);

http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Minecraft bot is running');
}).listen(healthPort, '0.0.0.0', () => {
  console.log(`Health server listening on port ${healthPort}`);
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

  console.log(`Reconnecting in ${delay / 1000} seconds...`);

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    createBot();
  }, delay);
}

function sendLogin() {
  if (!bot) return;

  loginHandled = true;

  console.log('Sending /login...');

  setTimeout(() => {
    if (bot) {
      bot.chat(`/login ${password}`);
    }
  }, 500);
}

function sendRegister() {
  if (!bot) return;

  loginHandled = true;

  console.log('Sending /register...');

  setTimeout(() => {
    if (bot) {
      bot.chat(`/register ${password} ${password}`);
    }
  }, 500);
}

function handleNLoginMessage(text) {
  const msg = text.toLowerCase();

  if (
    msg.includes('already registered') ||
    msg.includes('already exists')
  ) {
    sendLogin();
    return;
  }

  if (
    msg.includes('not registered') ||
    msg.includes('unregistered') ||
    msg.includes('register') ||
    msg.includes('registr')
  ) {
    sendRegister();
    return;
  }

  if (
    msg.includes('login') ||
    msg.includes('log in') ||
    msg.includes('password')
  ) {
    sendLogin();
  }
}

function createBot() {
  loginHandled = false;

  try {
    console.log(`Connecting to ${config.host}:${config.port}...`);

    bot = mineflayer.createBot({
      host: config.host,
      port: config.port,
      username: config.username,
      version: config.version,
      auth: config.auth,
      viewDistance: config.viewDistance
    });

    bot.once('login', () => {
      console.log(`Connected as ${bot.username}`);
      reconnectAttempts = 0;
    });

    bot.once('spawn', () => {
      console.log('Spawned in world');

      setTimeout(() => {
        if (!bot || loginHandled) return;

        sendLogin();
      }, 2500);
    });

    bot.on('messagestr', (message) => {
      console.log(`Server: ${message}`);

      if (!loginHandled) {
        handleNLoginMessage(message);
      }
    });

    bot.on('chat', (username, message) => {
      if (username === bot.username) return;

      console.log(`${username}: ${message}`);
    });

    bot.on('kicked', (reason) => {
      console.error(`Kicked: ${JSON.stringify(reason)}`);

      bot = null;
      scheduleReconnect();
    });

    bot.on('error', (err) => {
      console.error(`Bot error: ${err.message}`);
    });

    bot.on('end', () => {
      console.log('Connection ended');

      bot = null;
      scheduleReconnect();
    });

  } catch (error) {
    console.error(`Failed to create bot: ${error.message}`);

    bot = null;
    scheduleReconnect();
  }
}

process.on('SIGINT', () => {
  console.log('Shutting down bot...');

  if (bot) {
    bot.quit('shutdown');
  }

  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down bot...');

  if (bot) {
    bot.quit('shutdown');
  }

  process.exit(0);
});

console.log('Starting Minecraft bot...');

createBot();
