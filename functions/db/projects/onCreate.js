
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const { setRoleCustomClaim } = require('../../utils/db')
const { wrapperSendMail } = require('../../utils/emails')
const { welcomeEmail } = require('../../emails/templates')
const db = admin.firestore()

exports.onCreateProject = functions.firestore
    .document('Projects/{projectId}')
    .onCreate(async (snap, context) => {
        const { projectId } = context.params
        const project = snap.data()

        const querySnapshot = await db.collection('Projects').where("client.id", "==", project.client.id).get()
        if (querySnapshot.docs.length > 1) return

        //Create new client on 1st project
        const doc = await db.collection('Clients').doc(project.client.id).get()
        let client = doc.data()
        const isProspect = false
        const role = "Client"
        client.isProspect = isProspect
        client.role = role

        //Update Client role/isProspect + Trigger user account creation
        await doc.ref.update({ isProspect, role })
        await db.collection('newUsers').doc(doc.id).set(client, { merge: true })
    })

