'use strict';

let AWS = require('aws-sdk');
let Client = require('../client');

Client = Client.extend('Client', function() {
  this.creator = function(options) {
    this.awsClient = new AWS.CloudWatchLogs(options);
  };

  let methods = [
    'createLogGroup', 'createLogStream', 'deleteLogGroup', 'deleteLogStream',
    'deleteMetricFilter', 'deleteRetentionPolicy', 'describeLogGroups',
    'describeLogStreams', 'describeMetricFilters', 'getLogEvents',
    'putLogEvents', 'putMetricFilter', 'putRetentionPolicy', 'testMetricFilter'
  ];

  for (let method of methods) {
    this[method] = this.promisifyAWSMethod(method);
  }
});

module.exports = Client;
