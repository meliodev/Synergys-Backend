const functions = require('firebase-functions')
const admin = require('firebase-admin')

exports.onDeleteUser = functions.firestore
    .document('Users/{userId}')
    .onDelete(async (snapshot, context) => {
        const uid = snapshot.id
        return admin.auth().deleteUser(uid)
    })