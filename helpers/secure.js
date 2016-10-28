'use strict';
const co = require('co');
const pem = require('pem');
const path = require('path');
const stampit = require('stampit');
const pFS = require('./p-save-file');


const secureMethods = {
    /**
     * Create private key and cert for server. Cert and key will be stored on disk
     * @returns {{key: String cert: String }} - paths to cert and key
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
     * Save secure data to files
     * @returns {Promise}
     * @resolve {Object} - secureMethod object
     */
    saveServerSecureData(){
        return co.call(this, function* () {
            const pathToSecure = this.pathToSecureData;
            const [certPath, keyPath] = [
                path.join(pathToSecure, this.certFileName),
                path.join(pathToSecure, this.keyFileName)
            ];

            yield Promise.all([pFS.saveToFile(certPath, this.cert), pFS.saveToFile(keyPath, this.key)]);
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
            const pathToSecure = this.pathToSecureData;
            yield Promise.all([
                pFS.deleteFile(path.join(pathToSecure, this.certFileName)),
                pFS.deleteFile(path.join(pathToSecure, this.keyFileName))
            ]);

            this.cert = null;
            this.key = null;
            this.ca = null;

            return this;
        });
    }
};
const secureProperties = {
    cert : null,
    ca : null,
    key : null,
    keyFileName : 'key',
    certFileName : 'cert',
    pathToSecureData : '.'
};

module.exports = (stampit.methods(secureMethods).props(secureProperties))();
