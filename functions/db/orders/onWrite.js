
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const _ = require('lodash')
var moment = require('moment')

const { initEvents, setTriggerAndUpdatedField, updateUserTurnover, getUsersByRole } = require('../../utils/db')
const { initReceivers, notificationSetting, handleNotification, getFcmTokens } = require('../../utils/notifications')
const { emailSetting, handleEmail } = require('../../utils/emails')
const { isCurrentActionDifferent, getCurrentPhase } = require('../../utils/process')
const { template1 } = require('../../emails/templates')

const db = admin.firestore()

exports.onWriteOrder = functions.firestore
    .document('Orders/{orderId}')
    .onWrite(async (change, context) => {

        const { orderId } = context.params
        const before = change.before.exists ? change.before.data() : null
        const after = change.after.exists ? change.after.data() : null
        if (!after) return //deleted from db

        //Events
        const events = initEvents(before, after) //events = { isCreate, isUpdate, isArchive }
        const event = setTriggerAndUpdatedField(events, before, after, order_updatedField_setter) //exp: trigger = 'onUpdate'; field = 'name' 

        if (event.field === '') return null //Ignore update

        //2. Notifications & Emails
        //Set receivers
        const admins = await getUsersByRole('Admin')
        const respTechs = await getUsersByRole('Service technique')
        const directeurComs = await getUsersByRole('Service commercial')
        let receivers = []
        receivers = receivers.concat(admins, respTechs, directeurComs)
        //receivers = initReceivers(receivers, after.editedBy.id)
        //receivers = project_messageReceivers_filter(receivers, event, before, after)

        //const notificationPayload = await notificationSetting('orders', receivers, event, orderId, before, after) //id

        if (event.field === "validated") {

            const appLinkParams = { ListScreen: 'ListOrders', CreateScreen: 'CreateOrder', DocumentId: 'OrderId' }
            const { ListScreen, CreateScreen, DocumentId } = appLinkParams

            //Notification
            const tokens = await getFcmTokens(receivers)
            const channelId = 'orders'
            const navParams = { screen: 'CreateOrder', OrderId: orderId }
            const data = event.trigger === 'onArchive' ? null : navParams

            var notificationPayload = {
                notification: {
                    title: 'Remise à valider',
                    body: `Veuillez valider la remise appliquée par le commercial ${after.editedBy.fullName}.`,
                    collection: 'orders',
                    data,
                    channelId,
                    action: 'update.validated', //not used
                    actor: after.editedBy, //not used
                },
                tokens
            }

            //Email
            const body = `Veuillez valider la remise appliquée par le commercial ${after.editedBy.fullName} sur la commande ${orderId}.`
            const appLinkRoot = `https://synergys.page.link/?link=https%3A%2F%2Fsynergys.page.link%2Fapp`
            const appLink = `${appLinkRoot}%3FrouteName%3D${CreateScreen}&&${DocumentId}%3D${orderId}`
            const html = template1(body, appLink)
            const receiversEmails = receivers.map((receiver) => receiver.email)

            var emailPayload = {
                email: {
                    subject: `Vous avez une remise à valider`,
                    html
                },
                receivers: receiversEmails
            }
        }

        if (notificationPayload)
            await handleNotification(receivers, notificationPayload) //id, role

        if (emailPayload)
            await handleEmail(emailPayload)
        return
    })


//Specific for project collection
function order_updatedField_setter(trigger, before, after) {
    let field = ''
    // if (trigger === 'onUpdate') {
    if (!after.validated) {
        field = 'validated'
    }
    // }
    return field
}


