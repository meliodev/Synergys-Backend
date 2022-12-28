
const functions = require('firebase-functions')
const client = require('twilio')(functions.config().twilio.accountsid, functions.config().twilio.authtoken)

exports.verifyCode = functions.https.onRequest(async (req, res) => {

    //VA2268ccd7f5e55754739e7eaa7b1d0795 (old)
    await client.verify.services(functions.config().twilio.serviceid)
        .verificationChecks
        .create({
            to: req.body.data.phoneNumber,
            code: req.body.data.code
        })
        .then(verification_check => {
            res.status(200).send({ data: { status: verification_check.status } })
        })
        .catch((err) => {
            res.status(200).send({ data: { error: err } })
        })
})



