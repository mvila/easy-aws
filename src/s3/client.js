'use strict';

let AWS = require('aws-sdk');
let Client = require('../client');

Client = Client.extend('Client', function() {
  this.creator = function(options) {
    this.awsClient = new AWS.S3(options);
  };

  let methods = [
    'getObject', 'putObject', 'deleteObject'
  ];

  for (let method of methods) {
    this[method] = this.promisifyAWSMethod(method);
  }
});

module.exports = Client;
