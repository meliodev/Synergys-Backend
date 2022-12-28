

const functions = require('firebase-functions')
const client = require('twilio')(functions.config().twilio.accountsid, functions.config().twilio.authtoken)

const sendTwilioSMS = async (body, to) => {
    // return client.messages
    //     .create({
    //         body,
    //         from: '+212-621581718',
    //         to
    //     })
    //     .then(message => console.log(message.sid))
    //     .catch((e) => { throw new Error(e) })
      return  client.messages 
      .create({   
         messagingServiceSid: 'MG4a147b4d60b06e5c1af63209361d66ac',      
         to,
         body 
       }) 
      .then(message => console.log(message.sid)) 
      .catch((e) => { throw new Error(e) })
     .done();
}

module.exports = { sendTwilioSMS }

