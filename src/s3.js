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
    if ('awsS3Bucket' in context) {
      if (!options.params) options.params = {};
      options.params.Bucket = context.awsS3Bucket;
    }
    return options;
  };

  this.getObject = function(params) {
    return (cb) => this.client.getObject(params, cb);
  };

  this.putObject = function(params) {
    return (cb) => this.client.putObject(params, cb);
  };

  this.deleteObject = function(params) {
    return (cb) => this.client.deleteObject(params, cb);
  };
});

module.exports = CloudWatchLogs;
