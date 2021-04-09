

const functions = require('firebase-functions')
const admin = require('firebase-admin')
const { updateUserFullNameOnAllDocs, getRoleValue } = require('../../utils/db')

function setUpdatesDatas(userId) {
    const updatesDatas = [
        //Agenda
        { query: { collection: 'Agenda', field: 'assignedTo.id', operation: '==', value: userId }, updatePath: 'assignedTo.fullName', fieldType: 'string' },
        { query: { collection: 'Agenda', field: 'createdBy.id', operation: '==', value: userId }, updatePath: 'createdBy.fullName', fieldType: 'string' },
        { query: { collection: 'Agenda', field: 'editedBy.id', operation: '==', value: userId }, updatePath: 'editedBy.fullName', fieldType: 'string' },
        { query: { collection: 'Agenda', field: 'project.subscribers', operation: 'array-contains', value: userObject }, updatePath: 'project.subscribers', fieldType: 'array' },
        //Chats > Messages
        { query: { collection: 'Chats', field: 'user._id', operation: '==', value: userId }, updatePath: 'user.name', fieldType: 'string' },
        { query: { collection: 'ChatMessages', isCollectionGroup: true, field: 'user._id', operation: '==', value: userId }, updatePath: 'user.name', fieldType: 'string' },
        //Documents
        { query: { collection: 'Documents', field: 'createdBy.id', operation: '==', value: userId }, updatePath: 'createdBy.fullName', fieldType: 'string' },
        { query: { collection: 'Documents', field: 'editedBy.id', operation: '==', value: userId }, updatePath: 'editedBy.fullName', fieldType: 'string' },
        { query: { collection: 'Documents', field: 'project.subscribers', operation: 'array-contains', value: userObject }, updatePath: 'project.subscribers', fieldType: 'array' },
        //Messages
        { query: { collection: 'Messages', field: 'sender', operation: '==', value: userId }, updatePath: 'sender.fullName', fieldType: 'string' },
        { query: { collection: 'Messages', field: 'receivers', operation: 'array-contains', value: userObject }, updatePath: 'receivers', fieldType: 'array' },
        { query: { collection: 'AllMessages', isCollectionGroup: true, field: 'sender', operation: '==', value: userId }, updatePath: 'sender.fullName', fieldType: 'string' },
        { query: { collection: 'AllMessages', isCollectionGroup: true, field: 'receivers', operation: 'array-contains', value: userObject }, updatePath: 'receivers', fieldType: 'array' },
        { query: { collection: 'AllMessages', isCollectionGroup: true, field: 'speakers', operation: 'array-contains', value: userObject }, updatePath: 'speakers', fieldType: 'array' },
        //Orders
        { query: { collection: 'Orders', field: 'createdBy.id', operation: '==', value: userId }, updatePath: 'createdBy.fullName', fieldType: 'string' },
        { query: { collection: 'Orders', field: 'editedBy.id', operation: '==', value: userId }, updatePath: 'editedBy.fullName', fieldType: 'string' },
        { query: { collection: 'Orders', field: 'project.subscribers', operation: 'array-contains', value: userObject }, updatePath: 'project.subscribers', fieldType: 'array' },
        //Products
        { query: { collection: 'Products', field: 'createdBy.id', operation: '==', value: userId }, updatePath: 'createdBy.fullName', fieldType: 'string' },
        { query: { collection: 'Products', field: 'editedBy.id', operation: '==', value: userId }, updatePath: 'editedBy.fullName', fieldType: 'string' },
        //Projects
        { query: { collection: 'Projects', field: 'createdBy.id', operation: '==', value: userId }, updatePath: 'createdBy.fullName', fieldType: 'string' },
        { query: { collection: 'Projects', field: 'editedBy.id', operation: '==', value: userId }, updatePath: 'editedBy.fullName', fieldType: 'string' },
        { query: { collection: 'Documents', field: 'subscribers', operation: 'array-contains', value: userObject }, updatePath: 'subscribers', fieldType: 'array' },
        //Requests
        { query: { collection: 'Requests', field: 'createdBy.id', operation: '==', value: userId }, updatePath: 'createdBy.fullName', fieldType: 'string' },
        { query: { collection: 'Requests', field: 'editedBy.id', operation: '==', value: userId }, updatePath: 'editedBy.fullName', fieldType: 'string' },
        //Teams
        { query: { collection: 'Teams', field: 'createdBy.id', operation: '==', value: userId }, updatePath: 'createdBy.fullName', fieldType: 'string' },
        { query: { collection: 'Teams', field: 'editedBy.id', operation: '==', value: userId }, updatePath: 'editedBy.fullName', fieldType: 'string' },
    ]

    return updatesDatas
}


exports.onUpdateUser = functions.firestore
    .document('Users/{userId}')
    .onUpdate(async (change, context) => {

        const { userId } = context.params
        const after = change.after.data()
        const before = change.before.data()
        const nomChanged = before.nom !== after.nom
        const prenomChanged = before.prenom !== after.prenom
        const denomChanged = before.denom !== after.denom
        const noChange = !nomChanged && !prenomChanged && !denomChanged

        if (noChange) return null

        //1. UPDATE AUTH DISPLAYNAME
        var displayName = before.isPro ? after.denom : `${after.prenom} ${after.nom}`
        const user = await admin.auth().updateUser(userId, { displayName })

        //2. UPDATE FULLNAME FIELD ON ALL DOCUMENTS OF ALL COLLECTIONS CONTAINING THIS USER.
        const email = user.email
        const previousFullName = before.isPro ? `${before.denom}` : `${before.prenom} ${before.nom}`
        const roleId = Object.keys(user.customClaims)[0]
        const role = getRoleValue(roleId)

        const userObject = {
            id: userId,
            fullName: previousFullName,
            email,
            role
        }

        const updatesDatas = setUpdatesDatas(userId)

        const response = await updateUserFullNameOnAllDocs(updatesDatas, displayName)
        console.log('RESPONSE', response)

        return response
    })