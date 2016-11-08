'use strict';

const co = require('co');
const path = require('path');
const stampit = require('stampit');
const secure = require('./secure');
const https = require('https');
const getPort = require('getport');

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
    /**
     * Create new HTTPS Server instance
     * @param {String} host - domain name or ipv4 address of server
     * @param {Number} port - port of server
     * @param {String | Buffer} key - private key of server
     * @param {String | Buffer} cert - cert of server
     * @param {<String | Buffer>[]} ca - array of trusted certs
     * @returns {Promise}
     * @resolve {Object} wssServerObject
     */
    instance.createHTTPS = ({host = 'localhost', port, key, cert, ca} = {}) => {

        return co.call(this, function* () {

            //if httpsServer was created before, then just return close old instance of it
            if(instance.getHTTPSServer()) {
                yield new Promise((resolve, reject) => {
                    httpsServer.close((err) => {
                        err ? reject(err) : resolve(err);
                    });
                });
            }

            //add secure
            httpsServer = https.createServer({key, cert, ca});

            //start listening
            yield new Promise((resolve, reject) => {
                httpsServer.listen(port, host, (err) => {
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
    }
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