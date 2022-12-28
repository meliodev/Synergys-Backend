
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const { v4: uuidv4 } = require('uuid');
const db = admin.firestore()

function setChatSystemMessages(before, after) {
    let systemMessages = []

    if (before.type === 'ticket' && before.department !== after.department)
        systemMessages.push(`${after.editedBy.fullName} a changé le département "${before.department}" en "${after.department}"`)

    if (before.type === 'projet' && before.address.description !== after.address.description)
        systemMessages.push(`${after.editedBy.fullName} a changé l'adresse "${before.address.description}" en "${after.address.description}"`)

    if (before.clientId !== after.clientId)
        systemMessages.push(`${after.editedBy.fullName} a changé le client "${before.clientFullName}" en "${after.clientFullName}"`)

    if (before.state !== after.state)
        systemMessages.push(`${after.editedBy.fullName} a changé l'état du ${before.type} "${before.state}" en "${after.state}"`)

    return systemMessages
}

exports.onUpdateRequests = functions.firestore
    .document('Requests/{requestId}')
    .onUpdate((change, context) => {
        const after = change.after.data()
        const before = change.before.data();

        let systemMessages = setChatSystemMessages(before, after)
        let dbPromises = []

        if (systemMessages.length > 0) {
            for (let i = 0; i < systemMessages.length; i++) {
                const messageId = uuidv4()
                dbPromises.push(
                    db.collection('Chats').doc(before.chatId).collection('ChatMessages').add({
                        _id: messageId,
                        text: systemMessages[i],
                        createdAt: new Date().getTime(),
                        system: true
                    })
                )
            }

            return Promise.all(dbPromises)
                .then(() => console.log('System message added'))
                .catch(e => { console.error(e) })
        }

        else return console.log('No breaking changes')
    })