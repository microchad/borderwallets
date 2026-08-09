const fastify = require('fastify')();
const path = require('path');
const WebSocket = require('ws');

// Bind to loopback only: this is a local development server that serves a seed
// tool, and there is no reason for it to be reachable from the LAN.
const wss = new WebSocket.Server({ host: '127.0.0.1', port: 8080 });
let serverRestarted = true;
wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    if (message !== 'ping') {
      console.log(`Received message => ${message}`);
    } else {
      console.log('pong');
    }
  });
  ws.send('ho!');
  if (serverRestarted) {
    ws.send('reload');
    serverRestarted = false;
  }
});

fastify.register(require('fastify-static'), {
  root: path.join(__dirname, 'www'),
});

fastify.get('/', function (req, reply) {
  return reply.sendFile('dev.html');
});

// Run the server!
const start = async () => {
  try {
    await fastify.listen(3000, '127.0.0.1');
    console.log(' Serving to http://127.0.0.1:3000/');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
