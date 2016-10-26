const co = require('co');
const server = require('../helpers/server.js');

co(function* () {
    const data = yield server.generateSecureData();
    const paths = yield server.saveSecureDataToFile('.', data);
    console.log(paths)
}).then(() => { console.log('end')})
    .catch((err) => {
        console.log(err)
    });