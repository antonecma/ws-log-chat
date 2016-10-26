'use strict';

const WebSocketServer = require('websocket').server;
const co = require('co');
const pem = require('pem');
const fs = require('fs');
const https = require('https');
const path = require('path');
const stampit = require('stampit');
const gloader = require('gloader');
const pSaveFile = require('./p-save-file');

const nconf = gloader('nconf', 'file', ['servers', 'user'], 'json', path.join(__dirname, '../conf'));

const serverMethods = {
    /**
     * Create private key and cert for server. Cert and key will be stored on disk
     * @returns {{key: String cert: String }} - paths to cert and key
     */
    generateSecureData(){
        return new Promise((resolve, reject) => {
            pem.createCertificate({selfSigned : true}, (err, secureData) =>{
                if(err){
                    return reject(err);
                } else {
                    return resolve({cert : secureData.certificate, key : secureData.serviceKey});
                }
            });
        });
      return {key, cert};
    },
    saveSecureDataToFile(dir, {cert, key}){
    return co.call(this, function* () {
          this.cert = cert;
          this.key = key;
          const certPath = path.join(dir,'cert');
          const keyPath = path.join(dir,'key');
          yield Promise.all([pSaveFile(certPath, cert), pSaveFile(keyPath, key)]);
          return {certPath, keyPath};
      });
    },
    loadCA(paths){
      return [];
    },
    server(){
        return co.call(this, function* () {
            const httpsServer = https.createServer();
            return this;
        });
    }
};
const serverProperties = {
    conf : null,
    httpsServer : null,
    wssServer : null,
    cert : null,
    ca : null,
    key : null
};

module.exports = (stampit.methods(serverMethods).props(serverProperties))();
