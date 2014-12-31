'use strict';

var KindaAWS = require('./').create();
var config = require('kinda-config').get('kinda-aws.cloud-watch-logs');

var client = new KindaAWS.CloudWatchLogs(config);

var cloudWatchLogs = {
  createLogGroup: function(params) {
    return function(cb) { client.createLogGroup(params, cb); };
  },
  createLogStream: function(params) {
    return function(cb) { client.createLogStream(params, cb); };
  },
  deleteLogGroup: function(params) {
    return function(cb) { client.deleteLogGroup(params, cb); };
  },
  deleteLogStream: function(params) {
    return function(cb) { client.deleteLogStream(params, cb); };
  },
  deleteMetricFilter: function(params) {
    return function(cb) { client.deleteMetricFilter(params, cb); };
  },
  deleteRetentionPolicy: function(params) {
    return function(cb) { client.deleteRetentionPolicy(params, cb); };
  },
  describeLogGroups: function(params) {
    return function(cb) { client.describeLogGroups(params, cb); };
  },
  describeLogStreams: function(params) {
    return function(cb) { client.describeLogStreams(params, cb); };
  },
  describeMetricFilters: function(params) {
    return function(cb) { client.describeMetricFilters(params, cb); };
  },
  getLogEvents: function(params) {
    return function(cb) { client.getLogEvents(params, cb); };
  },
  putLogEvents: function(params) {
    return function(cb) { client.putLogEvents(params, cb); };
  },
  putMetricFilter: function(params) {
    return function(cb) { client.putMetricFilter(params, cb); };
  },
  putRetentionPolicy: function(params) {
    return function(cb) { client.putRetentionPolicy(params, cb); };
  },
  testMetricFilter: function(params) {
    return function(cb) { client.testMetricFilter(params, cb); };
  }
}

var CloudWatchLogs = {
  create: function() {
    return cloudWatchLogs;
  }
};

module.exports = CloudWatchLogs;
