'use strict';

let _ = require('lodash');
let AWS = require('aws-sdk');
let KindaObject = require('kinda-object');
let common = require('./common');

let CloudWatchLogs = KindaObject.extend('CloudWatchLogs', function() {
  let getOptionsFromContext;

  this.creator = function(instanceOptions) {
    let options = {};
    _.merge(options, common.getGlobalOptionsFromContext(this.context));
    _.merge(options, getOptionsFromContext(this.context));
    _.merge(options, instanceOptions);
    this.client = new AWS.CloudWatchLogs(options);
  };

  getOptionsFromContext = function(context) {
    let options = {};
    if ('awsCloudWatchLogsGroup' in context) {
      if (!options.params) options.params = {};
      options.params.logGroupName = context.awsCloudWatchLogsGroup;
    }
    if ('awsCloudWatchLogsStream' in context) {
      if (!options.params) options.params = {};
      options.params.logStreamName = context.awsCloudWatchLogsStream;
    }
    return options;
  };

  this.createLogGroup = function(params) {
    return (cb) => this.client.createLogGroup(params, cb);
  };

  this.createLogStream = function(params) {
    return (cb) => this.client.createLogStream(params, cb);
  };

  this.deleteLogGroup = function(params) {
    return (cb) => this.client.deleteLogGroup(params, cb);
  };

  this.deleteLogStream = function(params) {
    return (cb) => this.client.deleteLogStream(params, cb);
  };

  this.deleteMetricFilter = function(params) {
    return (cb) => this.client.deleteMetricFilter(params, cb);
  };

  this.deleteRetentionPolicy = function(params) {
    return (cb) => this.client.deleteRetentionPolicy(params, cb);
  };

  this.describeLogGroups = function(params) {
    return (cb) => this.client.describeLogGroups(params, cb);
  };

  this.describeLogStreams = function(params) {
    return (cb) => this.client.describeLogStreams(params, cb);
  };

  this.describeMetricFilters = function(params) {
    return (cb) => this.client.describeMetricFilters(params, cb);
  };

  this.getLogEvents = function(params) {
    return (cb) => this.client.getLogEvents(params, cb);
  };

  this.putLogEvents = function(params) {
    return (cb) => this.client.putLogEvents(params, cb);
  };

  this.putMetricFilter = function(params) {
    return (cb) => this.client.putMetricFilter(params, cb);
  };

  this.putRetentionPolicy = function(params) {
    return (cb) => this.client.putRetentionPolicy(params, cb);
  };

  this.testMetricFilter = function(params) {
    return (cb) => this.client.testMetricFilter(params, cb);
  };
});

module.exports = CloudWatchLogs;
