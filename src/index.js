'use strict';

let KindaAWS = {
  CloudWatchLogs: require('./cloud-watch-logs'),
  S3: require('./s3')
};

module.exports = KindaAWS;
