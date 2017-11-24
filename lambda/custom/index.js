/* eslint-disable  func-names */
/* eslint quote-props: ["error", "consistent"]*/

'use strict';
const http = require('http');
const request = require('request');
// const Alexa = require('alexa-sdk');
var AWS = require("aws-sdk");
var dynamodb = new AWS.DynamoDB.DocumentClient({
    region: "eu-west-1"
});

const speechUtils = require('./speechUtils').speechUtils;

exports.handler = function (event, context, callback) {
    try {
        if (event.session.new) {

            if (event.request.type === 'LaunchRequest') {
                context.succeed(generateResponse(buildSpeechletResponse("<speak>Hi, I'm Bus-Buddy, I can help you plan your journey by remembering your bus stop and telling you when your next bus is arriving</speak>", true), {}))
            }

            switch (event.request.intent.name) {

                case "GetNextBusIntent":
                    var napTanCode;
                    var params = {
                        TableName: 'userNaptanCode',
                        Key: {
                            'userId': event.session.user.userId
                        }
                    };
                    dynamodb.get(params, function (err, data) {
                        if (err) {
                            console.log("Failed to save naptan code" + err)
                        } else {
                            napTanCode = data.Item.napTanCode;
                            getApiData(napTanCode, function (jsonText) {
                              var response = "<speak>";
                              for (var i=0; i<3; i++)  {
                                var station = jsonText[i]['stationName'];
                                var time = timeFromNow(new Date(jsonText[i]['expectedArrival']));
                                var lineName = jsonText[i]['lineName'];
                                response += "Bus " + speechUtils.spellDigitOutput(lineName) + " will arrive at " + station + " stop, in " + time + ((time > 1) ? " minutes" : " minute") + " ";
                              };

                              response += "</speak>";

                              context.succeed(
                                  generateResponse(
                                      buildSpeechletResponse(response, true), {})
                              )
                            });

                        }
                    });
                    // var napTanCode = '490010331E';
                    break;

                case "SetBusStopIntent":
                    var busStopCode = parseInt(event.request.intent.slots.busStopCode.value);
                    getNapTanCode(busStopCode, function (napTanCode) {
                        getApiData(napTanCode, function (jsonText) {
                            var station = jsonText[0]['stationName'];
                            var time = new Date(jsonText[0]['expectedArrival']).toLocaleTimeString();
                            context.succeed(
                                generateResponse(
                                    buildSpeechletResponse("<speak>Your stop is set to " + station + "</speak>", true), {})
                            )
                        });

                        var params = {
                            TableName: 'userNaptanCode',
                            Item: {
                                userId: event.session.user.userId,
                                napTanCode: napTanCode
                            }
                        };
                        dynamodb.put(params, function (err, data) {
                            if (err) {
                                console.log("Failed to save naptan code: " + err)
                            } else {
                                console.log("Saved correctly")
                            }

                        });
                    });
                    break;
                case "GetStopBusesIntent":
                    var params = {
                        TableName: 'userNaptanCode',
                        Key: {
                            'userId': event.session.user.userId
                        }
                    };
                    dynamodb.get(params, function (err, data) {
                        if (err) {
                            console.log("Failed to get naptan code: " + err)
                        } else {
                            getApiData(data.Item.napTanCode, function (arrivals) {
                                var busesText = getStopBusesText(arrivals)
                                context.succeed(
                                    generateResponse(
                                        buildSpeechletResponse(busesText, true), {})
                                )
                            });

                        }
                    });
                    break;
                default:
                    context.fail('INVALID REQUEST TYPE: ${event.request.type}')
            }
        }
    } catch (error) {
        context.fail('exception ${error}' + error)
    }
};


var buildSpeechletResponse = (outputTest, shouldEndSession) => {
    return {
        outputSpeech: {
            type: "SSML",
            ssml: outputTest
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

function getNapTanCode(busStopCode, callAPI) {
    var result = false;

    var params = {
        TableName: 'busStopCodeLookupFull_v4_test',
        Key: {
            "busStopCode": busStopCode
        }
    };

    dynamodb.get(params, function (err, data) {
        if (err) {
            console.log(err + ' : ' + response.statusCode);
        } else {
            result = data.Item.naptanAtco;
            callAPI(result);
        }
    });
}

function getApiData(napTanCode, callback) {
    var url = 'https://api.tfl.gov.uk/StopPoint/' + napTanCode + '/arrivals'
    request(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            // from within the callback, write data to response, essentially returning it.
            var jsonText = JSON.parse(body);
            callback(jsonText);
        } else {
            console.log(error + ' : ' + response.statusCode);
        }
    });
}

function getStopBusesText(arrivals) {
    var buses = [];
    var result = '';

    arrivals.map(function (arrival) {
        buses.push(arrival.lineName);
    })
    buses = buses.filter(function (elem, index, self) {
        return index == self.indexOf(elem);
    })

    result = speechUtils.formTextList(buses);

    return result
}

function timeFromNow(time) {
    var timeNow = new Date;

    time = time.getTime() - timeNow.getTime();

    return Math.round(time / 60000); // minutes
}
