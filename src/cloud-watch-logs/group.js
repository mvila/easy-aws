'use strict';

let _ = require('lodash');
let KindaObject = require('kinda-object');
let util = require('kinda-util').create();
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

  this.initialize = async function() {
    while (this.isInitializing) await util.timeout(100);
    if (this.hasBeenInitialized) return;
    try {
      this.isInitializing = true;
      if (this.options.createIfMissing) await this._create();
      this.hasBeenInitialized = true;
    } finally {
      this.isInitializing = false;
    }
  };

  this._create = async function() {
    let done;
    do {
      try {
        if (this.logs.debugMode) console.log(`creating '${this.name}' group`);
        await this.logs.client.createLogGroup({ logGroupName: this.name });
        done = true;
      } catch (err) {
        if (err.code === 'ResourceAlreadyExistsException') {
          done = true;
        } else if (err.code === 'OperationAbortedException') {
          await util.timeout(500);
        } else if (err.code === 'Throttling') {
          await util.timeout(3000);
        } else {
          throw err;
        }
      }
    } while (!done);
  };

  this.delete = async function() {
    if (this.logs.debugMode) {
      console.log(`deleting '${this.name}' group`);
    }
    await this.logs.client.deleteLogGroup({
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

  this.deleteStream = async function(name) {
    let stream = this.getStream(name, { createIfMissing: false });
    await stream.delete();
  };
});

module.exports = Group;
