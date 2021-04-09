
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
        const userData = snap.data()

        var displayName = userData.isPro ? userData.denom : `${userData.prenom} ${userData.nom}`
        const { role, email, password, isPro, denom, siret, nom, prenom, address, phone } = userData

        //Create auth account
        const authUser = await admin.auth().createUser({
            uid: userId,
            disabled: false,
            displayName,
            email,
            password,
        })

        //Format user data
        let user = {
            fullName: displayName,
            address,
            phone,
            email,
            role,
            isPro,
            hasTeam: false,
            deleted: false
        }

        if (userData.isPro) {
            user.denom = denom
            user.siret = siret
        }

        else {
            user.nom = nom
            user.prenom = prenom
        }

        //Create User/Client document 
        if (userData.userType === 'utilisateur') {
            await db.collection('Users').doc(authUser.uid).set(user)
        }

        else if (userData.userType === 'client') {
            user.isProspect = false
            await db.collection('Clients').doc(authUser.uid).set(user)
        }

        //Set role claim
        let claim = setRoleCustomClaim(role)
        await admin.auth().setCustomUserClaims(authUser.uid, claim)

        //Delete the temp document
        await db.collection('newUsers').doc(userId).delete()

        //Send Welcome email to the new user
        const subject = 'Bienvenue sur Synergys'
        var welcomeEmail = welcomeEmail(email, password)
        await wrapperSendMail(email, subject, welcomeEmail, [])
        return
    })
