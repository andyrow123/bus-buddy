var AWS = require("aws-sdk");
const http = require('http');
const request = require('request');

var dynamodb = new AWS.DynamoDB.DocumentClient({region: "eu-west-1"});
function test(callback) {
    var params = {
    	                TableName: 'busStopCodeLookup'
                    };
                    dynamodb.scan(params, function(err, data) {
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

function getApiData(napTanCode) {
    request('https://api.tfl.gov.uk/Line/466/Arrivals/' + napTanCode, function (error, response, body) {
            if (!error && response.statusCode == 200) {
            // from within the callback, write data to response, essentially returning it.
                var jsonText = JSON.parse(body);
                // var speechOutput = jsonText['text'];
                
                console.log(jsonText);
            
            } else {
                console.log(error + ' : ' + response.statusCode);
            }
        });
}

exports.handler = (event, context, callback) => {
    
    try {
        if (event.session.new) {
            console.log("request type", event.request.type); 
            switch (event.request.type) {
                case "LaunchRequest":
                    napTanCode = test(callback);
                    getApiData(napTanCode)
                    // context.succeed(
                     
                    //     // readDynamoItem(callback))
                    //     // generateResponse(
                    //     //     buildSpeechletResponse("Hi, I'm Bus Buddy", true),{})
                    //         )
                    break;
                case "IntentRequest":
                    context.succeed(
                        generateResponse(
                            buildSpeechletResponse("Shall we break for lunch", true),{})
                            )
                    break;
                default:
                    context.fail('INVALID REQUEST TYPE: ${event.request.type}')
            }
        }
    }
    catch(error) { 
        context.fail('exception ${error}' + error)
    }
};

buildSpeechletResponse = (outputTest, shouldEndSession) => {
    return {
        outputSpeech : {
            type:"PlainText",
            text: outputTest
        },
        shouldEndSession: shouldEndSession
    }
}

generateResponse = (speechletResponse, sessionAttributes) => {
    return {
        version: "1.0",
        sesionAttributes: sessionAttributes,
        response: speechletResponse
    }
}