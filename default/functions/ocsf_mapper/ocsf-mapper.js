const fs= require('fs');
const debug = false;
// const mappingNameField = 'source_name';
// const outputField = 'ocsf';

function logger(message) {
    if (debug) {
        console.log(message);
    }
}   

// function to return value from '$.' reference in config line
function getDotLocatorValue(dotLocator, event) {
    if (dotLocator.startsWith('$.')) {
        let jsonPath = dotLocator.split('.');
        if (jsonPath[1] === 'UserDefined') {
            return event[jsonPath[2]];
        }
        jsonPath.shift();
        let result = event;
        for (let k of jsonPath) {
            if (result[k] !== undefined) {
                result = result[k];
            } else { // if we get undefined then reference doesn't exist and we need to break out
                result = null;
                break;
            }
        }
        return String(result);
    } else {
        logger("Unable to process matched field -" + dotLocator);
    }
}

// function to map original log record to mapping defined in config file
function performTransform(eventMapping, event) {
    let newRecord = {};
    for (let key in eventMapping) {
        // if we have a dict as the value we need to keep traversing until we reach a leaf
        if (typeof eventMapping[key] === 'object' && !Array.isArray(eventMapping[key])) {
            if ('enum' in eventMapping[key]) {
                if (typeof eventMapping[key]['enum']['evaluate'] === 'string' && eventMapping[key]['enum']['evaluate'].startsWith('$.')) {
                    let value = getDotLocatorValue(eventMapping[key]['enum']['evaluate'], event);
                    if (value in eventMapping[key]['enum']['values']) {
                        newRecord[key] = eventMapping[key]['enum']['values'][value];
                    } else {
                        newRecord[key] = eventMapping[key]['enum']['other'];
                    }
                }
            } else {
                newRecord[key] = performTransform(eventMapping[key], event);
            }
        } else { // we have reached a leaf node
            // get the field if dot locator
            if (typeof eventMapping[key] === 'string' && eventMapping[key].startsWith('$.')) {
                let locatorValue = getDotLocatorValue(eventMapping[key], event);
                if (locatorValue !== null) {
                    newRecord[key] = locatorValue;
                }
            } else {
                // otherwise just map it
                newRecord[key] = eventMapping[key];
            }
        }
    }
    return newRecord;
}

function run(payload_json, mappingNameField, outputField) {
    logger("Loading event");
    let eventMapping = payload_json[mappingNameField];
    logger("Reading mapping file");
    let custom_source_mapping = JSON.parse(fs.readFileSync(`./mappings/${eventMapping}.json`, 'utf8'));

    logger("Get match value from event");
    var matched_value = getDotLocatorValue(custom_source_mapping['custom_source_events']['matched_field'], payload_json);
    logger("Matched value: " + matched_value);

    if (matched_value in custom_source_mapping['custom_source_events']['ocsf_mapping']) {
        logger("Found event mapping: " + JSON.stringify(custom_source_mapping['custom_source_events']['ocsf_mapping'][matched_value]));
        let new_map = performTransform(custom_source_mapping['custom_source_events']['ocsf_mapping'][matched_value]['schema_mapping'], payload_json);
        let new_schema = {};
        new_schema['target_schema'] = custom_source_mapping['custom_source_events']['ocsf_mapping'][matched_value]['schema'];
        new_schema['target_mapping'] = new_map;
        // new_schema['eventday'] = partition['eventday'];

        logger("Transformed OCSF record: " + JSON.stringify(new_schema));
        payload_json[outputField] = new_schema;
    }
    else {
        logger("No mapping found for event match_value: " + matched_value + " in " + eventMapping);
    }
    logger("Print transformed event");
    logger(JSON.stringify(payload_json, null, 2));

    return payload_json;
}

module.exports = { run }