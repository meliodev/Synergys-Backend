
const admin = require('firebase-admin')
const functions = require('firebase-functions')
const { setRoleCustomClaim } = require('../utils/db')

exports.setCustomClaim = functions.https.onCall(async (data, context) => {

    let claim = setRoleCustomClaim(data.role)

    return admin.auth().setCustomUserClaims(data.userId, claim)
        .then(() => {
            return {
                message: 'Role Claim added succesfully'
            }
        }).catch(err => {
            return err
        })
})