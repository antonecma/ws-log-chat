'use strict';

const co = require('co');
const path = require('path');
const stampit = require('stampit');
const secure = require('./secure');
const pFS = require('./p-save-file');
const https = require('https');
const getPort = require('getport');
const socketio = require('socket.io');

const wssServerMethods = {
    /**
     *  Returns current socket address of https server (without family)
     * @returns {{address: String, port: Number}} - info about server address
     */
    getServerAddress(){

        const httpsServer = this.getHTTPSServer();
        const {address, port} = httpsServer.address();

        return {address, port};
    },
    /**
     * Return current url of https server
     * @returns {String} - url of https server
     */
    getServerUrl(){
        const {address, port} = this.getServerAddress();

        return `https://${address}:${port}`;
    },
    /**
     * Get free port for server between minHTTPSPort and maxHTTPSPort value
     * @returns {Promise}
     * @resolve {Number} - free port
     */
    getFreePortForServer(){
        return co.call(this, function* () {
            let freePort = null;

            yield new Promise((resolve, reject) => {
                getPort(this.minHTTPSPort, this.maxHTTPSPort, function (err, port) {
                    if(err){
                        reject(err);
                    } else {
                        freePort = port;
                        resolve(err);
                    }
                })
            });

            return freePort;
        });
    },
    /**
     * Add function to execute when even will be fired
     * @param {String} event - event
     * @param {Function} method - function that will be invoked
     * @resolve {Object} wssServerObject
     */
    addServerMiddleware(event, method){
        const wssServer = this.getWSSServer();
        (this.getServerMiddleware()).push({event : event, method : method});
        wssServer.on(event, method);
        return this;
    },
    /**
     * Add function to execute to all clients when even will be fired
     * @param {String} event - event
     * @param {Function} method - function that will be invoked
     * @resolve {Object} wssServerObject
     */
    addClientsMiddleware(event, method){

        //add middleware to storage
        (this.getClientsMiddleware()).push({event : event, method : method});

        //add listener to all clients
        (this.getClients()).forEach((client) => client.on(event, method));

        return this;
    },
    /**
     * Add all existing middleware to client
     * @param {Object} socket - socket of connected client
     * @returns {wssServerMethods}
     */
    addMiddlewareToClient(socket){

        const allMiddleware = this.getClientsMiddleware();

        allMiddleware.forEach((middleware) => {
            socket.on(middleware.event, middleware.method);
        });

        return this;
    }

};

const wssInitFunction  = (opts, {instance}) => {

    let httpsServer = null;
    let wssServer = null;
    let sockets = null;
    let clientsMiddleware = null;
    let serverMiddleware = null;
    /**
     * Create new HTTPS Server instance
     * @param {String} host - domain name or ipv4 address of server
     * @param {<String} caPaths - array of paths where trusted certs are located
     * @returns {Promise}
     * @resolve {Object} wssServerObject
     */
    instance.createHTTPS = ({host = 'localhost', caPaths} = {}) => {

        return co.call(instance, function* () {

            //if httpsServer was created before, then just close old instance of it
            if(this.getHTTPSServer()) {

                httpsServer.close((err) => {
                    if(err){
                        throw new Error(err);
                    }
                });
            }
            //load secure data from files

            yield this.loadSecureDataFromFile(this.keyPath, this.certPath);

            //load ca
            yield this.loadCA(caPaths);

            //add secure
            httpsServer = https.createServer({key : this.key, cert : this.cert, ca : this.ca,
                requestCert : true,
                rejectUnauthorized : true});

            //get new free port for server
            const freePort = yield this.getFreePortForServer();
            //start listening
            yield new Promise((resolve, reject) => {
                httpsServer.listen(freePort, host, (err) => {
                    err ? (httpsServer = null) : null;
                    err ? reject(err) : resolve(err);
                });
            });

            return this;
        });
    };
    /**
     * Returns HTTPS web server instance
     * @returns {Object} HTTPS web server object
     */
    instance.getHTTPSServer = () => {
        return httpsServer;
    };
    /**
     * Returns WSS server instance
     * @returns {Object} WSS server object
     */
    instance.getWSSServer = () => {
        return wssServer;
    };
    /**
     * Creates wss server based on private https server
     * @param {String} host - domain name or ipv4 address of server
     * @param {String[]} caPaths - array of paths where trusted certs are located
     * @returns {Promise}
     * @resolve {Object} wssServerObject
     */
    instance.createWSSServer = ({host = 'localhost', caPaths} = {}) => {

        return co.call(instance, function* () {

            if(this.wssServer){
                this.wssServer.close();
            }
            //create HTTPS Server
            yield this.createHTTPS({host, caPaths});

            (this.getHTTPSServer()).on('request', (request, response) => {
                response.writeHead(200);
                response.end();
            });

            //close all sockets, if exists
            const oldClients = this.getClients();

            if(oldClients){
                oldClients.forEach((client) => {
                    client.disconnect(true);
                });
                sockets = null;
            }

            wssServer = socketio(this.getHTTPSServer());

            wssServer.on('connection', (socket) => {

                if(!sockets){
                    sockets = [];
                }

                sockets.push(socket);

                socket.once('disconnect', () => {
                    this.deleteDisconnectedSocket(socket);
                });

                this.addMiddlewareToClient(socket);
            });

            return this;
        });
    };
    /**
     * Delete socket which disconnected
     * @param {Object} socket - socket to delete
     * @returns {wssServerObject} current wssServerObject
     */
    instance.deleteDisconnectedSocket = (socket) => {
        sockets.splice(sockets.indexOf(socket, 1));
        return this;
    };
    /**
     * Return private client sockets array
     * @returns {<Socket>[]} - array of client sockets
     */
    instance.getClients = () => {
        if(!sockets) {
            sockets = [];
        }
        return sockets;
    };
    /**
     * Return private server middleware functions array
     * @returns {<Function>[]} - array of middleware
     */
    instance.getServerMiddleware = () => {

        if(!serverMiddleware){
            serverMiddleware = [];
        }
        return serverMiddleware;
    };
    /**
     * Return private clients middleware functions array
     * @returns {<Function>[]} - array of middleware
     */
    instance.getClientsMiddleware = () => {

        if(!clientsMiddleware){
            clientsMiddleware = [];
        }
        return clientsMiddleware;
    };

};

const wssServerProperties = {
    conf : null,
    minHTTPSPort : 45433,
    maxHTTPSPort : 45533
};

module.exports = stampit.init(wssInitFunction)
    .methods(wssServerMethods)
    .props(wssServerProperties)
    .compose(secure);