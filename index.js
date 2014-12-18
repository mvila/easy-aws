'use strict';

var AWS = require('aws-sdk');
var config = require('kinda-config').get('kinda-aws');

AWS.config.update({
  accessKeyId: config.accessKeyId,
  secretAccessKey: config.secretAccessKey,
  region: config.region
});

var KindaAWS = {
  create: function() {
    return AWS;
  }
};

module.exports = KindaAWS;
