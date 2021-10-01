

const functions = require('firebase-functions')
const admin = require('firebase-admin')
const { handleUserDenormalization } = require('../../utils/db')

function setUpdatesDatas(clientId) {
    const updatesDatas = [ 
        //Documents
        { query: { collection: 'Documents', field: 'createdBy.id', operation: '==', value: clientId }, updatePath: 'createdBy', updateType: 'object' },
        { query: { collection: 'Documents', field: 'editedBy.id', operation: '==', value: clientId }, updatePath: 'editedBy', updateType: 'object' },
        { query: { collection: 'Documents', field: 'sign_proofs_data.signedBy.id', operation: '==', value: clientId }, updatePath: 'sign_proofs_data.signedBy', updateType: 'object' },
        { query: { collection: 'AttachmentHistory', isCollectionGroup: true, field: 'sign_proofs_data.signedBy.id', operation: '==', value: clientId }, updatePath: 'sign_proofs_data.signedBy', updateType: 'object' },
        //Messages
        { query: { collection: 'Messages', field: 'sender.id', operation: '==', value: clientId }, updatePath: 'sender', updateType: 'object' },
        { query: { collection: 'Messages', field: 'receiversIds', operation: 'array-contains', value: clientId }, updatePath: 'receivers', updateType: 'array.object' },
        { query: { collection: 'Messages', field: 'speakersIds', operation: 'array-contains', value: clientId }, updatePath: 'speakers', updateType: 'array.object' },
        // { query: { collection: 'AllMessages', isCollectionGroup: true, field: 'oldMessages.sender.id', operation: '==', value: clientId }, updatePath: 'oldMessages.sender', updateType: 'array.object' },
        { query: { collection: 'AllMessages', isCollectionGroup: true, field: 'sender.id', operation: '==', value: clientId }, updatePath: 'sender', updateType: 'object' },
        { query: { collection: 'AllMessages', isCollectionGroup: true, field: 'receiversIds', operation: 'array-contains', value: clientId }, updatePath: 'receivers', updateType: 'array.object' },
        { query: { collection: 'AllMessages', isCollectionGroup: true, field: 'speakersIds', operation: 'array-contains', value: clientId }, updatePath: 'speakers', updateType: 'array.object' },
        //Projects
        { query: { collection: 'Projects', field: 'client.id', operation: '==', value: clientId }, updatePath: 'client', updateType: 'object' },
        //Requests
        { query: { collection: 'Requests', field: 'createdBy.id', operation: '==', value: clientId }, updatePath: 'createdBy', updateType: 'object' },
        { query: { collection: 'Requests', field: 'editedBy.id', operation: '==', value: clientId }, updatePath: 'editedBy', updateType: 'object' },
        //Chats > Messages
        { query: { collection: 'Chats', field: 'user.id', operation: '==', value: clientId }, updatePath: 'user', updateType: 'object' },
        { query: { collection: 'ChatMessages', isCollectionGroup: true, field: 'user.id', operation: '==', value: clientId }, updatePath: 'user', updateType: 'object' },
    ]
    return updatesDatas
}

exports.onUpdateClient = functions.firestore
    .document('Clients/{userId}')
    .onUpdate(async (change, context) => {
        const { userId } = context.params
        const after = change.after.data()
        const before = change.before.data()
        const userDeleted = !before.deleted && after.deleted
        if (userDeleted) {
            return admin.auth().deleteUser(userId)
        }
        await handleUserDenormalization(userId, before, after, setUpdatesDatas)
        return
    })