
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const _ = require('lodash')
var moment = require('moment')

const { initEvents, setTriggerAndUpdatedField, updateUserTurnover, getUsersByRole } = require('../../utils/db')
const { initReceivers, notificationSetting, handleNotification, getFcmTokens } = require('../../utils/notifications')
const { emailSetting, handleEmail } = require('../../utils/emails')
const { isCurrentActionDifferent, getCurrentPhase, getCurrentAction } = require('../../utils/process')
const { template1 } = require('../../emails/templates')

const db = admin.firestore()

exports.onWriteProcess = functions.firestore
    .document('Projects/{projectId}/Process/{processId}')
    .onWrite(async (change, context) => {

        const { projectId, processId } = context.params

        const before = change.before.exists ? change.before.data() : null
        const after = change.after.exists ? change.after.data() : null
        if (!after) return //deleted from db

        //Check if action was done (check if latest action has changed)
        const latestAction_before = getCurrentAction(before)
        const latestAction_after = getCurrentAction(after)
        const isActionDone = latestAction_before.id !== latestAction_after.id

        if (!isActionDone) return

        //console.log("Projet ", projectId, ": l'action", latestAction_before.title, "a été finalisée.")

        // //2. Notifications & Emails
        const project = (await (db.collection("Projects").doc(projectId).get())).data()
        const admin = { email: "sa.lyoussi@gmail.com", fullName: "Salim Lyoussi", id: "GS-US-xQ6s", role: "Admin" }

        //NOTIFY CLIENT
        if (latestAction_after.responsable === "Client") {
            var notificationBody = `Veuillez effectuer l'action: ${latestAction_after.title}`
            var receivers = [project.client]
        }

        //NOTIFY COMMERCIAL
        else {
            var notificationBody = `L'action "${latestAction_before.title}" a été finalisée.`
            //var receivers = [admin]
            var receivers = [project.comContact]
        }

        const notificationTitle = `Projet ${projectId}:`
        const navParams = { screen: 'Process', ProjectId: projectId }

        const notification = {
            title: notificationTitle,
            body: notificationBody,
            collection: 'process',
            action: 'update',
            data: navParams,
            channelId: "Process"
        }

        const tokens = await getFcmTokens(receivers)
        const notificationPayload = { tokens, notification }
        await handleNotification(receivers, notificationPayload)

        const appLinkRoot = `https://synergys.page.link/?link=https%3A%2F%2Fsynergys.page.link%2Fapp`
        const appLink = `${appLinkRoot}%3FrouteName%3DProcess&&ProcessId%3D${processId}`
        const html = template1(notificationBody, appLink)
        const email = { subject: notificationTitle, html }
        const receiversEmails = receivers.map((receiver) => receiver.email)
        const emailPayload = {
            email,
            receivers: receiversEmails
        }
        await handleEmail(emailPayload)
        return
    })


//Specific for project collection
function project_updatedField_setter(trigger, before, after) {
    let field = ''
    if (trigger === 'onUpdate') {
        if (before.state !== after.state) field = 'state'
        else if (before.step !== after.step) field = 'step'
        else if (before.address.description !== after.address.description) field = 'address'
        else if (!_.isEqual(before.bill, after.bill)) field = 'bill'
        else if (!_.isEqual(before.comContact, after.comContact)) field = 'comContact'
        else if (!_.isEqual(before.techContact, after.techContact)) field = 'techContact'
        //else if (isCurrentActionDifferent(before.process, after.process)) field = 'process'
    }
    return field
}

function project_messageReceivers_filter(receivers, event, before, after) {
    const { trigger, field } = event

    if (trigger === 'onUpdate') {
        if (event.field === 'comContact')
            receivers = [after.comContact]
        else if (event.field === 'techContact')
            receivers = [after.techContact]

        // //Notify the list of concerned people ("notified" attribute)
        // else if (event.field === 'process') {
        //     const currentPhase = getCurrentPhase(after.process)
        //     receivers = receivers.filter((receiver) => after.process[currentPhase].followers.includes(receiver.role))
        // }
    }
    return receivers
}





