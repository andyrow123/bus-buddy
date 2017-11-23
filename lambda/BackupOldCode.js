exports.handler = (event, context) => {
    
    try {
        if (event.session.new) {
            console.log("request type", event.request.type); 
            switch (event.request.type) {
                case "LaunchRequest":
                    context.succeed(
                        generateResponse(
                            buildSpeechletResponse("Hi, I'm Bus Buddy", true),{})
                            )
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
        context.fail('exception ${error}')
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