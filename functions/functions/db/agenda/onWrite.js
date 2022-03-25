
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const _ = require('lodash')
const { initEvents, setTriggerAndUpdatedField, getUsersByRole, } = require('../../utils/db')
const { initReceivers, notificationSetting, handleNotification } = require('../../utils/notifications')
const { emailSetting, handleEmail } = require('../../utils/emails')
const { template1 } = require('../../emails/templates')

const db = admin.firestore()

exports.onWriteAgenda = functions.firestore
    .document('Agenda/{taskId}')
    .onWrite(async (change, context) => {
        return //#task: remove it
        const { taskId } = context.params
        const before = change.before.exists ? change.before.data() : null
        const after = change.after.exists ? change.after.data() : null

        if (!after) return //deleted from db

        //Events
        const events = initEvents(before, after) //events = { isCreate, isUpdate, isArchive }
        const event = setTriggerAndUpdatedField(events, before, after, agenda_updatedField_setter) //#SPECIFIC //exp: trigger = 'onUpdate'; field = 'name' 

        //Receivers
        const admins = await getUsersByRole('Admin')
        const respTechs = await getUsersByRole('Responsable technique')
        const directeurComs = await getUsersByRole('Directeur commercial')
        let receivers = [after.comContact, after.techContact, after.client]
        receivers.concat(admins, respTechs, directeurComs)
        receivers = initReceivers(receivers, after.editedBy.id)
        receivers = agenda_messageReceivers_filter(receivers, after.natures) //#SPECIFIC

        const notificationPayload = await notificationSetting('agenda', receivers, event, taskId, before, after, agenda_notificationData_setter)
        if (!notificationPayload) return
        await handleNotification(receivers, after.project.client, notificationPayload)

        const appLink = { ListScreen: 'Agenda', CreateScreen: 'CreateTask', DocumentId: 'TaskId' }
        const emailPayload = emailSetting('agenda', receivers, event, taskId, before, after, appLink)
        if (!emailPayload) return
        await handleEmail(emailPayload)
        return
    })


//Specific for project collection
function agenda_updatedField_setter(before, after) {
    let field = ''
    return field
}

function agenda_messageReceivers_filter(receivers, natures) {

    const com = ['Admin', 'Directeur commercial', 'Commercial']
    const tech = ['Admin', 'Responsable technique', 'Poseur']

    if (_.isEqual(natures, ['com'])) {
        receivers = receivers.filter((receiver) => com.includes(receiver.role))
    }

    else if (_.isEqual(natures, ['tech'])) {
        receivers = receivers.filter((receiver) => tech.includes(receiver.role))
    }

    return receivers
}

function agenda_notificationData_setter(event, taskId) {
    let navigation = event.trigger === 'onArchive' ? { screen: 'Agenda' } : { screen: 'CreateTask', TaskId: taskId }
    return navigation
}

