'use strict';

require('co-mocha');
let _ = require('lodash');
let assert = require('chai').assert;
let wait = require('co-wait');
let CloudWatchLogs = require('../src').CloudWatchLogs;

suite('KindaAWS.CloudWatchLogs', function() {
  let logs;

  let config;
  try {
    config = require('./aws-config');
  } catch (err) {
    console.warn('KindaAWS.CloudWatchLogs tests skipped because the AWS config is missing');
  }

  if (config) {
    suiteSetup(function() {
      let options = _.clone(config);
      options.debugMode = true;
      logs = CloudWatchLogs.create(options);
    });

    test('put and get events', function *() {
      this.timeout(60000);
      for (let i = 1; i <= 1000; i++) {
        logs.putEvent('test', 'test', 'event #' + i);
        yield wait(10);
      }

      yield logs.flushStream('test', 'test');

      let events = yield logs.getEvents('test', 'test');
      assert.strictEqual(events.length, 1000);

      yield logs.deleteGroup('test');
    });
  }
});
