'use strict';

import { CloudWatchLogs as Client } from 'aws-as-promised';
import Service from '../service';
import Group from './group';

export class CloudWatchLogs extends Service {
  // options:
  //   accessKeyId
  //   secretAccessKey
  //   region
  constructor(options = {}) {
    super(options);
    if (options.debugMode) this.debugMode = true;
    let opts = this.makeClientOptions(options);
    this.client = new Client(opts);
    this.groups = {};
  }

  // options:
  //   createIfMissing (default: true).
  getGroup(name, options) {
    let group = this.groups[name];
    if (group) return group;
    group = new Group(this, name, options);
    this.groups[name] = group;
    return group;
  }

  async deleteGroup(name) {
    let group = this.getGroup(name, { createIfMissing: false });
    await group.delete();
  }

  getStream(groupName, streamName, options) {
    let group = this.getGroup(groupName, options);
    let stream = group.getStream(streamName, options);
    return stream;
  }

  async deleteStream(groupName, streamName) {
    let stream = this.getStream(groupName, streamName, { createIfMissing: false });
    await stream.delete();
  }

  async flushStream(groupName, streamName) {
    let stream = this.getStream(groupName, streamName);
    await stream.flush();
  }

  async getEvents(groupName, streamName, options) {
    let stream = this.getStream(groupName, streamName);
    return await stream.getEvents(options);
  }

  putEvent(groupName, streamName, message, date) {
    let stream = this.getStream(groupName, streamName);
    stream.putEvent(message, date);
  }
}

export default CloudWatchLogs;
