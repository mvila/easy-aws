'use strict';

let _ = require('lodash');
let co = require('co');
let wait = require('co-wait');
let KindaObject = require('kinda-object');

let Stream = KindaObject.extend('Stream', function() {
  this.creator = function(group, name, options = {}) {
    if (!(_.isString(name) && name)) throw new Error('invalid stream name');
    if (options.createIfMissing == null) {
      options.createIfMissing = group.options.createIfMissing;
    }
    this.group = group;
    this.name = name;
    this.options = options;
    this.queue = [];
  };

  this.initialize = function *() {
    while (this.isInitializing) yield wait(100);
    if (this.hasBeenInitialized) return;
    try {
      this.isInitializing = true;
      yield this.group.initialize();
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
        if (this.group.logs.debugMode) {
          console.log(`creating '${this.name}' stream in '${this.group.name}' group`);
        }
        yield this.group.logs.client.createLogStream({
          logGroupName: this.group.name,
          logStreamName: this.name
        });
        done = true;
      } catch (err) {
        if (err.code === 'ResourceAlreadyExistsException') {
          done = true;
        } else if (err.code === 'Throttling') {
          yield wait(3000);
        } else {
          throw err;
        }
      }
    } while (!done);
  };

  this.delete = function *() {
    if (this.group.logs.debugMode) {
      console.log(`deleting '${this.name}' stream in '${this.group.name}' group`);
    }
    yield this.group.logs.client.deleteLogStream({
      logGroupName: this.group.name,
      logStreamName: this.name
    });
    this.queue = [];
    this.hasBeenInitialized = false;
  };

  this.getEvents = function *(options = {}) {
    let opts = {
      logGroupName: this.group.name,
      logStreamName: this.name
    };
    if ('start' in options) opts.startTime = options.start.valueOf();
    if ('end' in options) opts.endTime = options.end.valueOf();
    let reverse = options.reverse;
    if (!reverse) opts.startFromHead = true;
    let limit = options.limit;

    let events = [];
    let nextToken;
    let done;
    do {
      if (limit) opts.limit = Math.min(limit - events.length, 10000);
      if (nextToken) opts.nextToken = nextToken;
      let result;
      try {
        yield this.initialize();
        if (this.group.logs.debugMode) {
          console.log(`getting events in '${this.name}' stream of '${this.group.name}' group`);
        }
        result = yield this.group.logs.client.getLogEvents(opts);
      } catch (err) {
        if (err.code === 'ResourceNotFoundException') {
          break;
        } else {
          throw err;
        }
      }
      if (!result.events.length) break;
      if (reverse) result.events.reverse();
      for (let event of result.events) {
        events.push({
          message: event.message,
          date: new Date(event.timestamp)
        });
        if (limit && events.length === limit) {
          done = true;
          break;
        }
      }
      nextToken = reverse ? result.nextBackwardToken : result.nextForwardToken;
    } while (!done);
    return events;
  };

  this.putEvent = function(message, date = new Date()) {
    if (!(_.isString(message) && message)) throw new Error('invalid event message');
    this.queue.push({ message, timestamp: date.valueOf() });
    co(function *() {
      yield this.flush(false);
    }.bind(this)).catch(function(err) {
      console.error(err.stack || err);
    });
  };

  this.flush = function *(waitIfIsAlreadyFlushing = true) {
    if (this.isFlushing) {
      if (waitIfIsAlreadyFlushing) {
        while (this.isFlushing) yield wait(100);
      }
      return;
    }
    try {
      this.isFlushing = true;
      while (this.queue.length) {
        let events = this.queue;
        this.queue = [];
        yield this.putEvents(events);
      }
    } finally {
      this.isFlushing = false;
    }
  };

  this.putEvents = function *(events) {
    while (events.length) {
      let batch = [];
      let size = 0;
      do {
        let event = events[0];
        size += event.message.length + 26;
        if (size > 128 * 1024) break;
        batch.push(event);
        events.shift();
      } while (events.length && batch.length < 10000);
      yield this.putEventsBatch(batch);
    }
  };

  this.putEventsBatch = function *(events) {
    let done = false;
    do {
      let sequenceToken = yield this._getSequenceToken();
      try {
        yield this.initialize();
        if (this.group.logs.debugMode) {
          console.log(`putting ${events.length} event(s) in '${this.name}' stream of '${this.group.name}' group`);
        }
        let result = yield this.group.logs.client.putLogEvents({
          logGroupName: this.group.name,
          logStreamName: this.name,
          logEvents: events,
          sequenceToken
        });
        this._setSequenceToken(result.nextSequenceToken);
        done = true;
      } catch (err) {
        if (err.code === 'InvalidSequenceTokenException') {
          this._setSequenceToken(undefined);
          yield wait(500);
        } else if (err.code === 'DataAlreadyAcceptedException') {
          // TODO: not sure what to do with this execption
          this.setSequenceToken(undefined);
          yield wait(500);
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

  this._describe = function *() {
    let result;
    let done = false;
    do {
      try {
        yield this.initialize();
        if (this.group.logs.debugMode) {
          console.log(`describing '${this.name}' stream of '${this.group.name}' group`);
        }
        result = yield this.group.logs.client.describeLogStreams({
          logGroupName: this.group.name,
          logStreamNamePrefix: this.name
        });
        done = true;
      } catch (err) {
        if (err.code === 'Throttling') {
          yield wait(3000);
        } else {
          throw err;
        }
      }
    } while (!done);
    result = _.find(result.logStreams, 'logStreamName', this.name);
    if (!result) throw new Error('stream not found');
    return result;
  };

  this._getSequenceToken = function *() {
    if (!this._sequenceToken) {
      let result = yield this._describe();
      this._sequenceToken = result.uploadSequenceToken;
    }
    return this._sequenceToken;
  };

  this._setSequenceToken = function(sequenceToken) {
    this._sequenceToken = sequenceToken;
  };
});

module.exports = Stream;
