const co = require('co');
const fs = require('fs');

/**
 * Save file in promise mode
 * @param {String} path - path to file
 * @param {String | Buffer} data - data to save in file
 * @returns {Promise} fulfill result : path to saved file
 */
const promiseSaveToFile = (path, data) => {
    return new Promise((resolve, reject) => {
        fs.writeFile(path, data, {mode : 0o600}, (err) => {
            if(err){
                reject(err);
            }else{
                resolve(path);
            }
        });
    });
};
module.exports = promiseSaveToFile;