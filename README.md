# Bulk Lookups for Twilio Lookup

1. Add TWILIO SID and AUTH TOKEN to demo.env
1. `source demo.env`
1. Put source phone numbers into a csv file.  1 column of numbers. (e.g. 15551234567)
1. Execute `node bulkLookup.js input.csv`

* Code will run and output information to output.csv.
* We will try each number 5 times.  If still invalid, we will output errors to errors.csv
