'use strict';

const https = require('https');
const co = require('co');
const path = require('path');
const should = require('should');
const pFS = require('../helpers/p-save-file');
const wssServer = require('../helpers/wss-server')();

describe.only('wss-server helper', () => {

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

            //create wssServer
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
});
