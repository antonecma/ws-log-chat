const WebSocketClient = require('websocket').client;
const http = require('http');
const path = require('path');
const readline = require('readline');
const process = require('process');

const gloader = require('gloader');

const nconf = gloader('nconf', 'file', ['servers', 'user'], 'json', path.join(__dirname, './conf'));


const client = new WebSocketClient();

nconf.use('servers');
console.log(`ws://${nconf.get('ws:host')}:${nconf.get('http:port')}`);
client.connect(`ws://${nconf.get('ws:host')}:${nconf.get('http:port')}/`);
client.on('connectFailed', (error)  => {
    console.log('Connect Error: ' + error.toString());
});