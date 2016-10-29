'use strict';

const co = require('co');
const path = require('path');
const should = require('should');
const pFS = require('../helpers/p-save-file');


describe('p-save-file helper', () => {

    it('should return false if file does not exist', (done) => {
        co(function* () {
            const isFileExists = yield pFS.existFile('notexsisting.file');
            isFileExists.should.be.equal(false);
        }).then(done, done);

    });

    it('should copy file', (done) => {
        co(function* () {
            const [firstFileName, secondFileName] = ['1.test', '2.test'];
            const someData = 'someData';

            yield pFS.saveToFile(firstFileName, someData);
            yield pFS.copyFile(firstFileName, secondFileName);
            yield pFS.deleteFile(firstFileName);
            const secondFileContent = yield pFS.readFromFile(secondFileName);
            secondFileContent.should.be.equal(someData);
            yield pFS.deleteFile(secondFileName);

        }).then(done, done);

    });



});