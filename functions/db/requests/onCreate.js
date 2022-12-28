
const functions = require('firebase-functions')
const admin = require('firebase-admin')

const { handleNotification, getFcmTokens } = require('../../utils/notifications')
const { handleEmail } = require('../../utils/emails')
const { template1 } = require('../../emails/templates')

const db = admin.firestore()

exports.onCreateRequest = functions.firestore
    .document('Requests/{requestId}')
    .onWrite(async (change, context) => {

        const { requestId } = context.params

        //const before = change.before.exists ? change.before.data() : null
        const after = change.after.exists ? change.after.data() : null
        if (!after) return //deleted from db
        if (after.type === "project") return

        //Notify the commercial contact of the concerned project that a ticket was created
        var receivers = [after.comContact]
        const notificationTitle = `Nouveau ticket:`
        const notificationBody = `Le client ${after.client.fullName} a soumis un ticket.`
        const navParams = { screen: 'CreateTicketReq', RequestId: requestId }

        const notification = {
            title: notificationTitle,
            body: notificationBody,
            collection: 'requests',
            action: 'update',
            data: navParams,
            channelId: "Requests"
        }

        const tokens = await getFcmTokens(receivers)
        const notificationPayload = { tokens, notification }
        await handleNotification(receivers, notificationPayload)

        const appLinkRoot = `https://synergys.page.link/?link=https%3A%2F%2Fsynergys.page.link%2Fapp`
        const appLink = `${appLinkRoot}%3FrouteName%3DProcess&&ProcessId%3D${requestId}`
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




