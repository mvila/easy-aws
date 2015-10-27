'use strict';

import { S3 as Client } from 'aws-as-promised';
import Service from '../service';
import Bucket from './bucket';

export class S3 extends Service {
  // options:
  //   accessKeyId
  //   secretAccessKey
  //   region
  constructor(options = {}) {
    super(options);
    if (options.debugMode) this.debugMode = true;
    let opts = this.makeClientOptions(options);
    this.client = new Client(opts);
    this.buckets = {};
  }

  // options:
  //   createIfMissing (default: true).
  getBucket(name, options) {
    let bucket = this.buckets[name];
    if (bucket) return bucket;
    bucket = new Bucket(this, name, options);
    this.buckets[name] = bucket;
    return bucket;
  }

  async deleteBucket(name) {
    let bucket = this.getBucket(name, { createIfMissing: false });
    await bucket.delete();
  }

  async getObject(bucketName, key, options) {
    let bucket = this.getBucket(bucketName);
    return await bucket.getObject(key, options);
  }

  async putObject(bucketName, key, body, options) {
    let bucket = this.getBucket(bucketName);
    return await bucket.putObject(key, body, options);
  }

  async deleteObject(bucketName, key, options) {
    let bucket = this.getBucket(bucketName);
    return await bucket.deleteObject(key, options);
  }
}

export default S3;
