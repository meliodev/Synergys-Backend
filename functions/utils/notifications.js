
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

async function sendMulticast(tokens, title, body, channelId, actions = [], data) {

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

async function notificationSetting(collection, receivers, event, docId, before, after) {

    let tokens = await getFcmTokens(receivers)
    const notification = setNotification(collection, event, docId, before, after) //Subscribers & Client
    if (!notification) return null
    const data = event.trigger === 'onArchive' ? { screen: 'ListProjects' } : { screen: 'CreateProject', ProjectId: docId } //Navigation
    const channelId = collection

    const payload = { tokens, notification, data, channelId }
    return payload
}

function setNotification(collection, event, docId, before, after) {
    const { trigger, field } = event
    let notification = null

    const model = getNotificationsModel(collection, docId, before, after)

    if (trigger === 'onUpdate' && model[trigger]) {
        notification = model[trigger][field]
    }

    else notification = model[trigger]

    return notification
}

//Specific
function getNotificationsModel(collection, docId, before, after) {

    let notificationsModel = null

    if (collection === 'projects') {

        const { state, step, address } = after
        const currentAction = getCurrentAction(after.process)
        let responsableRole = currentAction && currentAction.responsable || ''

        notificationsModel = {
            onCreate: {
                title: 'Nouveau projet',
                body: `Le projet ${after.name} (${docId}) a été crée`  //ْreceivers: all
            },
            onArchive: {
                title: 'Projet archivé',
                body: `Le projet ${docId} a été archivé`  //ْreceivers: all
            },
            onUpdate: {
                state: {
                    title: 'Suivi de projet',
                    body: `Le projet ${docId} est ${state} `  //ْreceivers: all
                },
                step: {
                    title: 'Suivi de projet',
                    body: `Le projet ${docId} est en phase ${step} `  //ْreceivers: all
                },
                address: {
                    title: 'Suivi de projet',
                    body: `L'adresse du projet ${docId} a été modifiée`  //ْreceivers: all
                },
                subscribers: {
                    title: 'Suivi de projet',
                    body: `Vous avez été invité a collaborer dans le projet ${docId}` //ْreceivers: newSubscriber
                },
                process: {
                    title: `Action à faire`,
                    body: `${getResponsable(after.subscribers, responsableRole)} a une action à faire.`, //#task: this returns undefined
                }
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

    return notificationsModel
}

//Handlers
async function handleNotification(receivers, client, payload) {

    const { tokens, notification, data, channelId } = payload
    const { title, body } = notification

    if (tokens.length > 0 && notification) {
        await sendMulticast(tokens, title, body, channelId, [], data)
        await persistNotification(receivers, title, channelId, body, data)
    }
}

async function persistNotification(receivers, title, body, channelId, data) {

    let collection = 'Users'

    const notification = {
        title,
        body,
        sentAt: Date.now(),
        channelId,
        read: false,
        deleted: false,
        navigation: data
    }

    for (const receiver of receivers) {
        collection = receiver.role === 'Client' ? 'Clients' : 'Users'
        await db.collection(collection).doc(receiver.id).collection('Notifications').doc().set(notification)
    }
}

module.exports = { initReceivers, notificationSetting, getFcmTokens, sendMulticast, handleNotification }