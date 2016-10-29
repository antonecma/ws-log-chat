'use strict';
const co = require('co');
const path = require('path');
const should = require('should');
const pFS = require('../helpers/p-save-file');
const secure = require('../helpers/secure');


describe('secure helper', () => {

    it('should generate secure data(key, cert)', (done) => {
        co(function* () {
            const secureData = yield secure.generateServerSecureData();
            const properties = ['cert', 'key'];

            secureData.should.have.properties(properties);
            secureData.cert.should.startWith('-----BEGIN CERTIFICATE-----').and.endWith('-----END CERTIFICATE-----');
            secureData.key.should.startWith('-----BEGIN RSA PRIVATE KEY-----').and.endWith('-----END RSA PRIVATE KEY-----');

        }).then(done, done);

    });

    it('should update(upsert) server secure data(key, cert)', (done) => {
        co(function* () {
            const {key, cert} = yield secure.updateServerSecureData();
            yield secure.updateServerSecureData();
            secure.key.should.not.be.equal(key);
            secure.cert.should.not.be.equal(cert);
        }).then(done, done);
    });

    it('should save to file server secure data', (done) => {
        co(function* () {
            const securePath = secure.pathToSecureData = __dirname;
            yield secure.updateServerSecureData();
            yield secure.saveServerSecureData();
            const keyPath = path.join(securePath, secure.keyFileName);
            const certPath = path.join(securePath, secure.certFileName);

            const [key, cert] = yield Promise.all([
                pFS.readFromFile(keyPath), pFS.readFromFile(certPath),
                pFS.deleteFile(keyPath), pFS.deleteFile(certPath)
            ]);

            secure.key.should.be.equal(key);
            secure.cert.should.be.equal(cert);

        }).then(done, done);
    });

    it('should delete secure data', (done) => {
        co(function* () {
            const securePath = secure.pathToSecureData = __dirname;
            const keyPath = path.join(securePath, secure.keyFileName);
            const certPath = path.join(securePath, secure.certFileName);
            yield secure.updateServerSecureData();
            yield secure.saveServerSecureData();
            yield secure.deleteSecureData();

            should.equal(null, secure.key);
            should.equal(null, secure.cert);
            should.equal(null, secure.ca);

            const [isKeyFileExist, isCertFileExist] = yield Promise.all([
                pFS.existFile(keyPath), pFS.existFile(certPath)
            ]);

            isKeyFileExist.should.be.equal(false);
            isCertFileExist.should.be.equal(false);

        }).then(done, done);
    });

    it('should delete secure data', (done) => {
        co(function* () {
            const securePath = secure.pathToSecureData = __dirname;
            const keyPath = path.join(securePath, secure.keyFileName);
            const certPath = path.join(securePath, secure.certFileName);
            yield secure.updateServerSecureData();
            yield secure.saveServerSecureData();
            yield secure.deleteSecureData();

            should.equal(null, secure.key);
            should.equal(null, secure.cert);
            should.equal(null, secure.ca);

            const [isKeyFileExist, isCertFileExist] = yield Promise.all([
                pFS.existFile(keyPath), pFS.existFile(certPath)
            ]);

            isKeyFileExist.should.be.equal(false);
            isCertFileExist.should.be.equal(false);

        }).then(done, done);
    });

    it('should load secure data from files', (done) => {
        co(function* () {

        }).then(done, done);
    });
});