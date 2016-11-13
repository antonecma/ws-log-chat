'use strict';

const co = require('co');
const path = require('path');
const stampit = require('stampit');
const secure = require('./secure');
const socketIOClient = require('socket.io-client');

const wssClientMethods = {
    /**
     * Create wss socket and add to private 'clients' property
     * @param {String} serverUrl - url of wss server
     * @returns {Promise}
     * @resolve {Objects} wssClient object
     */
    create(serverUrl){

        return co.call(this, function* () {

            if(!this.key || !this.cert || !this.ca) {
                throw new Error(`WSSS-client secure error. Key : ${this.key}, cert : ${this.cert}, ca : ${this.ca}`);
            }

            const socket = socketIOClient(serverUrl, { key : this.key, cert : this.cert, ca : this.ca});

            socket.io.reconnectionAttempts(this.reconnectAttempt);

            yield new Promise((resolve, reject) => {
                socket.on('connect', () => {
                    this.addClient(socket);
                    resolve();
                });
                socket.on('connect_error', (err) => {
                    reject('Web socket connection is rejected');
                });
            });

        });

    }
};

const wssClientProperties = {
    reconnectAttempt : 1
};

const wssClientInitFunction  = (opts, {instance}) => {
    let clients = null;
    /**
     * Add socket to clients private property
     * @param {socket} socket
     * @returns {wssClientObject} - current wssClientObject
     */
    instance.addClient = (socket) => {

        if(!clients) {
            clients = [];
        }

        clients.push(socket);

        return instance;
    };
    /**
     * Return all client sockets
     */
    instance.getClients = () => {
        return clients;
    };
};

module.exports = stampit
    .init(wssClientInitFunction)
    .props(wssClientProperties)
    .methods(wssClientMethods)
    .compose(secure);