

const functions = require('firebase-functions')
const admin = require('firebase-admin')
const { handleUserDenormalization } = require('../../utils/db')

function setUpdatesDatas(userId) {
    const updatesDatas = [
        //Agenda
        { query: { collection: 'Agenda', field: 'assignedTo.id', operation: '==', value: userId }, updatePath: 'assignedTo', updateType: 'object' },
        { query: { collection: 'Agenda', field: 'createdBy.id', operation: '==', value: userId }, updatePath: 'createdBy', updateType: 'object' },
        { query: { collection: 'Agenda', field: 'editedBy.id', operation: '==', value: userId }, updatePath: 'editedBy', updateType: 'object' },
        //Chats > Messages
        { query: { collection: 'Chats', field: 'user.id', operation: '==', value: userId }, updatePath: 'user', updateType: 'object' },
        { query: { collection: 'ChatMessages', isCollectionGroup: true, field: 'user.id', operation: '==', value: userId }, updatePath: 'user', updateType: 'object' },
        // //Documents
        { query: { collection: 'Documents', field: 'createdBy.id', operation: '==', value: userId }, updatePath: 'createdBy', updateType: 'object' },
        { query: { collection: 'Documents', field: 'editedBy.id', operation: '==', value: userId }, updatePath: 'editedBy', updateType: 'object' },
        { query: { collection: 'Documents', field: 'sign_proofs_data.signedBy.id', operation: '==', value: userId }, updatePath: 'sign_proofs_data.signedBy', updateType: 'object' },
        { query: { collection: 'AttachmentHistory', isCollectionGroup: true, field: 'sign_proofs_data.signedBy.id', operation: '==', value: userId }, updatePath: 'sign_proofs_data.signedBy', updateType: 'object' },
        //Messages
        { query: { collection: 'Messages', field: 'sender.id', operation: '==', value: userId }, updatePath: 'sender', updateType: 'object' },
        { query: { collection: 'Messages', field: 'receiversIds', operation: 'array-contains', value: userId }, updatePath: 'receivers', updateType: 'array.object' },
        { query: { collection: 'Messages', field: 'speakersIds', operation: 'array-contains', value: userId }, updatePath: 'speakers', updateType: 'array.object' },
        // { query: { collection: 'AllMessages', isCollectionGroup: true, field: 'oldMessages.sender.id', operation: '==', value: userId }, updatePath: 'oldMessages.sender', updateType: 'array.object' },
        { query: { collection: 'AllMessages', isCollectionGroup: true, field: 'sender.id', operation: '==', value: userId }, updatePath: 'sender', updateType: 'object' },
        { query: { collection: 'AllMessages', isCollectionGroup: true, field: 'receiversIds', operation: 'array-contains', value: userId }, updatePath: 'receivers', updateType: 'array.object' },
        { query: { collection: 'AllMessages', isCollectionGroup: true, field: 'speakersIds', operation: 'array-contains', value: userId }, updatePath: 'speakers', updateType: 'array.object' },
        //Orders
        { query: { collection: 'Orders', field: 'createdBy.id', operation: '==', value: userId }, updatePath: 'createdBy', updateType: 'object' },
        { query: { collection: 'Orders', field: 'editedBy.id', operation: '==', value: userId }, updatePath: 'editedBy', updateType: 'object' },
        //Products
        { query: { collection: 'Products', field: 'createdBy.id', operation: '==', value: userId }, updatePath: 'createdBy', updateType: 'object' },
        { query: { collection: 'Products', field: 'editedBy.id', operation: '==', value: userId }, updatePath: 'editedBy', updateType: 'object' },
        //Projects
        { query: { collection: 'Projects', field: 'createdBy.id', operation: '==', value: userId }, updatePath: 'createdBy', updateType: 'object' },
        { query: { collection: 'Projects', field: 'editedBy.id', operation: '==', value: userId }, updatePath: 'editedBy', updateType: 'object' },
        { query: { collection: 'Projects', field: 'comContact.id', operation: '==', value: userId }, updatePath: 'comContact', updateType: 'object' },
        { query: { collection: 'Projects', field: 'techContact.id', operation: '==', value: userId }, updatePath: 'techContact', updateType: 'object' },
        { query: { collection: 'Projects', field: 'bill.closedBy.id', operation: '==', value: userId }, updatePath: 'bill.closedBy', updateType: 'object' },
        //Requests (can be created by user or client)
        { query: { collection: 'Requests', field: 'createdBy.id', operation: '==', value: userId }, updatePath: 'createdBy', updateType: 'object' },
        { query: { collection: 'Requests', field: 'editedBy.id', operation: '==', value: userId }, updatePath: 'editedBy', updateType: 'object' },
        //Teams
        { query: { collection: 'Teams', field: 'createdBy.id', operation: '==', value: userId }, updatePath: 'createdBy', updateType: 'object' },
        { query: { collection: 'Teams', field: 'editedBy.id', operation: '==', value: userId }, updatePath: 'editedBy', updateType: 'object' },
    ]
    return updatesDatas
}

exports.onUpdateUser = functions.firestore
    .document('Users/{userId}')
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



















