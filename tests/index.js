const fs = require('fs');
const path = require('path');

describe('all test module', (done) => {


    const testFiles = fs.readdirSync(__dirname);
    const currentFileName = `${path.parse(__filename).name}.js`;
    testFiles.forEach((filename) => {
        if(filename != currentFileName){
            require(`./${filename}`);
        }
    });

});