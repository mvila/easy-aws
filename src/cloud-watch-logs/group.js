'use strict';

let _ = require('lodash');
let wait = require('co-wait');
let KindaObject = require('kinda-object');
let Stream = require('./stream');

let Group = KindaObject.extend('Group', function() {
  this.creator = function(logs, name, options = {}) {
    if (!(_.isString(name) && name)) throw new Error('invalid group name');
    if (options.createIfMissing == null) options.createIfMissing = true;
    this.logs = logs;
    this.name = name;
    this.options = options;
    this.streams = {};
  };

  this.initialize = function *() {
    while (this.isInitializing) yield wait(100);
    if (this.hasBeenInitialized) return;
    try {
      this.isInitializing = true;
      if (this.options.createIfMissing) yield this._create();
      this.hasBeenInitialized = true;
    } finally {
      this.isInitializing = false;
    }
  };

  this._create = function *() {
    let done;
    do {
      try {
        if (this.logs.debugMode) console.log(`creating '${this.name}' group`);
        yield this.logs.client.createLogGroup({ logGroupName: this.name });
        done = true;
      } catch (err) {
        if (err.code === 'ResourceAlreadyExistsException') {
          done = true;
        } else if (err.code === 'OperationAbortedException') {
          yield wait(500);
        } else if (err.code === 'Throttling') {
          yield wait(3000);
        } else {
          throw err;
        }
      }
    } while (!done);
  };

  this.delete = function *() {
    if (this.logs.debugMode) {
      console.log(`deleting '${this.name}' group`);
    }
    yield this.logs.client.deleteLogGroup({
      logGroupName: this.name
    });
    this.streams = {};
    this.hasBeenInitialized = false;
  };

  // options:
  //   createIfMissing (default: group createIfMissing option).
  this.getStream = function(name, options) {
    let stream = this.streams[name];
    if (stream) return stream;
    stream = Stream.create(this, name, options);
    this.streams[name] = stream;
    return stream;
  };

  this.deleteStream = function *(name) {
    let stream = this.getStream(name, { createIfMissing: false });
    yield stream.delete();
  };
});

module.exports = Group;
