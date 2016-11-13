const https = require('https');
const co = require('co');
const path = require('path');
const should = require('should');
const socketio = require('socket.io');
const socketioClient = require('socket.io-client');
const pFS = require('../helpers/p-save-file');
const wssServer = require('../helpers/wss-server')();
const wssClients = require('../helpers/wss-client');

describe('wss-client helper', () => {

    let serverKeyPath = null;
    let serverCertPath = null;

    before((done) => {
        //save secure data for server
        co(function* () {

            serverKeyPath = yield pFS.generateUniqFileName(__dirname);
            serverCertPath = yield pFS.generateUniqFileName(__dirname);

            yield wssServer.updateServerSecureData();
            yield wssServer.saveServerSecureData(serverKeyPath, serverCertPath);

        }).then(done, done);

    });

    after((done) => {
        //delete wss server secure data from disk
        co(function* () {

            yield Promise.all([
                pFS.deleteFile(serverKeyPath), pFS.deleteFile(serverCertPath)
            ]);
        }).then(done, done);

    });

    it('should create wss socket', (done) => {
        co(function* () {
            //create files for clients secure data
            const keyPath = yield pFS.generateUniqFileName(__dirname);
            const certPath = yield pFS.generateUniqFileName(__dirname);

            const wssSockets = wssClients();

            //load secure data to all clients
            yield wssSockets.updateSecureData();
            yield wssSockets.saveSecureData(keyPath, certPath);
            yield wssSockets.loadCA([serverCertPath]);


            //start wss server
            yield wssServer.createWSSServer({caPaths : [certPath]});

            yield wssSockets.create(wssServer.getServerUrl());
            const wssClient = (wssSockets.getClients())[0];
            //delete temporary files
            yield Promise.all([
                pFS.deleteFile(keyPath), pFS.deleteFile(certPath)
            ]);


            wssClient.should.be.instanceof(socketioClient.Socket);



        }).then(done, done);
    });

    it('should connect to wss server', (done) => {
        co(function* () {
            //create files for clients secure data
            const wssSockets = wssClients();

            //load secure data to all clients
            yield wssSockets.loadSecureDataFromFile(serverKeyPath, serverCertPath);
            yield wssSockets.loadCA([serverCertPath]);


            //start wss server
            yield wssServer.createWSSServer({caPaths : [serverCertPath]});

            yield wssSockets.create(wssServer.getServerUrl());
            const wssClient = (wssSockets.getClients())[0];


            wssClient.should.be.instanceof(socketioClient.Socket);
            wssClient.id.should.not.be.null();


        }).then(done, done);
    });

});