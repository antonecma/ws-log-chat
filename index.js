const WebSocketServer = require('websocket').server;
const http = require('http');
const co = require('co');
const path = require('path');
const gloader = require('gloader');

const nconf = gloader('nconf', 'file', ['servers', 'auth'], 'json', path.join(__dirname, './conf'));


co(function* () {
    const server = http.createServer((req, res) => {
        console.log('client request for http server');
        res.writeHead(404);
        res.end();
    });

    server.listen(nconf.use('servers').get('http:port'), () => {
        console.log('http server is started');
    });

    const wsServer = new WebSocketServer({
        httpServer : server,
        autoAcceptConnections: false
    });

    const findUser = ({user, password}) => {
        const clients = nconf.use('auth').get('clients');
        const loginPassword = clients.find((client) => {
            return (client.user == user && client.password == password);
        });
        return loginPassword;
    };
    const getAuthInfo = (headers) => {
        const info = headers.auth;

        let user = null;
        let password =null;

        if(info){
            user = info.split(':')[0];
            password = info.split(':')[1];
        }
        return {user, password};
    };
    const isAuthWSClient = (info) => {
        if(findUser(getAuthInfo(info.httpRequest.headers))){
            return true;
        } else {
            return false;
        }

    };

    wsServer.on('request', (req) => {

        if(isAuthWSClient(req)){
            console.log('client is connected');
            const connection = req.accept(null, null);
            connection.sendUTF('Server : Hello user!');
            connection.on('message', (message) => {
                console.log(message.utf8Data);
            });
        } else {
            req.reject();
        }
    });
})
    .then((result) => {

    })
    .catch((err) => {
        console.log(err);
    });
