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
            const wssPort = yield wssServer.getFreePortForServer();
            yield wssServer.createHTTPS({port : wssPort});
            const httpsServer = wssServer.getHTTPSServer();
            httpsServer.should.not.be.null();
            httpsServer.should.be.instanceOf(https.Server);
        }).then(done, done);
    });
});
