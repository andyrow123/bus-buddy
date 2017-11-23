/* eslint-disable  func-names */
/* eslint quote-props: ["error", "consistent"]*/
/**
 * This sample demonstrates a simple skill built with the Amazon Alexa Skills
 * nodejs skill development kit.
 * This sample supports multiple lauguages. (en-US, en-GB, de-DE).
 * The Intent Schema, Custom Slots and Sample Utterances for this skill, as well
 * as testing instructions are located at https://github.com/alexa/skill-sample-nodejs-fact
 **/

'use strict';
const http = require('http');
const request = require('request');
const Alexa = require('alexa-sdk');
var AWS = require("aws-sdk");
var dynamodb = new AWS.DynamoDB.DocumentClient({ region: "eu-west-1" });

//=========================================================================================================================================
//TODO: The items below this comment need your attention.
//=========================================================================================================================================

//Replace with your app ID (OPTIONAL).  You can find this value at the top of your skill's page on http://developer.amazon.com.
//Make sure to enclose your value in quotes, like this: const APP_ID = 'amzn1.ask.skill.bb4045e6-b3e8-4133-b650-72923c5980f1';
const APP_ID = 'amzn1.ask.skill.e15d8f00-11e4-4d3c-a3b6-90e1a4624ba0';
//=========================================================================================================================================
//Editing anything below this line might break your skill.
//=========================================================================================================================================
var phraseNumber = 0;

exports.handler = function (event, context, callback) {
    // phraseNumber = event.request.intent.slots.phraseNumber.value;
    try {
        if (event.session.new) {

            console.log("request type", event.request.type);

            if (event.request.type === 'LaunchRequest') {
                context.succeed(generateResponse(buildSpeechletResponse("Hi, I'm Bus Buddy", true), {}))
            }

            switch (event.request.intent.name) {
                case "MyBusIntent":
                    // var napTanCode = getNapTanCode(callback);
                    var napTanCode = '490010331E';
                    getApiData(napTanCode, function (jsonText) {
                        var station = jsonText[0]['stationName']
                        var time = new Date(jsonText[0]['expectedArrival']).toLocaleTimeString();
                        context.succeed(
                            generateResponse(
                                buildSpeechletResponse("It will arrive at "+ station + " stop at " + time, true), {})
                        )
                    });
                    break;
                default:
                    context.fail('INVALID REQUEST TYPE: ${event.request.type}')
            }
        }
    }
    catch (error) {
        context.fail('exception ${error}' + error)
    }
};

const handlers = {
    'LaunchRequest': function () {
        this.emit(':tell', 'Hi!');
        // this.emit('PhraseIntent');        
    },
    'PhraseIntent': function () {
        // self = this

        request('https://alexa-test-api.herokuapp.com/phrases/' + phraseNumber, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                // from within the callback, write data to response, essentially returning it.
                // var speechOutput = JSON.stringify(body['text']);
                var jsonText = JSON.parse(body);
                var speechOutput = jsonText['text'];

                console.log(body + " :Raw output?");
                console.log(speechOutput + ' :JSON stringified');
                console.log(response.statusCode);
                this.emit(':tell', speechOutput); // USE SELF HERE                
                // self.emit(':tell', speechOutput); // USE SELF HERE
            } else {
                console.log(error + ' : ' + response.statusCode);
                this.emit(':tell', 'There was an error'); // AND HERE AS WELL                
                // self.emit(':tell', 'There was an error'); // AND HERE AS WELL
            }
        });
    },
    'AMAZON.HelpIntent': function () {
        const speechOutput = HELP_MESSAGE;
        const reprompt = HELP_REPROMPT;

        this.response.speak(speechOutput).listen(reprompt);
        this.emit(':responseReady');
    },
    'AMAZON.CancelIntent': function () {
        this.response.speak(STOP_MESSAGE);
        this.emit(':responseReady');
    },
    'AMAZON.StopIntent': function () {
        this.response.speak(STOP_MESSAGE);
        this.emit(':responseReady');
    },
};

var buildSpeechletResponse = (outputTest, shouldEndSession) => {
    return {
        outputSpeech: {
            type: "PlainText",
            text: outputTest
        },
        shouldEndSession: shouldEndSession
    }
}

var generateResponse = (speechletResponse, sessionAttributes) => {
    return {
        version: "1.0",
        sesionAttributes: sessionAttributes,
        response: speechletResponse
    }
}

function getNapTanCode(callback) {
    var params = {
        TableName: 'busStopCodeLookup'
    };
    dynamodb.scan(params, function (err, data) {
        if (err) {
            callback(err, null);
        } else {
            console.log(data['Items'][0]['napTanCode']);
            return data['Items'][0]['napTanCode']
            // console.log(parsedData['napTanCode']);
            callback(null, data);
        }
    });

}

function getApiData(napTanCode, callback) {
    var data = {};
    request('https://api.tfl.gov.uk/StopPoint/' + napTanCode + '/arrivals', function (error, response, body) {
        if (!error && response.statusCode == 200) {
            // from within the callback, write data to response, essentially returning it.
            var jsonText = JSON.parse(body);
            callback(jsonText);
        } else {
            console.log(error + ' : ' + response.statusCode);
        }
    });
}
