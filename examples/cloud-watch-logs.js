'use strict';

// ./node_modules/.bin/babel-node examples/cloud-watch-logs.js

let co = require('co');
let KindaAWS = require('../src');
let config = require('./config');
let logs = KindaAWS.CloudWatchLogs.create(config);

co(function *() {
  let result;

  // // === Create group ===
  // result = yield logs.createLogGroup({ logGroupName: 'test-group' });
  // console.log(result);

  // // === Create stream ===
  // result = yield logs.createLogStream({
  //   logGroupName: 'test-group',
  //   logStreamName: 'test-stream'
  // });
  // console.log(result);

  // === Describe stream ===
  result = yield logs.describeLogStreams({
    logGroupName: 'test-group',
    logStreamNamePrefix: 'test-stream'
  });
  console.log(result);
  let sequenceToken = result.logStreams[0].uploadSequenceToken;
  console.log(sequenceToken);

  // // === Put event ===
  // result = yield logs.putLogEvents({
  //   logEvents: [
  //     {
  //       message: 'Current time is ' + new Date(),
  //       timestamp: Date.now()
  //     }
  //   ],
  //   logGroupName: 'test-group',
  //   logStreamName: 'test-stream',
  //   sequenceToken
  // });
  // console.log(result);

  // // === Delete stream ===
  // result = yield logs.deleteLogStream({
  //   logGroupName: 'test-group',
  //   logStreamName: 'test-stream'
  // });
  // console.log(result);
  //
  // // === Delete group ===
  // result = yield logs.deleteLogGroup({
  //   logGroupName: 'test-group'
  // });
  // console.log(result);
}).catch(function(err) {
  console.error(err);
});
