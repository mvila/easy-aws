'use strict';

var KindaAWS = require('./').create();
var config = require('kinda-config').get('kinda-aws.s3');

var client = new KindaAWS.S3(config);

var s3 = {
  getObject: function(params) {
    return function(cb) { client.getObject(params, cb); };
  },
  putObject: function(params) {
    return function(cb) { client.putObject(params, cb); };
  },
  deleteObject: function(params) {
    return function(cb) { client.deleteObject(params, cb); };
  }
}

var S3 = {
  create: function() {
    return s3;
  }
};

module.exports = S3;
