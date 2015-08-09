'use strict';

let _ = require('lodash');
let KindaObject = require('kinda-object');
let util = require('kinda-util').create();

let Bucket = KindaObject.extend('Bucket', function() {
  this.creator = function(s3, name, options = {}) {
    if (!(_.isString(name) && name)) throw new Error('invalid S3 bucket name');
    if (options.createIfMissing == null) options.createIfMissing = true;
    this.s3 = s3;
    this.name = name;
    this.options = options;
  };

  this.initialize = async function() {
    while (this.isInitializing) await util.timeout(100);
    if (this.hasBeenInitialized) return;
    try {
      this.isInitializing = true;
      if (this.options.createIfMissing) await this._create();
      this.hasBeenInitialized = true;
    } finally {
      this.isInitializing = false;
    }
  };

  this._create = async function() {
    // TODO
  };

  this.delete = async function() {
    // TODO
  };

  // options:
  //   ifMatch
  //   ifNoneMatch
  //   ifModifiedSince
  //   ifUnmodifiedSince
  //   errorIfMissing (default: true)
  this.getObject = async function(key, options = {}) {
    if (!(_.isString(key) && key)) throw new Error('invalid S3 object key');
    _.defaults(options, { errorIfMissing: true });

    await this.initialize();

    if (this.s3.debugMode) {
      console.log(`get '${key}' object from '${this.name}' bucket`);
    }

    let params = {
      Bucket: this.name,
      Key: key
    };
    _.assign(params, util.pickAndRename(options, {
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

    let result = util.pickAndRename(res, {
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
  };

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
  this.putObject = async function(key, body, options) {
    if (!(_.isString(key) && key)) throw new Error('invalid S3 object key');
    await this.initialize();
    if (this.s3.debugMode) {
      console.log(`put '${key}' object in '${this.name}' bucket`);
    }
    let params = {
      Bucket: this.name,
      Key: key,
      Body: body
    };
    _.assign(params, util.pickAndRename(options, {
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
    if (!params.ContentType) {
      if (_.isString(body)) params.ContentType = 'text/plain; charset=utf-8';
    }
    let res = await this.s3.client.putObject(params);
    let result = util.pickAndRename(res, {
      'ETag': 'etag'
    });
    result.etag = JSON.parse(result.etag);
    return result;
  };

  this.deleteObject = async function(key, options) { // eslint-disable-line no-unused-vars
    if (!(_.isString(key) && key)) throw new Error('invalid S3 object key');
    await this.initialize();
    if (this.s3.debugMode) {
      console.log(`delete '${key}' object in '${this.name}' bucket`);
    }
    let params = {
      Bucket: this.name,
      Key: key
    };
    await this.s3.client.deleteObject(params);
  };
});

module.exports = Bucket;
