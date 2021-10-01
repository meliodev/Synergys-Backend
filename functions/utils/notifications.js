
const admin = require('firebase-admin')
const db = admin.firestore()
const _ = require('lodash')
const { getCurrentAction, getResponsable } = require('./process')

//Firebase messaging methods
async function getFcmTokens(receivers) {
    let tokens = []
    for (const receiver of receivers) {
        const tokensDoc = await db.collection('FcmTokens').doc(receiver.id).get()
        if (tokensDoc && tokensDoc.exists)
            tokens = tokens.concat(tokensDoc.data().tokens)
    }
    return tokens
}

async function sendMulticast(tokens, notification) {

    const { title, body, channelId, data } = notification

    await admin.messaging().sendMulticast({
        tokens,
        // {
        data: {
            notifee: JSON.stringify({
                title,
                body,
                android: {
                    channelId,
                    //timestamp: Date.now() - 480000, // 8 minutes ago
                    pressAction: {
                        id: 'default',
                    },
                    // actions,
                },
                data
            })
        }
        //         ,{
        //     contentAvailable: true, //Required for background/quit data-only messages on iOS
        //     priority: 'high', //Required for background/quit data-only messages on Android //ADD APNS ALSO: check fcm documentation
        // }
        // }
    })
        .then(() => console.log('notification sent'))
        .catch((e) => console.error(e))
}

//Generic
function initReceivers(usersList, editedById) { //Remove "editedBy" user
    let receivers = usersList.filter((sub) => sub.id !== editedById)
    return receivers
}

async function notificationSetting(collection, receivers, event, docId, before, after, navParams) {
    let tokens = await getFcmTokens(receivers)
    const notification = setNotification(collection, event, docId, before, after, navParams)
    if (tokens.length === 0 || !notification) return null
    const payload = { tokens, notification }
    return payload
}
 
function setNotification(collection, event, docId, before, after, navParams) {
    const { trigger, field } = event
    const model = getNotificationsModel(collection, docId, before, after)
    const isHandledUpdate = trigger === 'onUpdate' && model[trigger]
    let notification = isHandledUpdate ? model[trigger][field] : model[trigger]
    if (!notification) return null

    const data = event.trigger === 'onArchive' ? null : navParams
    notification.data = data
    notification.channelId = collection
    return notification
}

//Specific 
function getNotificationsModel(collection, docId, before, after) {

    let notificationsModel = null

    if (collection === 'projects') {
        const { state, step, address } = after
        // const currentAction = getCurrentAction(after.process)
        // const responsableRole = currentAction && currentAction.responsable || ''

        notificationsModel = {
            onCreate: {
                title: 'Nouveau projet',
                body: `Le projet ${after.name} (${docId}) a été crée`,  //ْreceivers: all
                collection: 'projects',
                action: 'creation',
                actor: after.createdBy,
            },
            onArchive: {
                title: 'Projet archivé',
                body: `Le projet ${docId} a été archivé`,  //ْreceivers: all
                collection: 'projects',
                action: 'archive',
                actor: after.editedBy,
            },
            onUpdate: {
                state: {
                    title: 'Suivi de projet',
                    body: `Le projet ${docId} est ${state} `,  //ْreceivers: all
                    collection: 'projects',
                    action: 'update.state',
                    actor: after.editedBy,
                },
                step: {
                    title: 'Suivi de projet',
                    body: `Le projet ${docId} est en phase ${step} `,  //ْreceivers: all
                    collection: 'projects',
                    action: 'update.step',
                    actor: after.editedBy,
                },
                address: {
                    title: 'Suivi de projet',
                    body: `L'adresse du projet ${docId} a été modifiée`,  //ْreceivers: all
                    collection: 'projects',
                    action: 'update.address',
                    actor: after.editedBy,
                },
                comContact: {
                    title: 'Suivi de projet',
                    body: `Vous avez été invité a collaborer dans le projet ${docId}`, //ْreceivers: new comContact
                    collection: 'projects',
                    action: 'update.comContact',
                    actor: after.editedBy,
                },
                techContact: {
                    title: 'Suivi de projet',
                    body: `Vous avez été invité a collaborer dans le projet ${docId}`, //ْreceivers: new techContact
                    collection: 'projects',
                    action: 'update.techContact',
                    actor: after.editedBy,
                },
                // process: {
                //     title: `Action à faire`,
                //     body: `${getResponsable(after.subscribers, responsableRole).fullName} a une action à faire.`, //#task: this returns undefined
                //     collection: 'projects',
                //     action: 'update.process',
                //     actor: after.editedBy,
                // }
            }
        }
    }

    else if (collection === 'agenda') {

        notificationsModel = {
            onCreate: {
                title: 'Nouvelle tâche',
                body: `La tâche ${after.name} a été assignée à ${after.assignedTo}`  //ْreceivers: all
            },
        }
    }

    else if (collection === 'orders') {
        const { editedBy } = after

        notificationsModel = {
            onCreate: {
                title: 'Nouvelle commande',
                body: `La commande (${docId}) a été crée`,  //ْreceivers: all
                collection: 'orders',
                action: 'creation',
                actor: after.createdBy,
            },
            onArchive: {
                title: 'Commande archivée',
                body: `La commande ${docId} a été archivé`,  //ْreceivers: all
                collection: 'orders',
                action: 'archive',
                actor: after.editedBy,
            },
            onUpdate: {
                validated: {
                    title: 'Remise à valider',
                    body: `Veuillez valider la remise appliquée par le commercial ${editedBy.fullName}.`,  //ْreceivers: all
                    collection: 'orders',
                    action: 'update.validated',
                    actor: after.editedBy,
                },
            }
        }
    }

    return notificationsModel
}

//Handlers
async function handleNotification(receivers, payload) {
    const { tokens, notification } = payload
    await sendMulticast(tokens, notification)
    await persistNotification(receivers, notification)
}

async function persistNotification(receivers, payload) {
    const { title, body, channelId, data } = payload
    const notification = {
        title,
        body,
        channelId,
        sentAt: Date.now(),
        read: false,
        deleted: false,
        navigation: data
    }

    for (const receiver of receivers) {
        const collection = receiver.role === 'Client' ? 'Clients' : 'Users'
        await db.collection(collection).doc(receiver.id).collection('Notifications').doc().set(notification)
    }
}

module.exports = { initReceivers, notificationSetting, getFcmTokens, sendMulticast, handleNotification }