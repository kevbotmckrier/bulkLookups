# Bulk Lookups for Twilio Lookup

1. Add TWILIO SID and AUTH TOKEN to demo.env
1. Do you want to do `fraud` or `carrier` Lookups?
    1. Put in the appropriate value.
1. `source demo.env`
1. Put source phone numbers into a csv file.  1 column of numbers. (e.g. 15551234567)
1. Execute `node bulkLookup.js input.csv`


## Output
Found information:
output-[type].csv

Error information (invalid numbers):
error-[type].csv
 

### Resources
The error output will include the error response for each particular number.
You can find a list of all Twilio error codes, [here](https://www.twilio.com/docs/api/errors);

