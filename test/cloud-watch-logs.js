'use strict';

import { assert } from 'chai';
import sleep from 'sleep-promise';
import { CloudWatchLogs } from '../src';

describe('CloudWatchLogs', function() {
  let logs;

  let config;
  try {
    config = require('./aws-config');
  } catch (err) {
    console.warn('S3 tests skipped because the AWS config is missing');
    return;
  }

  before(function() {
    let options = Object.assign({ debugMode: true }, config);
    logs = new CloudWatchLogs(options);
  });

  it('should put and get events', async function() {
    this.timeout(60000);
    for (let i = 1; i <= 1000; i++) {
      logs.putEvent('test', 'test', 'event #' + i);
      await sleep(10);
    }

    await logs.flushStream('test', 'test');

    let events = await logs.getEvents('test', 'test');
    assert.strictEqual(events.length, 1000);

    await logs.deleteGroup('test');
  });
});
