const WebSocketClient = require('websocket').client;
const http = require('http');
const path = require('path');
const gloader = require('gloader');

const nconf = gloader('nconf', 'file', ['servers', 'user'], 'json', path.join(__dirname, './conf'));


const client = new WebSocketClient();

client.on('connectFailed', function(error) {
    console.log('Connect Error: ' + error.toString());
});
client.on('connect',(connection) => {
    console.log('connected');
    connection.sendUTF('Hello server!');
    connection.on('message', (message) => {
        if (message.type === 'utf8') {
            console.log(message.utf8Data);
        }
    });
});
const createWSConnectionString = () => {
    const host = `ws://${nconf.use('servers').get('ws:host')}:${nconf.get('http:port')}`;
    const protocols = nconf.get('ws:protocols');
    const origin = nconf.use('user').get('service');
    const headers = {'auth' : `${nconf.use('user').get('login')}:${nconf.use('user').get('password')}`};
    return [host, protocols, origin, headers];
};
client.connect(...(createWSConnectionString()));
