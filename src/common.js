'use strict';

let common = {
  getGlobalOptionsFromContext(context) {
    let options = {};
    if ('awsAccessKeyId' in context) {
      options.accessKeyId = context.awsAccessKeyId;
    }
    if ('awsSecretAccessKey' in context) {
      options.secretAccessKey = context.awsSecretAccessKey;
    }
    if ('awsRegion' in context) {
      options.region = context.awsRegion;
    }
    return options;
  }
};

module.exports = common;
