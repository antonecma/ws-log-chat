'use strict';
const co = require('co');
const pem = require('pem');
const path = require('path');
const stampit = require('stampit');
const pFS = require('./p-save-file');


const secureMethods = {
    /**
     * Create private key and cert for server. Cert and key will be stored on disk
     * @returns {Promise} - paths to cert and key
     * @resolve {{key: String cert: String }} - paths to cert and key
     */
    generateServerSecureData(){
        return new Promise((resolve, reject) => {
            pem.createCertificate({selfSigned : true}, (err, secureData) =>{
                if(err){
                    return reject(err);
                } else {
                    return resolve({cert : secureData.certificate, key : secureData.serviceKey});
                }
            });
        });
    },
    /**
     * Update internal property 'key' and 'cert
     * @returns {Promise}
     * @resolve {Object} - secureMethod object
     */
    updateServerSecureData(){
        return co.call(this, function* () {
            const {key, cert} = yield this.generateServerSecureData();
            this.key = key;
            this.cert = cert;
            return this;
        });
    },
    /**
     * Save key and cert to disk
     * @param {String} keyPath - path where private key data will be saved
     * @param {String} certPath - path where public cert data will be saved
     * @returns {Promise}
     * @resolve {Object} - secureMethod object
     */
    saveServerSecureData(keyPath, certPath){
        return co.call(this, function* () {
            yield Promise.all([pFS.saveToFile(certPath, this.cert), pFS.saveToFile(keyPath, this.key)]);
            this.keyPath = keyPath;
            this.certPath = certPath;
            return this;
        });
    },
    /**
     * Delete key and cert file, and set to 'null' cert, key, ca
     * @returns {Promise}
     * @resolve {Object} secureMethods object
     */
    deleteSecureData(){
        return co.call(this, function* () {
            yield Promise.all([
                pFS.deleteFile(this.keyPath),
                pFS.deleteFile(this.certPath)
            ]);

            this.cert = null;
            this.key = null;
            this.ca = null;
            this.keyPath = null;
            this.certPath = null;
            return this;
        });
    },
    loadSecureDataFromFile(pathToKey, pathToCert){
        return co.call(this, function* () {
            const [key, cert] = yield Promise.all([
                pFS.readFromFile(pathToKey),
                pFS.readFromFile(pathToCert)
            ]);
            this.key = key;
            this.cert = cert;
            this.keyPath = pathToKey;
            this.certPath = pathToCert;
            return this;
        });
    }
};
const secureProperties = {
    cert : null,
    ca : null,
    key : null,
    keyPath : './key',
    certPath : './cert',
};

module.exports = (stampit.methods(secureMethods).props(secureProperties))();
