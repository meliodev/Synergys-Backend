
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const _ = require('lodash')
var moment = require('moment')

const { initEvents, setTriggerAndUpdatedField, updateUserTurnover, getUsersByRole } = require('../../utils/db')
const { initReceivers, notificationSetting, handleNotification } = require('../../utils/notifications')
const { emailSetting, handleEmail } = require('../../utils/emails')
const { isCurrentActionDifferent, getCurrentPhase } = require('../../utils/process')
const { template1 } = require('../../emails/templates')

const db = admin.firestore()

exports.onWriteProject = functions.firestore
    .document('Projects/{projectId}')
    .onWrite(async (change, context) => {

        const { projectId } = context.params
        const before = change.before.exists ? change.before.data() : null
        const after = change.after.exists ? change.after.data() : null
        if (!after) return //deleted from db

        //Events
        const events = initEvents(before, after) //events = { isCreate, isUpdate, isArchive }
        const event = setTriggerAndUpdatedField(events, before, after, project_updatedField_setter) //exp: trigger = 'onUpdate'; field = 'name' 

        if (event.trigger === 'onUpdate' && event.field === '') return null //Ignore update

        //1. Update User Tunover
        if (event.trigger === 'onUpdate' && event.field === 'bill') {
            const userId = after.comContact.id
            const billBefore = before.bill
            const billAfter = after.bill

            //Set bill closing date
            if (billBefore.amount === "") {
                await db.collection('Projects').doc(projectId).update({ 'bill.closedAt': after.editedAt, 'bill.closedBy': after.editedBy })
            }

            const billClosedAt = billBefore.amount === "" ? after.editedAt : billAfter.closedAt
            await updateUserTurnover(userId, projectId, billClosedAt, billAfter)
            return
        }

        //2. Notifications & Emails
        //Set receivers
        const admins = await getUsersByRole('Admin')
        const respTechs = await getUsersByRole('Responsable technique')
        const directeurComs = await getUsersByRole('Directeur commercial')
        let receivers = [after.comContact, after.client] //#task: add intervenant if he exists
        if (after.techContact.id !== "")
            receivers.push(after.techContact)
        receivers = receivers.concat(admins, respTechs, directeurComs)
        //receivers = initReceivers(receivers, after.editedBy.id)
        receivers = project_messageReceivers_filter(receivers, event, before, after)

        const navParams = { screen: 'CreateProject', ProjectId: projectId }
        const notificationPayload = await notificationSetting('projects', receivers, event, projectId, before, after, navParams) //id

        const appLinkParams = { ListScreen: 'ListProjects', CreateScreen: 'CreateProject', DocumentId: 'ProjectId' }
        const emailPayload = emailSetting('projects', receivers, event, projectId, before, after, appLinkParams) //email

        if (notificationPayload)
            await handleNotification(receivers, notificationPayload) //id, role

        if (emailPayload)
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





