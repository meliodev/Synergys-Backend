
const functions = require('firebase-functions')
const client = require('twilio')(functions.config().twilio.accountsid, functions.config().twilio.authtoken)

exports.verifyCode = functions.https.onRequest(async (req, res) => {

    await client.verify.services(functions.config().twilio.serviceid)
        .verificationChecks
        .create({ to: req.body.data.phoneNumber, code: req.body.data.code })
        .then(verification_check => {
            console.log(verification_check.status)
            res.status(200).send({ data: { status: verification_check.status } })
        })
        .catch((err) => {
            console.log(err)
            res.status(200).send({ data: { error: err } })
        });
})
