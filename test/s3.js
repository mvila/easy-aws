'use strict';

let _ = require('lodash');
let assert = require('chai').assert;
let S3 = require('../src').S3;

suite('KindaAWS.S3', function() {
  let bucket;

  let catchError = async function(fn) {
    let err;
    try {
      await fn();
    } catch (e) {
      err = e;
    }
    return err;
  };

  let config;
  try {
    config = require('./aws-config');
  } catch (err) {
    console.warn('KindaAWS.S3 tests skipped because the AWS config is missing');
  }

  if (config) {
    suiteSetup(function() {
      let options = _.clone(config);
      options.debugMode = true;
      let s3 = S3.create(options);
      bucket = s3.getBucket('kinda-aws-s3-test');
    });

    test('put, get and delete objects', async function() {
      this.timeout(30000);

      let body = 'Hello, World!';

      let result = await bucket.putObject('aaa', body, {
        metadata: { 'is-cool': 'always' }
      });
      let etag = result.etag;
      assert.ok(etag);

      result = await bucket.getObject('aaa');
      assert.strictEqual(result.contentType, 'text/plain; charset=utf-8');
      assert.strictEqual(result.etag, etag);
      assert.strictEqual(result.metadata['is-cool'], 'always');
      assert.strictEqual(result.body, 'Hello, World!');

      await bucket.deleteObject('aaa');

      let err = await catchError(async function() {
        result = await bucket.getObject('aaa');
      });
      assert.instanceOf(err, Error);

      result = await bucket.getObject('aaa', { errorIfMissing: false });
      assert.isUndefined(result);
    });
  }
});
