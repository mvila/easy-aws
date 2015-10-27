'use strict';

import { assert } from 'chai';
import { S3 } from '../src';

describe('S3', function() {
  let bucket;

  async function catchError(fn) {
    let err;
    try {
      await fn();
    } catch (e) {
      err = e;
    }
    return err;
  }

  let config;
  try {
    config = require('./aws-config');
  } catch (err) {
    console.warn('S3 tests skipped because the AWS config is missing');
    return;
  }

  before(function() {
    let options = Object.assign({ debugMode: true }, config);
    let s3 = new S3(options);
    bucket = s3.getBucket('easy-aws-s3-test');
  });

  it('should put, get and delete objects', async function() {
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
});
