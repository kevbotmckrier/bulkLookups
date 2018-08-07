//////////////////////////////////////////////////////////////////////////////////////////////////
////           Call script with: node bulkLookups.js SID Auth Phone Number .csv               ////
//////////////////////////////////////////////////////////////////////////////////////////////////

var sid = process.env.BULK_SID;
var auth = process.env.BULK_AUTH;
var lookupType = process.env.BULK_LOOKUP_TYPE; // fraud or carrier
var bulkCSVHeaders = process.env.BULK_CSV_HEADERS;
var errorOutput = process.env.BULK_OUTPUT;

if(!(process.argv[2] && sid && auth && lookupType && bulkCSVHeaders)) {

	console.log("Please pass in the following variables: SID, Auth, .csv of phone numbers");
	process.exit(1);

} else {
    console.log("You are running " + lookupType + " Lookups");
}

var pnCsv = process.argv[2];

var concurrency = 50;

var request = require('request');
var fs = require('fs');
var async = require('async');
var Promise = require('bluebird');
var rp = require('request-promise');

var parse = require('csv-parse');
var transform = require('stream-transform');

var stream = fs.createWriteStream('output-' + lookupType + '.csv');

var errorStream = fs.createWriteStream('errors-' + lookupType + '.csv');
var lastErrorNumber = "";

var errorList = [];

var uriSuffix = (lookupType === "fraud") ? '?Type=fraud' : '?Type=carrier';
if(lookupType === "fraud" && bulkCSVHeaders){
    stream.write("phone_number,advanced_line_type,mobile_country_code,mobile_network_code,caller_name,is_ported,last_ported_type\n");
} else if(lookupType === "carrier" && bulkCSVHeaders) {
    stream.write("phone_number,carrier_name,carrier_type\n");

}

var q = async.queue(function(task,callback){

    var uri = 'https://lookups.twilio.com/v1/PhoneNumbers/' + task.phoneNumber + uriSuffix;

    options = {
        json: true,
        uri: uri,
        method: 'GET',
        auth: {
            user: sid,
            pass: auth
        }
    };

    rp(options)
    .then(function(response){

        if(lookupType === "fraud"){
            stream.write(response.phone_number+','+response.fraud.advanced_line_type+','+response.fraud.mobile_country_code+','+response.fraud.mobile_network_code+','+response.fraud.caller_name+','+response.fraud.is_ported+','+response.fraud.last_ported_date+'\n');
        } else if (lookupType === "carrier") {
            var carrierName = response.carrier.name.replace(",","");
            stream.write(response.phone_number+','+carrierName+','+response.carrier.type+'\n');
        }
        callback();

    })
    .catch(function(err){
        if(task)
        if(errorOutput){
            console.log(err);            
        }
        if(!task.retries){
            task.retries=1;
            q.push(task);
        }
        else if (task.retries<5){
            task.retries++;
            q.push(task);
        } else {
            errorStream.write(task.phoneNumber+"\n");
            errorList.push([task,'Maximum retries exceeded!']);
        }

        callback();
    });

},concurrency);

q.drain = function(){
    console.log('All numbers looked up.');
    if(errorList.length>0 && errorOutput){
        console.log('Errors:\n',errorList);
    }

}

var csvData=[];
fs.createReadStream(pnCsv)
    .pipe(parse({delimiter: ':'}))
    .on('data', function(csvrow) {
        q.push({phoneNumber: csvrow[0]});        
    });