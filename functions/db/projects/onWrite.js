
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const _ = require('lodash')
const { initEvents, setTriggerAndUpdatedField, } = require('../../utils/db')
const { initReceivers, notificationSetting, handleNotification } = require('../../utils/notifications')
const { emailSetting, handleEmail } = require('../../utils/emails')
const { isCurrentActionDifferent, getCurrentAction, getCurrentPhase } = require('../../utils/process')
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
        console.log('TRIGGER', event.trigger)
        console.log('FIELD', event.field)

        if (event.trigger === 'onUpdate' && event.field === '') return null //Ignore update
        
        //Receivers
        let receivers = after.subscribers.concat(after.client)
        receivers = initReceivers(receivers, after.editedBy.id)
        receivers = project_messageReceivers_filter(receivers, event, before, after)

        const appLinkParams = { ListScreen: 'ListProjects', CreateScreen: 'CreateProject', DocumentId: 'ProjectId' }
        const notificationPayload = await notificationSetting('projects', receivers, event, projectId, before, after)
        const emailPayload = emailSetting('projects', receivers, event, projectId, before, after, appLinkParams)

        if (!notificationPayload) return
        await handleNotification(receivers, after.client, notificationPayload)

        if (!emailPayload) return
        await handleEmail(emailPayload)
        return
    })


//Specific for project collection
function project_updatedField_setter(trigger, before, after) {

    let field = ''

    if (trigger === 'onUpdate') {
        console.log('ONUPDATE..........')
        const beforeSubscribersIds = before.subscribers.map((sub) => sub.id)
        const afterSubscribersIds = after.subscribers.map((sub) => sub.id)

        if (before.state !== after.state) field = 'state'
        else if (before.step !== after.step) field = 'step'
        else if (before.address.description !== after.address.description) field = 'address'
        else if (!_.isEqual(beforeSubscribersIds, afterSubscribersIds)) field = 'subscribers'
        else if (isCurrentActionDifferent(before.process, after.process)) field = 'process'
    }

    return field
}

function project_messageReceivers_filter(receivers, event, before, after) {

    const { trigger, field } = event

    if (trigger === 'onUpdate') {

        //Notify the new subscriber only
        if (event.field === 'subscribers') {
            const beforeSubscribersIds = before.subscribers.map((sub) => sub.id)
            const afterSubscribersIds = after.subscribers.map((sub) => sub.id)
            let newSubscriberId = afterSubscribersIds.filter(sub => !beforeSubscribersIds.includes(sub)) //find Id of new subscriber
            receivers = receivers.filter((receiver) => receiver.id === newSubscriberId[0])
        }

        //Notify the list of concerned people ("notified" attribute)
        else if (event.field === 'process') {
            const currentPhase = getCurrentPhase(after.process)
            receivers = receivers.filter((receiver) => after.process[currentPhase].followers.includes(receiver.role))
        }
    }

    return receivers
}


