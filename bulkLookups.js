//////////////////////////////////////////////////////////////////////////////////////////////////
////           Call script with: node bulkLookups.js input-file.csv               ////
//////////////////////////////////////////////////////////////////////////////////////////////////

var sid = process.env.BULK_SID;
var auth = process.env.BULK_AUTH;
var lookupType = process.env.BULK_LOOKUP_TYPE; // fraud or carrier
var bulkCSVHeaders = process.env.BULK_CSV_HEADERS;
var errorOutput = process.env.BULK_ERROR_OUTPUT;

if (!(process.argv[2] && sid && auth && lookupType && bulkCSVHeaders)) {

    console.log("Please pass in the input filename.");
    process.exit(1);

} else {
    console.log("You are running " + lookupType + " Lookups");
}

var pnCsv = process.argv[2];

var concurrency = 50;

var request = require('request');
var fs = require('fs');
var async = require('async');
var rp = require('request-promise');

var parse = require('csv-parse');
var transform = require('stream-transform');

var stream = fs.createWriteStream('output-' + lookupType + '.csv');

var errorStream = fs.createWriteStream('errors-' + lookupType + '.csv');

var errorList = [];

var uriSuffix = (lookupType === "carrier") ? '?Type=carrier' : '?Type=caller-name';
if (lookupType === "carrier" && bulkCSVHeaders) {
    stream.write("phone_number,carrier_name,carrier_type,mobile_country_code,mobile_network_code\n");
} else if (lookupType === "caller-name" && bulkCSVHeaders) {
    stream.write("phone_number,caller_name,caller_type\n");

}

var q = async.queue(function (task, callback) {

    var uri = 'https://lookups.twilio.com/v1/PhoneNumbers/' + task.phoneNumber + uriSuffix;

    var options = {
        json: true,
        uri: uri,
        method: 'GET',
        auth: {
            user: sid,
            pass: auth
        }
    };

    rp(options)
        .then(function (response) {


            
            if (lookupType === "caller-name") {
                if (response.caller_name.caller_name) {
                    var caller_name = response.caller_name.caller_name.replace(",", "");
                }
                stream.write(response.phone_number + ',' + caller_name + ',' + response.caller_name.caller_type + '\n');
            } else if (response.carrier.name === null) {
                console.log("error with this number: ", task.phoneNumber);
                errorStream.write(task.phoneNumber + response.carrier.error_code  + "\n");
            } else if (lookupType === "carrier") {
                if (response.carrier.name) {
                    var carrierName = response.carrier.name.replace(",", "");
                }
                stream.write(response.phone_number + ',' + carrierName + ',' + response.carrier.type + ',' + response.carrier.mobile_country_code + ',' + response.carrier.mobile_network_code + '\n');
            }
            callback();

        })
        .catch(function (err) {
            if (task)
                if (errorOutput) {
                    console.log('big error: ', err);
                }
            if (!task.retries) {
                task.retries = 1;
                q.push(task);
            }
            else if (task.retries < 5) {
                task.retries++;
                q.push(task);
            } else {
                console.log("error with this number: ", task.phoneNumber);
                errorStream.write(task.phoneNumber + "invalid\n");
                errorList.push([task, 'Maximum retries exceeded!']);
            }

            callback();
        });

}, concurrency);

q.drain = function () {
    console.log('All numbers looked up.');
    if (errorList.length > 0 && errorOutput) {
        if(errorOutput) {
            console.log('Errors:\n', errorList);
        }
        console.log("Check errors-" + lookupType + ".csv for numbers and error codes");
        console.log("See a list of errors codes at https://www.twilio.com/docs/api/errors");
    }
};

fs.createReadStream(pnCsv)
    .pipe(parse({delimiter: ':'}))
    .on('data', function (csvrow) {
        q.push({phoneNumber: csvrow[0]});
    });