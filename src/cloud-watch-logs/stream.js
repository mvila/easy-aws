'use strict';

import sleep from 'sleep-promise';

export class Stream {
  constructor(group, name, options) {
    if (!(typeof name === 'string' && name)) {
      throw new Error('Missing or invalid stream name');
    }
    options = Object.assign(
      { createIfMissing: group.options.createIfMissing },
      options
    );
    this.group = group;
    this.name = name;
    this.options = options;
    this.queue = [];
  }

  async initialize() {
    while (this.isInitializing) await sleep(100);
    if (this.hasBeenInitialized) return;
    try {
      this.isInitializing = true;
      await this.group.initialize();
      if (this.options.createIfMissing) await this._create();
      this.hasBeenInitialized = true;
    } finally {
      this.isInitializing = false;
    }
  }

  async _create() {
    let done;
    do {
      try {
        if (this.group.logs.debugMode) {
          console.log(`Creating '${this.name}' stream in '${this.group.name}' group`);
        }
        await this.group.logs.client.createLogStream({
          logGroupName: this.group.name,
          logStreamName: this.name
        });
        done = true;
      } catch (err) {
        if (err.code === 'ResourceAlreadyExistsException') {
          done = true;
        } else if (err.code === 'Throttling') {
          await sleep(3000);
        } else {
          throw err;
        }
      }
    } while (!done);
  }

  async delete() {
    if (this.group.logs.debugMode) {
      console.log(`Deleting '${this.name}' stream in '${this.group.name}' group`);
    }
    await this.group.logs.client.deleteLogStream({
      logGroupName: this.group.name,
      logStreamName: this.name
    });
    this.queue = [];
    this.hasBeenInitialized = false;
  }

  async getEvents(options = {}) {
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
        await this.initialize();
        if (this.group.logs.debugMode) {
          console.log(`Getting events in '${this.name}' stream of '${this.group.name}' group`);
        }
        result = await this.group.logs.client.getLogEvents(opts);
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
  }

  putEvent(message, date = new Date()) {
    if (!(typeof message === 'string' && message)) {
      throw new Error('Missing or invalid event message');
    }
    this.queue.push({ message, timestamp: date.valueOf() });
    (async function() {
      await this.flush(false);
    }).call(this).catch(console.error);
  }

  async flush(waitIfIsAlreadyFlushing = true) {
    if (this.isFlushing) {
      if (waitIfIsAlreadyFlushing) {
        while (this.isFlushing) await sleep(100);
      }
      return;
    }
    try {
      this.isFlushing = true;
      while (this.queue.length) {
        let events = this.queue;
        this.queue = [];
        await this.putEvents(events);
      }
    } finally {
      this.isFlushing = false;
    }
  }

  async putEvents(events) {
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
      await this.putEventsBatch(batch);
    }
  }

  async putEventsBatch(events) {
    let done = false;
    do {
      let sequenceToken = await this._getSequenceToken();
      try {
        await this.initialize();
        if (this.group.logs.debugMode) {
          console.log(`Putting ${events.length} event(s) in '${this.name}' stream of '${this.group.name}' group`);
        }
        let result = await this.group.logs.client.putLogEvents({
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
          await sleep(500);
        } else if (err.code === 'DataAlreadyAcceptedException') {
          // TODO: not sure what to do with this execption
          this.setSequenceToken(undefined);
          await sleep(500);
        } else if (err.code === 'OperationAbortedException') {
          await sleep(500);
        } else if (err.code === 'Throttling') {
          await sleep(3000);
        } else {
          throw err;
        }
      }
    } while (!done);
  }

  async _describe() {
    let result;
    let done = false;
    do {
      try {
        await this.initialize();
        if (this.group.logs.debugMode) {
          console.log(`Describing '${this.name}' stream of '${this.group.name}' group`);
        }
        result = await this.group.logs.client.describeLogStreams({
          logGroupName: this.group.name,
          logStreamNamePrefix: this.name
        });
        done = true;
      } catch (err) {
        if (err.code === 'Throttling') {
          await sleep(3000);
        } else {
          throw err;
        }
      }
    } while (!done);
    result = result.logStreams.find(stream => stream.logStreamName === this.name);
    if (!result) throw new Error('Stream not found');
    return result;
  }

  async _getSequenceToken() {
    if (!this._sequenceToken) {
      let result = await this._describe();
      this._sequenceToken = result.uploadSequenceToken;
    }
    return this._sequenceToken;
  }

  _setSequenceToken(sequenceToken) {
    this._sequenceToken = sequenceToken;
  }
}

export default Stream;
