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
            const securePath = __dirname;
            const keyPath = path.join(securePath, 'key');
            const certPath = path.join(securePath, 'path');

            yield secure.updateServerSecureData();
            yield secure.saveServerSecureData(keyPath, certPath);

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
            const securePath =  __dirname;
            const keyPath = path.join(securePath, 'key');
            const certPath = path.join(securePath, 'cert');
            yield secure.updateServerSecureData();
            yield secure.saveServerSecureData(keyPath, certPath);
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
            const securePath =  __dirname;

            const keyPath = path.join(securePath, 'key');
            const keyPathCopy = `${keyPath}.copy`;

            const certPath = path.join(securePath, 'cert');
            const certPathCopy = `${certPath}.copy`;

            yield secure.updateServerSecureData();
            yield secure.saveServerSecureData(keyPath, certPath);

            const key = secure.key;
            const cert = secure.cert;

            yield Promise.all([pFS.copyFile(keyPath, keyPathCopy), pFS.copyFile(certPath, certPathCopy)]);

            yield secure.deleteSecureData();
            yield secure.loadSecureDataFromFile(keyPathCopy, certPathCopy);

            secure.key.should.be.equal(key);
            secure.cert.should.be.equal(cert);

            yield Promise.all([pFS.deleteFile(keyPathCopy), pFS.deleteFile(certPathCopy)]);
        }).then(done, done);
    });

    it('should load ca from files', (done) => {
        co(function* () {

            let [firstCaCert, secondCaCert] = yield Promise.all([
                secure.generateServerSecureData(),
                secure.generateServerSecureData()
            ]);

            firstCaCert = firstCaCert.cert;
            secondCaCert = secondCaCert.cert;

            const [firstCaPath, secondCaPath] = [path.join(__dirname, 'ca1.cert'), path.join(__dirname, 'ca2.cert')];

            yield Promise.all([
                pFS.saveToFile(firstCaPath, firstCaCert),
                pFS.saveToFile(secondCaPath, secondCaCert)
            ]);
            yield secure.loadCA([firstCaPath, secondCaPath]);

            secure.ca.should.containEql(firstCaCert);
            secure.ca.should.containEql(secondCaCert);

            yield Promise.all([
                pFS.deleteFile(firstCaPath),
                pFS.deleteFile(secondCaPath)
            ]);
        }).then(done, done);
    });
});