
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const { setRoleCustomClaim } = require('../../utils/db')
const { wrapperSendMail } = require('../../utils/emails')
const { welcomeEmail } = require('../../emails/templates')
const db = admin.firestore()

exports.onCreateUser = functions.firestore
    .document('newUsers/{userId}')
    .onCreate(async (snap, context) => {
        const { userId } = context.params
        const user = snap.data()

        const { role, email, password, isPro, denom, nom, prenom } = user
        var displayName = isPro ? denom : `${prenom} ${nom}`

        //1. Create auth account
        const account = {
            uid: userId,
            disabled: false,
            displayName,
            email,
            password,
        }
        const authUser = await admin.auth().createUser(account)

        //2. Set role claim
        let claim = setRoleCustomClaim(role)
        await admin.auth().setCustomUserClaims(userId, claim)

        //3. Delete the temp document
        await db.collection('newUsers').doc(userId).delete()

        //4. Send Welcome email to the new user
        const subject = 'Bienvenue sur Synergys'
        var welcomeMail = welcomeEmail(email, password)
        await wrapperSendMail(email, subject, welcomeMail, [])
        return
    })

