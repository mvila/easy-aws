'use strict';

var KindaAWS = require('./').create();
var config = require('kinda-config').get('kinda-aws.dynamoDB');

var client = new KindaAWS.DynamoDB(config);

var dynamoDB = {
  batchGetItem: function(params) {
    return function(cb) { client.batchGetItem(params, cb); };
  },
  batchWriteItem: function(params) {
    return function(cb) { client.batchWriteItem(params, cb); };
  },
  createTable: function(params) {
    return function(cb) { client.createTable(params, cb); };
  },
  deleteItem: function(params) {
    return function(cb) { client.deleteItem(params, cb); };
  },
  deleteTable: function(params) {
    return function(cb) { client.deleteTable(params, cb); };
  },
  describeTable: function(params) {
    return function(cb) { client.describeTable(params, cb); };
  },
  getItem: function(params) {
    return function(cb) { client.getItem(params, cb); };
  },
  listTables: function(params) {
    return function(cb) { client.listTables(params, cb); };
  },
  putItem: function(params) {
    return function(cb) { client.putItem(params, cb); };
  },
  query: function(params) {
    return function(cb) { client.query(params, cb); };
  },
  scan: function(params) {
    return function(cb) { client.scan(params, cb); };
  },
  updateItem: function(params) {
    return function(cb) { client.updateItem(params, cb); };
  },
  updateTable: function(params) {
    return function(cb) { client.updateTable(params, cb); };
  },
  waitFor: function(state, params) {
    return function(cb) { client.waitFor(state, params, cb); };
  }
}

var DynamoDB = {
  create: function() {
    return dynamoDB;
  }
};

module.exports = DynamoDB;
