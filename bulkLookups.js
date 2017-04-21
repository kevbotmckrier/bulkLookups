//////////////////////////////////////////////////////////////////////////////////////////////////
////           Call script with: node bulkLookups.js SID Auth Phone Number .csv               ////
//////////////////////////////////////////////////////////////////////////////////////////////////

if(!(process.argv[2]&&process.argv[3]&&process.argv[4])) {

	console.log("Please pass in the following variables: SID, Auth, .csv of phone numbers");
	process.exit(1);

}

var sid = process.argv[2];
var auth = process.argv[3];
var pnCsv = process.argv[4];

var concurrency = 50;

var request = require('request');
var fs = require('fs');
var async = require('async');
var Promise = require('bluebird');
var rp = require('request-promise');

var parse = require('csv-parse');
var transform = require('stream-transform');

var stream = fs.createWriteStream('output.csv');

var errorList = [];

var q = async.queue(function(task,callback){

    var uri = 'https://lookups.twilio.com/v1/PhoneNumbers/' + task.phoneNumber + '?Type=carrier';

    options = {
        json: true,
        uri: uri,
        method: 'GET',
        auth: {
            user: sid,
            pass: auth
        }
    }

    rp(options)
    .then(function(response){

        stream.write(response.phone_number+','+response.carrier.name+','+response.carrier.type+'\n');
        callback();

    })
    .catch(function(err){
        console.log(err);
        if(!task.retries){
            task.retries=1;
            q.push(task);
        }
        else if (task.retries<5){
            task.retries++;
            q.push(task);
        } else {
            errorList.push([task,'Maximum retries exceeded!']);
        }

        callback();
    });

},concurrency);

q.drain = function(){
    console.log('All numbers looked up.');
    if(errorList.length>0){
        console.log('Errors:\n',errorList);
    }

}

var csvData=[];
fs.createReadStream(pnCsv)
    .pipe(parse({delimiter: ':'}))
    .on('data', function(csvrow) {
        q.push({phoneNumber: csvrow[0]});        
    });