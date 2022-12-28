
const admin = require('firebase-admin')
const functions = require('firebase-functions')

exports.addAdminRole = functions.https.onCall((data, context) => {
    if (context.auth.token.admin) {
        return { error: 'Only admins can add other admins, sucker' }
    }

    return admin.auth().getUserByEmail(data.email).then(user => {
        return admin.auth().setCustomUserClaims(user.uid, {
            admin: true
        })
    }).then(() => {
        return {
            message: 'Admin has been added Successfuly!'
        }
    }).catch(err => {
        return err;
    })
})
