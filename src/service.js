'use strict';

import pick from 'lodash.pick';

export class Service {
  makeClientOptions(options) {
    return pick(options, ['accessKeyId', 'secretAccessKey', 'region']);
  }
}

export default Service;
