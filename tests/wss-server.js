'use strict';

const https = require('https');
const co = require('co');
const path = require('path');
const should = require('should');
const socketio = require('socket.io');
const socketioClient = require('socket.io-client');
const pFS = require('../helpers/p-save-file');
const wssServer = require('../helpers/wss-server')();
const wssClients = require('../helpers/wss-client');
const pWait = require('../helpers/p-wait');

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
            const keyPath = yield pFS.generateUniqFileName(__dirname);
            const certPath = yield pFS.generateUniqFileName(__dirname);

            yield wssServer.updateServerSecureData();
            yield wssServer.saveServerSecureData(keyPath, certPath);

            //generate ca files
            let [firstCaCert, secondCaCert] = yield Promise.all([
                wssServer.generateServerSecureData(),
                wssServer.generateServerSecureData()
            ]);

            firstCaCert = firstCaCert.cert;
            secondCaCert = secondCaCert.cert;

            const [firstCaPath, secondCaPath] = yield Promise.all([
                yield pFS.generateUniqFileName(__dirname),
                yield pFS.generateUniqFileName(__dirname)
            ]);

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
            const keyPath = yield pFS.generateUniqFileName(__dirname)
            const certPath = yield pFS.generateUniqFileName(__dirname)

            yield wssServer.updateServerSecureData();
            yield wssServer.saveServerSecureData(keyPath, certPath);

            //generate ca files
            let [firstCaCert, secondCaCert] = yield Promise.all([
                wssServer.generateServerSecureData(),
                wssServer.generateServerSecureData()
            ]);

            firstCaCert = firstCaCert.cert;
            secondCaCert = secondCaCert.cert;

            const [firstCaPath, secondCaPath] = yield Promise.all([
                yield pFS.generateUniqFileName(__dirname),
                yield pFS.generateUniqFileName(__dirname)
            ]);

            yield Promise.all([
                pFS.saveToFile(firstCaPath, firstCaCert),
                pFS.saveToFile(secondCaPath, secondCaCert)
            ]);

            //create WSS Server
            yield  wssServer.createWSSServer({caPaths : [firstCaPath, secondCaPath]});

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
            const keyPath = yield pFS.generateUniqFileName(__dirname);
            const certPath = yield pFS.generateUniqFileName(__dirname);

            yield wssServer.updateServerSecureData();
            yield wssServer.saveServerSecureData(keyPath, certPath);

            //generate ca files
            let [firstCaCert, secondCaCert] = yield Promise.all([
                wssServer.generateServerSecureData(),
                wssServer.generateServerSecureData()
            ]);

            firstCaCert = firstCaCert.cert;
            secondCaCert = secondCaCert.cert;

            const [firstCaPath, secondCaPath] = yield Promise.all([
                pFS.generateUniqFileName(__dirname),
                pFS.generateUniqFileName(__dirname)
            ]);

            yield Promise.all([
                pFS.saveToFile(firstCaPath, firstCaCert),
                pFS.saveToFile(secondCaPath, secondCaCert)
            ]);


            //create WSS Server
            yield  wssServer.createWSSServer({caPaths : [firstCaPath, secondCaPath]});

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

            //delete temporary files
            yield Promise.all([
                pFS.deleteFile(keyPath), pFS.deleteFile(certPath),
                pFS.deleteFile(firstCaPath), pFS.deleteFile(secondCaPath)
            ]);

        }).then(done, done);

    });

    it('should accept authorized (by cert) web socket', (done) => {

        co(function* () {
            //generate key and cert for server
            const keyPath = yield pFS.generateUniqFileName(__dirname);
            const certPath = yield pFS.generateUniqFileName(__dirname);

            yield wssServer.updateServerSecureData();
            yield wssServer.saveServerSecureData(keyPath, certPath);

            //generate ca files
            let [{cert: firstCaCert, key : firstCaKey}, {cert : secondCaCert}] = yield Promise.all([
                wssServer.generateServerSecureData(),
                wssServer.generateServerSecureData()
            ]);

            const [firstCaPath, secondCaPath] = yield Promise.all([
                pFS.generateUniqFileName(__dirname), pFS.generateUniqFileName(__dirname)
            ]);

            yield Promise.all([
                pFS.saveToFile(firstCaPath, firstCaCert),
                pFS.saveToFile(secondCaPath, secondCaCert)
            ]);

            //create WSS Server
            yield  wssServer.createWSSServer({caPaths : [firstCaPath, secondCaPath]});

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
                wssSocket.on('connect_error', (err) => {
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

    it('should return all clients web sockets', (done) => {

        co(function* () {
            //generate key and cert for server
            const keyPath = yield pFS.generateUniqFileName(__dirname);
            const certPath = yield pFS.generateUniqFileName(__dirname);

            yield wssServer.updateServerSecureData();
            yield wssServer.saveServerSecureData(keyPath, certPath);

            //generate ca files
            let [{cert: firstCaCert, key : firstCaKey}, {cert : secondCaCert}] = yield Promise.all([
                wssServer.generateServerSecureData(),
                wssServer.generateServerSecureData()
            ]);

            const [firstCaPath, secondCaPath] = yield Promise.all([
                pFS.generateUniqFileName(__dirname), pFS.generateUniqFileName(__dirname)
            ]);

            yield Promise.all([
                pFS.saveToFile(firstCaPath, firstCaCert),
                pFS.saveToFile(secondCaPath, secondCaCert)
            ]);

            //create WSS Server
            yield  wssServer.createWSSServer({caPaths : [firstCaPath, secondCaPath]});

            //make authorized websocket request
            const httpsServerUrl = wssServer.getServerUrl();

            const wssSocket = socketioClient(httpsServerUrl, { key : firstCaKey, cert : firstCaCert});
            //set reconnection attempts to 1
            wssSocket.io.reconnectionAttempts(1);

            yield new Promise((resolve, reject) => {
                wssSocket.on('connect', () => {
                    resolve('Web socket connection is established');
                });
                wssSocket.on('connect_error', (err) => {
                    reject('Web socket connection is rejected');
                });
            });

            //asserts
            const clientSokets = wssServer.getClients();

            clientSokets.length.should.be.equal(1);
            clientSokets[0].should.have.property('id');

            //delete temporary files
            yield Promise.all([
                pFS.deleteFile(keyPath), pFS.deleteFile(certPath),
                pFS.deleteFile(firstCaPath), pFS.deleteFile(secondCaPath)
            ]);

        }).then(done, done);

    });

    it('should remove clients when it disconnected', (done) => {

        co(function* () {
            //generate key and cert for server
            const keyPath = yield pFS.generateUniqFileName(__dirname);
            const certPath = yield pFS.generateUniqFileName(__dirname);

            yield wssServer.updateServerSecureData();
            yield wssServer.saveServerSecureData(keyPath, certPath);

            //create WSS Server
            yield  wssServer.createWSSServer({caPaths : [certPath]});

            //create client socket
            const wssSockets = wssClients();

            yield wssSockets.loadSecureDataFromFile(keyPath, certPath);
            yield wssSockets.loadCA([certPath]);

            yield wssSockets.create(wssServer.getServerUrl());
            yield wssSockets.create(wssServer.getServerUrl());
            yield wssSockets.create(wssServer.getServerUrl());

            //asserts
            let clientSockets = wssServer.getClients();

            clientSockets.length.should.be.equal(3);

            //disconnect client socket
            (wssSockets.getClients()[0]).disconnect();

            //wait for a while, for closing socket connection
            yield new Promise((resolve) => {
                setTimeout(resolve, 1000);
            });

            clientSockets = wssServer.getClients();

            clientSockets.length.should.be.equal(2);
            //delete temporary files
            yield Promise.all([
                pFS.deleteFile(keyPath), pFS.deleteFile(certPath)
            ]);
        }).then(done, done);

    });

    it('should add middleware that will be invoked when event emit events', (done) => {

        co(function* () {
            //generate key and cert for server
            const keyPath = yield pFS.generateUniqFileName(__dirname);
            const certPath = yield pFS.generateUniqFileName(__dirname);

            yield wssServer.updateServerSecureData();
            yield wssServer.saveServerSecureData(keyPath, certPath);

            //create WSS Server
            yield  wssServer.createWSSServer({caPaths : [certPath]});

            //methods
            const increment = (incrementObj) => {
                incrementObj.value += 1;
            };
            //event
            const event = 'connection';
            //temporary object
            const incrementObj = {value : 0};

            //add server Middleware
            wssServer.addServerMiddleware(event, increment.bind(null, incrementObj));

            //create client socket
            const wssSockets = wssClients();

            yield wssSockets.loadSecureDataFromFile(keyPath, certPath);
            yield wssSockets.loadCA([certPath]);

            yield wssSockets.create(wssServer.getServerUrl());

            //assets
            incrementObj.value.should.be.equal(1);

            //delete temporary files
            yield Promise.all([
                pFS.deleteFile(keyPath), pFS.deleteFile(certPath)
            ]);

        }).then(done, done);

    });
});
