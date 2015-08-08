'use strict';

let KindaObject = require('kinda-object');

let Client = KindaObject.extend('Client', function() {
  this.promisifyAWSMethod = function(method) {
    return function(params) {
      return new Promise((resolve, reject) => {
        this.awsClient[method](params, function(err, res) {
          if (err) reject(err); else resolve(res);
        });
      });
    };
  };
});

module.exports = Client;
