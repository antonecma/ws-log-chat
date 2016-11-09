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
    }
};

const wssInitFunction  = (opts, {instance}) => {

    let httpsServer = null;
    let wssServer = null;

    /**
     * Create new HTTPS Server instance
     * @param {String} host - domain name or ipv4 address of server
     * @param {<String | Buffer>[]} caPaths - array of paths where trusted certs are located
     * @returns {Promise}
     * @resolve {Object} wssServerObject
     */
    instance.createHTTPS = ({host = 'localhost', caPaths} = {}) => {

        return co.call(instance, function* () {

            //if httpsServer was created before, then just close old instance of it
            if(this.getHTTPSServer()) {
                yield new Promise((resolve, reject) => {
                    httpsServer.close((err) => {
                        err ? reject(err) : resolve(err);
                    });
                });
            }
            //load secure data from files, if not loaded before
            if(!this.key && !this.cert){
                yield this.loadSecureDataFromFile(this.keyPath, this.certPath);
            }
            //read ca
            const ca = yield Promise.all(caPaths.map((caPath) => pFS.readFromFile(caPath)));

            //add secure
            httpsServer = https.createServer({key : this.key, cert : this.cert, ca : ca,
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
     * Creates wss serfer based on private https server
     * @returns {Promise}
     * @resolve {Object} wssServerObject
     */
    instance.createWSSServer = () => {

        return co.call(instance, function* () {
            (this.getHTTPSServer()).on('request', (request, response) => {
                console.log('https server request event');
                response.writeHead(200);
                response.end();
            });
            wssServer = socketio(this.getHTTPSServer());
            return this;
        });
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