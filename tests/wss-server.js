'use strict';

const https = require('https');
const co = require('co');
const path = require('path');
const should = require('should');
const socketio = require('socket.io');
const socketioClient = require('socket.io-client');
const pFS = require('../helpers/p-save-file');
const wssServer = require('../helpers/wss-server')();

describe('wss-server helper', () => {

    it('should return free port for https server', (done) => {
        co(function* () {
            const freePort = yield wssServer.getFreePortForServer();
            freePort.should.be.within(wssServer.minHTTPSPort, wssServer.maxHTTPSPort);
        }).then(done, done);
    });

    it('should create https server', (done) => {
        co(function* () {

            //generate key and cert for server
            const securePath = __dirname;
            const keyPath = path.join(securePath, 'key');
            const certPath = path.join(securePath, 'cert');

            yield wssServer.updateServerSecureData();
            yield wssServer.saveServerSecureData(keyPath, certPath);

            //generate ca files
            let [firstCaCert, secondCaCert] = yield Promise.all([
                wssServer.generateServerSecureData(),
                wssServer.generateServerSecureData()
            ]);

            firstCaCert = firstCaCert.cert;
            secondCaCert = secondCaCert.cert;

            const [firstCaPath, secondCaPath] = [path.join(__dirname, 'ca1.cert'), path.join(__dirname, 'ca2.cert')];

            yield Promise.all([
                pFS.saveToFile(firstCaPath, firstCaCert),
                pFS.saveToFile(secondCaPath, secondCaCert)
            ]);

            //create HTTPS Server
            yield wssServer.createHTTPS({caPaths : [firstCaPath, secondCaPath]});

            //asserts
            const httpsServer = wssServer.getHTTPSServer();
            httpsServer.should.not.be.null();
            httpsServer.should.be.instanceOf(https.Server);

            //delete temporary files
            yield Promise.all([
                pFS.deleteFile(keyPath), pFS.deleteFile(certPath),
                pFS.deleteFile(firstCaPath), pFS.deleteFile(secondCaPath)
            ]);
        }).then(done, done);
    });

    it('should create wss server', (done) => {

        co(function* () {
            //generate key and cert for server
            const securePath = __dirname;
            const keyPath = path.join(securePath, 'key');
            const certPath = path.join(securePath, 'cert');

            yield wssServer.updateServerSecureData();
            yield wssServer.saveServerSecureData(keyPath, certPath);

            //generate ca files
            let [firstCaCert, secondCaCert] = yield Promise.all([
                wssServer.generateServerSecureData(),
                wssServer.generateServerSecureData()
            ]);

            firstCaCert = firstCaCert.cert;
            secondCaCert = secondCaCert.cert;

            const [firstCaPath, secondCaPath] = [path.join(__dirname, 'ca1.cert'), path.join(__dirname, 'ca2.cert')];

            yield Promise.all([
                pFS.saveToFile(firstCaPath, firstCaCert),
                pFS.saveToFile(secondCaPath, secondCaCert)
            ]);

            //create HTTPS Server
            yield wssServer.createHTTPS({caPaths : [firstCaPath, secondCaPath]});

            //create WSS Server
            yield  wssServer.createWSSServer();

            //asserts
            const wsss = wssServer.getWSSServer();
            wsss.should.not.be.null();
            wsss.should.be.instanceOf(socketio);

            //delete temporary files
            yield Promise.all([
                pFS.deleteFile(keyPath), pFS.deleteFile(certPath),
                pFS.deleteFile(firstCaPath), pFS.deleteFile(secondCaPath)
            ]);

        }).then(done, done);

    });

    it('should reject unauthorized (without cert signed by ca or ca cert) web socket', (done) => {

        co(function* () {
            //generate key and cert for server
            const securePath = __dirname;
            const keyPath = path.join(securePath, 'key');
            const certPath = path.join(securePath, 'cert');

            yield wssServer.updateServerSecureData();
            yield wssServer.saveServerSecureData(keyPath, certPath);

            //generate ca files
            let [firstCaCert, secondCaCert] = yield Promise.all([
                wssServer.generateServerSecureData(),
                wssServer.generateServerSecureData()
            ]);

            firstCaCert = firstCaCert.cert;
            secondCaCert = secondCaCert.cert;

            const [firstCaPath, secondCaPath] = [path.join(__dirname, 'ca1.cert'), path.join(__dirname, 'ca2.cert')];

            yield Promise.all([
                pFS.saveToFile(firstCaPath, firstCaCert),
                pFS.saveToFile(secondCaPath, secondCaCert)
            ]);

            //create HTTPS Server
            yield wssServer.createHTTPS({caPaths : [firstCaPath, secondCaPath]});

            //delete temporary files
            yield Promise.all([
                pFS.deleteFile(keyPath), pFS.deleteFile(certPath),
                pFS.deleteFile(firstCaPath), pFS.deleteFile(secondCaPath)
            ]);

            //create WSS Server
            yield  wssServer.createWSSServer();

            //make unauthorized websocket request
            const {address : httpsServerAddress, port : httpsServerPort} = wssServer.getServerAddress();
            const httpsServerUrl = `https://${httpsServerAddress}:${httpsServerPort}`;

            const wssSocket = socketioClient(httpsServerUrl, { timeout : 2000 });
            //set reconnection attempts to 2
            wssSocket.io.reconnectionAttempts(2);

            yield new Promise((resolve, reject) => {
                wssSocket.on('connect', () => {
                    reject('Web socket connection is established');
                });
                wssSocket.on('connect_error', () => {
                    resolve('Web socket connection is rejected');
                });
            });
        }).then(done, done);

    });

    it('should accept authorized (by cert) web socket', (done) => {

        co(function* () {
            //generate key and cert for server
            const securePath = __dirname;
            const keyPath = path.join(securePath, 'key');
            const certPath = path.join(securePath, 'cert');

            yield wssServer.updateServerSecureData();
            yield wssServer.saveServerSecureData(keyPath, certPath);

            //generate ca files
            let [{cert: firstCaCert, key : firstCaKey}, {cert : secondCaCert}] = yield Promise.all([
                wssServer.generateServerSecureData(),
                wssServer.generateServerSecureData()
            ]);

            const [firstCaPath, secondCaPath] = [path.join(__dirname, 'ca1.cert'), path.join(__dirname, 'ca2.cert')];

            yield Promise.all([
                pFS.saveToFile(firstCaPath, firstCaCert),
                pFS.saveToFile(secondCaPath, secondCaCert)
            ]);

            //create HTTPS Server
            yield wssServer.createHTTPS({caPaths : [firstCaPath, secondCaPath]});


            //create WSS Server
            yield  wssServer.createWSSServer();

            //make authorized websocket request
            const {address : httpsServerAddress, port : httpsServerPort} = wssServer.getServerAddress();
            const httpsServerUrl = `https://${httpsServerAddress}:${httpsServerPort}`;

            const wssSocket = socketioClient(httpsServerUrl, { key : firstCaKey, cert : firstCaCert});
            //set reconnection attempts to 1
            wssSocket.io.reconnectionAttempts(1);

            yield new Promise((resolve, reject) => {
                wssSocket.on('connect', () => {
                    resolve('Web socket connection is established');
                });
                wssSocket.on('connect_error', () => {
                    reject('Web socket connection is rejected');
                });
            });

            //delete temporary files
            yield Promise.all([
                pFS.deleteFile(keyPath), pFS.deleteFile(certPath),
                pFS.deleteFile(firstCaPath), pFS.deleteFile(secondCaPath)
            ]);

        }).then(done, done);

    });
});
