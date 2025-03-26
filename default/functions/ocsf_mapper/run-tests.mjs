// const ocsf_mapping = require('./ocsf-mapper');
import { readdirSync, readFileSync } from 'node:fs';
import { run } from './ocsf-mapper.js';
import { basename } from 'node:path';

const debug = false;
const mappingNameField = 'source_name';
const outputField = 'ocsf';

readdirSync('./samples').forEach(sample => {
    console.log(sample);
    const sampleData = readFileSync(`./samples/${sample}`);
    const sampleJson = JSON.parse(sampleData);
    const result = run(sampleJson, mappingNameField, outputField);
    console.log(result);
});
