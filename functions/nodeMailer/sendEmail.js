
const functions = require('firebase-functions')
const { wrapperSendMail } = require('../utils/emails')

exports.sendEmail = functions.https.onCall(async (data, context) => {
    const { receivers, subject, html, attachments } = data
    const isSent = await wrapperSendMail(receivers, subject, html, attachments)
    return isSent
})