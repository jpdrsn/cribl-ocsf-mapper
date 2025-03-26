const { Expression } = C.expr;
const cLogger = C.util.getLogger('func:ocsf_mapper');

import { run } from './ocsf-mapper.js';

exports.name = 'OCSF Mapper';
exports.version = '0.1';
exports.disabled = false;
exports.group = 'Custom';

let conf;
exports.init = (opts) => {
  conf = opts.conf;
  
};

exports.process = (event) => {
  try {
    mappingNameField = conf.mappingNameField;
    outputField = conf.outputField;
    event = run(event, mappingNameField, outputField);
  } catch(ignore){}

  return event;
};