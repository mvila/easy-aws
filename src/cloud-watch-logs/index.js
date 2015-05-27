'use strict';

let crypto = require('crypto');
let _ = require('lodash');
let KindaObject = require('kinda-object');
let common = require('../common');
let Client = require('./client');
let Group = require('./group');

let CloudWatchLogs = KindaObject.extend('CloudWatchLogs', function() {
  // options:
  //   accessKeyId
  //   secretAccessKey
  //   region
  this.creator = function(options = {}) {
    if (options.debugMode) this.debugMode = true;
    let opts = common.makeClientOptions(options);
    this.client = Client.create(opts);
    this.groups = {};
  };

  // options:
  //   createIfMissing (default: true).
  this.getGroup = function(name, options) {
    let group = this.groups[name];
    if (group) return group;
    group = Group.create(this, name, options);
    this.groups[name] = group;
    return group;
  };

  this.deleteGroup = function *(name) {
    let group = this.getGroup(name, { createIfMissing: false });
    yield group.delete();
  };

  this.getStream = function(groupName, streamName, options) {
    let group = this.getGroup(groupName, options);
    let stream = group.getStream(streamName, options);
    return stream;
  };

  this.deleteStream = function *(groupName, streamName) {
    let stream = this.getStream(groupName, streamName, { createIfMissing: false });
    yield stream.delete();
  };

  this.flushStream = function *(groupName, streamName) {
    let stream = this.getStream(groupName, streamName);
    yield stream.flush();
  };

  this.getEvents = function *(groupName, streamName, options) {
    let stream = this.getStream(groupName, streamName);
    return yield stream.getEvents(options);
  };

  this.putEvent = function(groupName, streamName, message, date) {
    let stream = this.getStream(groupName, streamName);
    stream.putEvent(message, date);
  };
});

CloudWatchLogs.create = _.memoize(CloudWatchLogs.create, function(options = {}) {
  options = JSON.stringify(options);
  options = crypto.createHash('md5').update(options).digest('hex');
  return options;
});

module.exports = CloudWatchLogs;
