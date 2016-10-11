const WebSocketClient = require('websocket').client;
const WebSocketServer = require('websocket').server;
const http = require('http');
const co = require('co');
const path = require('path');
const gloader = require('gloader');

const nconf = gloader('nconf', 'file', ['servers'], 'json', path.join(__dirname, './conf'));


co(function* () {
    const server = http.createServer((req, res) => {
        console.log('client request for http server');
        res.writeHead(404);
        res.end();
    });

    server.listen(nconf.use('servers').get('http:port'), () => {
        console.log('http server is started');
    });
})
    .then((result) => {

    })
    .catch((err) => {
        console.log(err);
    });
