const co = require('co');
const fs = require('fs');

/**
 * Save file in promise mode
 * @param {String} path - path to file
 * @param {String | Buffer} data - data to save in file
 * @returns {Promise} fulfill result : path to saved file
 */
const saveToFile = (path, data) => {
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
/**
 * Read file in promise mode
 * @param {String} path - path to file
 * @returns {Promise}
 * @resolve {String} - content of file
 */
const readFromFile = (path) => {
    return new Promise((resolve, reject) => {
        fs.readFile(path, (err, data) => {
            if(err){
                reject(err);
            }else{
                resolve(data.toString());
            }
        });
    });
};
/**
 * Delete file by path
 * @param {String} path - path to file
 * @returns {Promise}
 * @resolve {undefined}
 */
const deleteFile = (path) => {
    return new Promise((resolve, reject) => {
        fs.unlink(path, (err) => {
            if(err){
                reject(err);
            }else{
                resolve();
            }
        });
    });
};
/**
 * Determinate existing of file by path in promise mode
 * @param {String} path - path to file
 * @returns {Promise}
 * @resolve {Boolean} - true if file exist, false otherwise
 */
const existFile = (path) => {
    return new Promise((resolve, reject) => {
        fs.stat(path, (err, stat) => {

            if(err){
                if(err.code === 'ENOENT') {
                    resolve(false);
                } else {
                    reject(err);
                }
            } else {
                resolve(stat.isFile());
            }
        });
    });
};
/**
 *
 * @param {String} sourcePath - path of source file
 * @param {String} destinationPath - path to save
 * @returns {Promise}
 * @resolve {undefined}
 * @reject {Error} - error if copy is failed
 */
const copyFile = (sourcePath, destinationPath) => {
    return new Promise((resolve, reject) => {
        const rStream = fs.createReadStream(sourcePath);
        const wStream = fs.createWriteStream(destinationPath);
        wStream.on('finish', () => {
            resolve();
        });
        wStream.on('error', (err) => { reject(err);});
        rStream.on('error', (err) => { reject(err);});

        fs.createReadStream(sourcePath).pipe(wStream);
    });
};
module.exports = {saveToFile, readFromFile, deleteFile, existFile, copyFile};