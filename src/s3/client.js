'use strict';

let AWS = require('aws-sdk');
let KindaObject = require('kinda-object');

let Client = KindaObject.extend('Client', function() {
  this.creator = function(options) {
    this.awsClient = new AWS.S3(options);
  };

  let methods = [
    'getObject', 'putObject', 'deleteObject'
  ];

  methods.forEach(function(method) {
    this[method] = function(params) {
      return (cb) => this.awsClient[method](params, cb);
    };
  }, this);
});

module.exports = Client;
