'use strict';

import sleep from 'sleep-promise';
import Stream from './stream';

export class Group {
  constructor(logs, name, options) {
    if (!(typeof name === 'string' && name)) {
      throw new Error('Missing or invalid group name');
    }
    options = Object.assign({ createIfMissing: true }, options);
    this.logs = logs;
    this.name = name;
    this.options = options;
    this.streams = {};
  }

  async initialize() {
    while (this.isInitializing) await sleep(100);
    if (this.hasBeenInitialized) return;
    try {
      this.isInitializing = true;
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
        if (this.logs.debugMode) console.log(`Creating '${this.name}' group`);
        await this.logs.client.createLogGroup({ logGroupName: this.name });
        done = true;
      } catch (err) {
        if (err.code === 'ResourceAlreadyExistsException') {
          done = true;
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

  async delete() {
    if (this.logs.debugMode) {
      console.log(`Deleting '${this.name}' group`);
    }
    await this.logs.client.deleteLogGroup({
      logGroupName: this.name
    });
    this.streams = {};
    this.hasBeenInitialized = false;
  }

  // options:
  //   createIfMissing (default: same as group).
  getStream(name, options) {
    let stream = this.streams[name];
    if (stream) return stream;
    stream = new Stream(this, name, options);
    this.streams[name] = stream;
    return stream;
  }

  async deleteStream(name) {
    let stream = this.getStream(name, { createIfMissing: false });
    await stream.delete();
  }
}

export default Group;
