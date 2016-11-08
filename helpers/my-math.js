'use strict';

/**
 * Generates random integer value between min and max values
 * @param {Number} min - min value of range
 * @param {Number} max - min value of range
 * @returns {Number} - random value from the range
 */
const generateRange = (min = 0, max) => {

    if(!max || max <= min) {
     throw new  TypeError('Max value of range could not be null or less then min');
    }

    min = Math.floor(min);
    max = Math.ceil(max);
    return Math.floor(Math.random() * (max - min)) + min;
};

module.exports = {generateRange};