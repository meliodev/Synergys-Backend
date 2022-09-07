

const functions = require('firebase-functions')
const client = require('twilio')(functions.config().twilio.accountsid, functions.config().twilio.authtoken)

const sendTwilioSMS = async (body, to) => {
    return client.messages
        .create({
            body,
            from: '+14013570228',
            to
        })
        .then(message => console.log(message.sid))
        .catch((e) => { throw new Error(e)})
}

module.exports = { sendTwilioSMS }