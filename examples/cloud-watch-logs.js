"use strict";

var co = require('co');
var logs = require('../cloud-watch-logs').create();

co(function *() {
  // // === Create group ===
  // var result = yield logs.createLogGroup({ logGroupName: 'test-group' });
  // console.log(result);

  // // === Create stream ===
  // var result = yield logs.createLogStream({
  //   logGroupName: 'test-group',
  //   logStreamName: 'test-stream'
  // });
  // console.log(result);

  // === Describe stream ===
  var result = yield logs.describeLogStreams({
    logGroupName: 'test-group',
    logStreamNamePrefix: 'test-stream'
  });
  console.log(result);
  var sequenceToken = result.logStreams[0].uploadSequenceToken;
  // console.log(sequenceToken);

  // // === Put event ===
  // var result = yield logs.putLogEvents({
  //   logEvents: [
  //     {
  //       message: 'Current time is ' + new Date(),
  //       timestamp: Date.now()
  //     }
  //   ],
  //   logGroupName: 'test-group',
  //   logStreamName: 'test-stream',
  //   sequenceToken: sequenceToken
  // });
  // console.log(result);

  // // === Delete stream ===
  // var result = yield logs.deleteLogStream({
  //   logGroupName: 'test-group',
  //   logStreamName: 'test-stream'
  // });
  // console.log(result);

  // // === Delete group ===
  // var result = yield logs.deleteLogGroup({
  //   logGroupName: 'test-group'
  // });
  // console.log(result);
}).catch(function(err) {
  console.error(err);
});
