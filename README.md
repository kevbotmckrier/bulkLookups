# bulk lookups
A node script for doing bulk lookups on a CSV of phone numbers. Uses Twilio's lookup API.

## Requirements
1. Development environment that runs node.js scripts (e.g., MacOS Terminal)
2. A Twilio account with a credit card on file
3. A .csv of phone numbers

## Setup
Once you've cloned this repository and switched to the directory, install the app dependencies using `npm install`.

## Run the script
`node bulkLookups.js TWILIO_ACCOUNT_SID TWILIO_AUTH_TOKEN PHONE_NUMBER_CSV`

The command relies on your Twilio Account SID (ACXXXXXXXXXXXXXXXXX), Auth Token (random string, found in Twilio Console), and a CSV of phone numbers.

## Sample CSV
Coming soon.
