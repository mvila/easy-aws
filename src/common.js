'use strict';

let _ = require('lodash');

let common = {
  makeClientOptions(options) {
    let opts = _.pick(options, ['accessKeyId', 'secretAccessKey', 'region']);
    return opts;
  }
};

module.exports = common;
