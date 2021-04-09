
const functions = require('firebase-functions')
const client = require('twilio')(functions.config().twilio.accountsid, functions.config().twilio.authtoken)

exports.sendCode = functions.https.onRequest(async (req, res) => {
    await client.verify.services(functions.config().twilio.serviceid)
        .verifications
        .create({ to: req.body.data.phoneNumber, channel: 'sms', locale: 'fr' })
        .then(verification => {
            console.log(verification.status)
            res.status(200).send({ data: { status: verification.status } })
        });
    // .catch((err) => {
    //     console.log(err)
    //     throw new functions.https.HttpsError(
    //         '',
    //         ''
    //     )
    //     res.status(200).send({ data: { error: err } })
    // });
})
