
const functions = require('firebase-functions')
const admin = require('firebase-admin')

const { handleNotification, getFcmTokens } = require('../../utils/notifications')
const { handleEmail } = require('../../utils/emails')
const { template1 } = require('../../emails/templates')

const db = admin.firestore()

exports.onCreateAllMessages = functions.firestore
    .document('Messages/{messageId}/AllMessages/{allMessagesId}')
    .onWrite(async (change, context) => {

        const { messageId, allMessagesId } = context.params

        const before = change.before.exists ? change.before.data() : null
        const after = change.after.exists ? change.after.data() : null
        if (!after || before) return //deleted or updated

        //Notify the receiver about new message coming
        var { receivers, message, sender } = after
        const notificationTitle = sender.fullName
        const notificationBody = message
        const navParams = { screen: 'ViewMessage', MessageId: messageId }

        const notification = {
            title: notificationTitle,
            body: notificationBody,
            collection: 'AllMessages',
            action: 'update',
            data: navParams,
            channelId: "AllMessages"
        }

        const tokens = await getFcmTokens(receivers)
        const notificationPayload = { tokens, notification }
        await handleNotification(receivers, notificationPayload)

        const appLinkRoot = `https://synergys.page.link/?link=https%3A%2F%2Fsynergys.page.link%2Fapp`
        const appLink = `${appLinkRoot}%3FrouteName%3DProcess&&ProcessId%3D${allMessagesId}`
        const html = template1(notificationBody, appLink)
        const email = { subject: notificationTitle, html }
        const receiversEmails = receivers.map((receiver) => receiver.email)
        const emailPayload = {
            email,
            receivers: receiversEmails
        }
        //await handleEmail(emailPayload)
        return
    })




