'use strict';

import sleep from 'sleep-promise';
import { pickAndRename } from '../common';

export class Bucket {
  constructor(s3, name, options) {
    if (!(typeof name === 'string' && name)) {
      throw new Error('Missing or invalid S3 bucket name');
    }
    options = Object.assign({ createIfMissing: true }, options);
    this.s3 = s3;
    this.name = name;
    this.options = options;
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
    // TODO
  }

  async delete() {
    // TODO
  }

  // options:
  //   ifMatch
  //   ifNoneMatch
  //   ifModifiedSince
  //   ifUnmodifiedSince
  //   errorIfMissing (default: true)
  async getObject(key, options) {
    if (!(typeof key === 'string' && key)) {
      throw new Error('Missing or invalid S3 object key');
    }
    options = Object.assign({ errorIfMissing: true }, options);

    await this.initialize();

    if (this.s3.debugMode) {
      console.log(`Get '${key}' object from '${this.name}' bucket`);
    }

    let params = {
      Bucket: this.name,
      Key: key
    };
    Object.assign(params, pickAndRename(options, {
      'ifMatch': 'IfMatch',
      'ifNoneMatch': 'IfNoneMatch',
      'ifModifiedSince': 'IfModifiedSince',
      'ifUnmodifiedSince': 'IfUnmodifiedSince'
    }));

    let res;
    try {
      res = await this.s3.client.getObject(params);
    } catch (err) {
      if (err.code === 'NoSuchKey' && !options.errorIfMissing) {
        return undefined;
      } else {
        throw err;
      }
    }

    let result = pickAndRename(res, {
      'ContentType': 'contentType',
      'ContentEncoding': 'contentEncoding',
      'ContentDisposition': 'contentDisposition',
      'ContentLanguage': 'contentLanguage',
      'ContentLength': 'contentLength',
      'ETag': 'etag',
      'LastModified': 'lastModified',
      'CacheControl': 'cacheControl',
      'Expires': 'expires',
      'Metadata': 'metadata',
      'Body': 'body'
    });
    if (result.contentType === 'text/plain; charset=utf-8') {
      result.body = result.body.toString();
    }
    result.etag = JSON.parse(result.etag);
    if (result.lastModified) {
      result.lastModified = new Date(result.lastModified);
    }
    if (result.expires) {
      result.expires = new Date(result.expires);
    }

    return result;
  }

  // options:
  //   contentType
  //   contentEncoding
  //   contentDisposition
  //   contentLanguage
  //   contentLength
  //   contentMD5
  //   cacheControl
  //   expires
  //   metadata
  async putObject(key, body, options) {
    if (!(typeof key === 'string' && key)) {
      throw new Error('Missing or invalid S3 object key');
    }

    await this.initialize();

    if (this.s3.debugMode) {
      console.log(`Put '${key}' object in '${this.name}' bucket`);
    }

    let params = {
      Bucket: this.name,
      Key: key,
      Body: body
    };
    Object.assign(params, pickAndRename(options, {
      'contentType': 'ContentType',
      'contentEncoding': 'ContentEncoding',
      'contentDisposition': 'ContentDisposition',
      'contentLanguage': 'ContentLanguage',
      'contentLength': 'ContentLength',
      'contentMD5': 'ContentMD5',
      'cacheControl': 'CacheControl',
      'expires': 'Expires',
      'metadata': 'Metadata'
    }));
    if (!params.ContentType && typeof body === 'string') {
      params.ContentType = 'text/plain; charset=utf-8';
    }

    let res = await this.s3.client.putObject(params);

    let result = pickAndRename(res, {
      'ETag': 'etag'
    });
    result.etag = JSON.parse(result.etag);

    return result;
  }

  async deleteObject(key, options) { // eslint-disable-line no-unused-vars
    if (!(typeof key === 'string' && key)) {
      throw new Error('Missing or invalid S3 object key');
    }

    await this.initialize();

    if (this.s3.debugMode) {
      console.log(`Delete '${key}' object in '${this.name}' bucket`);
    }

    let params = {
      Bucket: this.name,
      Key: key
    };

    await this.s3.client.deleteObject(params);
  }
}

export default Bucket;
