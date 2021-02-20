const functions = require('firebase-functions')
const admin = require('firebase-admin')
const nodemailer = require('nodemailer');
const cors = require('cors')({ origin: true });
const client = require('twilio')(functions.config().twilio.accountsid, functions.config().twilio.authtoken)
const { v4: uuidv4 } = require('uuid');
const emailTemplates = require('./emailTemplates')
const { getPermissions } = require('./permissionsConfig')

admin.initializeApp()

exports.fetchPermissionsConfig = functions.https.onCall((data, context) => {
    const permissions = getPermissions(context.auth.token)
    return permissions
})

exports.addAdminRole = functions.https.onCall((data, context) => {
    if (context.auth.token.admin === true) {
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

exports.setCustomClaim = functions.https.onCall(async (data, context) => {

    let claim = {}

    //Add claim
    switch (data.role) {
        case 'Admin': {
            console.log('Admin')
            claim = { admin: true }
        }
            break;

        case 'Directeur commercial': {
            console.log('Directeur')
            claim = { dircom: true }
        }
            break;

        case 'Commercial': {
            console.log('Commercial')
            claim = { com: true }
        }
            break;

        case 'Responsable technique': {
            console.log('Responsable')
            claim = { tech: true }
        }
            break;

        case 'Poseur': {
            console.log('Poseur')
            claim = { poseur: true }
        }
            break;

        case 'Client': {
            console.log('Client')
            claim = { client: true }
        }
            break;

        default:
            console.log('Something wrong happened...')
    }

    return admin.auth().setCustomUserClaims(data.userId, claim)
        .then(() => {
            return {
                message: 'Role Claim added succesfully'
            }
        }).catch(err => {
            return err
        })
})

exports.createUser = functions.firestore
    .document('newUsers/{userId}')
    .onCreate(async (snap, context) => {
        const { userId } = context.params
        const userData = snap.data()

        var displayName = userData.isPro ? userData.denom : `${userData.prenom} ${userData.nom}`
        const { role, email, password, isPro, denom, siret, nom, prenom, address, phone } = userData

        const newUser = await admin.auth().createUser({
            uid: userId,
            disabled: false,
            displayName,
            email,
            password,
        })

        let user = {
            fullName: displayName,
            address,
            phone,
            email,
            role,
            hasTeam: false,
            isClient: role === 'Client' ? true : false,
            isPro: isPro ? true : false,
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

        await admin.firestore().collection('Users').doc(newUser.uid).set(user)
        let claim = {}

        //Set role claim
        switch (role) {
            case 'Admin':
                claim = { admin: true }
                break;

            case 'Back office':
                claim = { backoffice: true }
                break;

            case 'Directeur commercial':
                claim = { dircom: true }
                break;

            case 'Commercial':
                claim = { com: true }
                break;

            case 'Responsable technique':
                claim = { tech: true }
                break;

            case 'Poseur':
                claim = { poseur: true }
                break;

            case 'Client':
                claim = { client: true }
                break;

            default:
                console.log('Something wrong happened...')
        }

        // Add role claim
        await admin.auth().setCustomUserClaims(newUser.uid, claim)

        // Delete the temp document
        await admin.firestore().collection('newUsers').doc(userId).delete()

        //Send Welcome email to the new user
        const emailBody = `
        Bienvenue sur <strong><span style="color:#046307">Synergys </span>!</strong><br>
        Votre compte vient d'être crée. L'application mobile est disponible sur Google play et sur App store.<br>
        Voici vos identifiants pour vous connecter:<br>
        <strong>Adresse email:</strong> ${email}<br>
        <strong>Mot de passe:</strong> ${password}<br>
        <span style="font-family:helvetica neue,helvetica,arial,verdana,sans-serif">Vous pourrez modifier votre mot de passe via l'interface profil.</span><br>
        <br>
        `
        const title = 'Bienvenue sur Synergys'
        const appLink = `https://synergys.page.link/app`
        var emailTemplate = emailTemplates.template1(emailBody, appLink)
        await sendEmail(email, title, emailTemplate)
        return
    })

//Update firebase auth displayname
exports.onUpdateUser = functions.firestore
    .document('Users/{userId}')
    .onUpdate(async (change, context) => {
        const userId = context.params.userId
        const after = change.after.data()
        const before = change.before.data()
        const nomChanged = before.nom !== after.nom
        const prenomChanged = before.prenom !== after.prenom
        const denomChanged = before.denom !== after.denom
        const noChange = !nomChanged && !prenomChanged && !denomChanged

        if (noChange) return null

        if (!before.isPro && (nomChanged || prenomChanged)) {
            var displayName = after.prenom + ' ' + after.nom
            console.log('displayName particular: ' + displayName)
            const userData = await admin.auth().updateUser(userId, { displayName: displayName })
        }

        else if (denomChanged && before.isPro) {
            var displayName = after.denom
            console.log('displayName pro: ' + displayName)
            const userData = await admin.auth().updateUser(userId, { displayName: displayName })
        }

        //Update user name on all Documents
        await admin.firestore().collection('Documents').where('createdBy.id', '==', userId).get().then((querysnapshot) => {
            querysnapshot.forEach((doc) => {
                const createdBy = doc.data().createdBy
                createdBy.fullName = displayName
                doc.ref.update({ createdBy })
            })
        })

        await admin.firestore().collection('Documents').where('editedBy.id', '==', userId).get().then((querysnapshot) => {
            querysnapshot.forEach((doc) => {
                const editedBy = doc.data().editedBy
                editedBy.fullName = displayName
                doc.ref.update({ editedBy })
            })
        })

        await admin.firestore().collection('Documents').where('signedBy.id', '==', userId).get().then((querysnapshot) => {
            querysnapshot.forEach((doc) => {
                const signedBy = doc.data().signedBy
                signedBy.fullName = displayName
                doc.ref.update({ signedBy })
            })
        })

        await admin.firestore().collectionGroup('Attachments').where('signedBy.id', '==', userId).get().then((querysnapshot) => {
            querysnapshot.forEach((doc) => {
                const signedBy = doc.data().signedBy
                signedBy.fullName = displayName
                doc.ref.update({ signedBy })
            })
        })

        //Update user name on Projects
        await admin.firestore().collection('Projects').where('createdBy.id', '==', userId).get().then((querysnapshot) => {
            querysnapshot.forEach((doc) => {
                const createdBy = doc.data().createdBy
                createdBy.fullName = displayName
                doc.ref.update({ createdBy })
            })
        })

        await admin.firestore().collection('Projects').where('editedBy.id', '==', userId).get().then((querysnapshot) => {
            querysnapshot.forEach((doc) => {
                const editedBy = doc.data().editedBy
                editedBy.fullName = displayName
                doc.ref.update({ editedBy })
            })
        })

        await admin.firestore().collection('Projects').where('client.id', '==', userId).get().then((querysnapshot) => {
            querysnapshot.forEach((doc) => {
                const client = doc.data().client
                client.fullName = displayName
                doc.ref.update({ client })
            })
        })
    })


exports.onUpdateProject = functions.firestore
    .document('Projects/{projectId}')
    .onUpdate(async (change, context) => {
        const projectId = context.params.projectId
        const after = change.after.data()
        const before = change.before.data()
        const nameChanged = before.name !== after.name

        if (!nameChanged) {
            return null;
        }

        console.log(projectId)
        console.log(context.params.projectId)
        //Update user name on Documents
        await admin.firestore().collection('Documents').where('project.id', '==', projectId).get().then((querysnapshot) => {
            querysnapshot.forEach((doc) => {
                const project = doc.data().project
                project.name = after.name
                doc.ref.update({ project })
            })
        })
    })

exports.deleteUserAccount = functions.https.onCall(async (data, context) => {

    const userId = data.userId;
    return admin.auth().deleteUser(userId)
        .then(() => {
            return {
                message: "User's account has been deleted Successfully!"
            }
        }).catch(err => {
            return err;
        })
})

//Project & Ticket Requests Chat: 
exports.onUpdateRequests = functions.firestore
    .document('Requests/{requestId}')
    .onUpdate((change, context) => {
        const after = change.after.data()
        const before = change.before.data();

        let systemMessages = []

        if (before.type === 'ticket' && before.department !== after.department)
            systemMessages.push(`${after.editedBy.userName} a changé le département "${before.department}" en "${after.department}"`)

        if (before.type === 'projet' && before.address.description !== after.address.description)
            systemMessages.push(`${after.editedBy.userName} a changé l'adresse "${before.address.description}" en "${after.address.description}"`)

        // if (before.subject !== after.subject)
        //     systemMessages.push(`${after.editedBy.userName} a changé le sujet "${before.subject}" en "${after.subject}"`)

        // if (before.description !== after.description)
        //     systemMessages.push(`${after.editedBy.userName} a changé la description du ticket.`)

        if (before.clientId !== after.clientId)
            systemMessages.push(`${after.editedBy.userName} a changé le client "${before.clientFullName}" en "${after.clientFullName}"`)

        if (before.state !== after.state)
            systemMessages.push(`${after.editedBy.userName} a changé l'état du ${before.type} "${before.state}" en "${after.state}"`)

        let dbPromises = []

        if (systemMessages.length > 0) {
            for (let i = 0; i < systemMessages.length; i++) {
                const messageId = uuidv4()
                dbPromises.push(
                    admin.firestore().collection('Chats').doc(before.chatId).collection('Messages').add({
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


exports.sendMail = functions.https.onRequest((req, res) => {
    return cors(req, res, () => {

        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: functions.config().nodemailer.sesaccesskey,
                pass: functions.config().nodemailer.sessecretkey
            }
        })

        const mailOptions = {
            to: req.body.data.dest,
            from: functions.config().nodemailer.sesaccesskey,
            subject: req.body.data.subject,
            //text: text,
            html: req.body.data.html
        }

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error.message);
                res.status(200).send({ data: { message: error.toString() } })
            }

            res.status(200).send({ data: { message: "success" } })
        })
    })
})

exports.sendCode = functions.https.onRequest(async (req, res) => {
    await client.verify.services(functions.config().twilio.serviceid)
        .verifications
        .create({ to: req.body.data.phoneNumber, channel: 'sms', locale: 'fr' })
        .then(verification => {
            console.log(verification.status)
            res.status(200).send({ data: { status: verification.status } })
        });
    // .catch((err) => {
    //     console.log(err)
    //     throw new functions.https.HttpsError(
    //         '',
    //         ''
    //     )
    //     res.status(200).send({ data: { error: err } })
    // });
})

exports.verifyCode = functions.https.onRequest(async (req, res) => {
    console.log(req.body)
    await client.verify.services(functions.config().twilio.serviceid)
        .verificationChecks
        .create({ to: req.body.data.phoneNumber, code: req.body.data.code })
        .then(verification_check => {
            console.log(verification_check.status)
            res.status(200).send({ data: { status: verification_check.status } })
        })
        .catch((err) => {
            console.log(err)
            res.status(200).send({ data: { error: err } })
        });
})

//NOTIFICATIONS & EMAILS

//Single user - multiple devices
// exports.onWriteTask = functions.firestore
//     .document('Agenda/{agendaId}/Tasks/{taskId}')
//     .onWrite(async (change, context) => {
//         const { agendaId, taskId } = context.params
//         const before = change.before.exists ? change.before.data() : null
//         const after = change.after.exists ? change.after.data() : null

//         //Send message to all subscribers (except sender)
//         const senderId = change.after.exists ? after.editedBy.id : before.editedBy.id
//         const tokens = getFcmTokens(senderId, subscribers)

//         if (before === null) { //create
//             var title = 'Nouvelle tâche'
//             var body = `${after.editedBy.userName} a crée une nouvelle tâche.`
//         }

//         if (afterv === null) { //delete
//             var title = 'Tâche supprimée'
//             var body = `${after.editedBy.userName} a supprimé la tâche "${after.name}".`
//         }

//         if (before !== after) { //edited
//             var title = 'Tâche modifiée'
//             var body = `${after.editedBy.userName} a modifié la tâche "${after.name}".`
//         }

//         const channelId = 'tasks'
//         const actions = []

//         return sendMulticast(tokens, title, body, channelId, actions)
//             .then((response) => { return { message: 'Successfully sent multicast message' } })
//             .catch((error) => { return { error } })
//     })

exports.onWriteProject = functions.firestore
    .document('Projects/{projectId}')
    .onWrite(async (change, context) => {
        const { projectId } = context.params
        const before = change.before.exists ? change.before.data() : null
        const after = change.after.exists ? change.after.data() : null

        if (!after) return //deleted from db

        const isCreate = !before && after
        const isUpdate = before && after

        if (isUpdate)
            var isArchive = !before.deleted && after.deleted

        const sender = after.editedBy
        const subscribers = after.subscribers
        const receivers = subscribers.map((sub) => sub.email)
        const channelId = 'projects'

        var navigation = {
            screen: 'CreateProject',
            isEdit: 'true',
            title: 'Modifier le projet',
            ProjectId: projectId
        }

        if (isCreate) {
            var tokens = await getFcmTokens(sender.id, subscribers)
            var title = 'Nouveau projet'
            var notificationBody = `${sender.fullName} a crée un nouveau projet.`
            var emailBody = `<span style="font-family:helvetica neue,helvetica,arial,verdana,sans-serif"><strong>${sender.fullName}</strong> vous a invité à collaborer dans le projet<strong> <span style="color:#046307">${after.name}</span></strong></span><br>`
            var appLink = `https://synergys.page.link/?link=https%3A%2F%2Fsynergys.page.link%2Fprojects%2Fproject%2F${projectId}`
        }

        else if (isUpdate) {
            if (isArchive) {
                var tokens = await getFcmTokens(sender.id, subscribers)
                var title = 'Projet archivé'
                var notificationBody = `${sender.fullName} a archivé le projet "${before.name}".`
                var emailBody = `<span style="font-family:helvetica neue,helvetica,arial,verdana,sans-serif"><strong>${sender.fullName}</strong> a archivé le projet<strong> <span style="color:#046307">${after.name}</span></strong></span><br>`
                var appLink = `https://synergys.page.link/?link=https%3A%2F%2Fsynergys.page.link%2Fprojects`

                navigation = { screen: 'ListProjects' }
            }

            else {
                var tokens = await getFcmTokens(sender.id, subscribers)
                var title = 'Projet modifié'
                var notificationBody = `${sender.fullName} a modifié le projet "${before.name}".`
                var emailBody = `<span style="font-family:helvetica neue,helvetica,arial,verdana,sans-serif"><strong>${sender.fullName}</strong> a modifié le projet<strong> <span style="color:#046307">${after.name}</span></strong></span><br>`
                var appLink = `https://synergys.page.link/?link=https%3A%2F%2Fsynergys.page.link%2Fprojects%2Fproject%2F${projectId}`
            }
        }

        var emailTemplate = emailTemplates.template1(emailBody, appLink)
        sendMulticast(tokens, title, notificationBody, channelId, [], navigation)
        sendEmail(receivers, title, emailTemplate)

        //Post notification to "Notifications" collection
        const notification = {
            title: title,
            body: notificationBody,
            sentAt: Date.now(),
            topic: 'projects',
            deleted: false,
            read: false,
            navigation: navigation
        }

        for (const sub of subscribers) {
            await admin.firestore().collection('Users').doc(sub.id).collection('Notifications').doc().set(notification)
        }

    })


async function sendEmail(receivers, title, template) {

    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: functions.config().nodemailer.sesaccesskey,
            pass: functions.config().nodemailer.sessecretkey
        }
    })

    const mailOptions = {
        to: receivers,
        from: functions.config().nodemailer.sesaccesskey,
        subject: title,
        //text: text,
        html: template
    }

    transporter.sendMail(mailOptions, function (error, info) {
        if (error)
            console.log(error.message)

        else
            console.log('email sent')
    })
}

async function sendMulticast(tokens, title, body, channelId, actions = [], navigation) {

    await admin.messaging().sendMulticast({
        tokens,
        // {
        data: {
            notifee: JSON.stringify({
                title: title,
                body: body,
                android: {
                    channelId,
                    // timestamp: Date.now() - 480000, // 8 minutes ago
                    pressAction: {
                        id: 'default',
                    },
                    // actions: actions,
                },
                data: navigation
            })
        }
        //         ,{
        //     contentAvailable: true, //Required for background/quit data-only messages on iOS
        //     priority: 'high', //Required for background/quit data-only messages on Android //ADD APNS ALSO: check fcm documentation
        // }
        // }
    })
        .then(() => console.log('notification sent'))
        .catch((e) => console.error(e))
}

async function getFcmTokens(sender, subscribers) {
    let tokens = []

    for (const sub of subscribers) {
        const tokensDoc = await admin.firestore().collection('FcmTokens').doc(sub.id).get()
        if (tokensDoc && tokensDoc.exists)
            tokens = tokens.concat(tokensDoc.data().tokens)
    }

    return tokens
}








































    // exports.setRoleClaim = functions.https.onCall((data, context) => {

//     return admin.auth().getUserByEmail(data.email).then(user => {
//         return admin.auth().setCustomUserClaims(user.uid, {
//             admin: true
//         });
//     }).then(() => {
//         return {
//             message: 'Admin has been added Successfuly!'
//         }
//     }).catch(err => {
//         return err;
//     });
// });

// exports.setCustomUid = functions.https.onCall((data, context) => {
//     // if (context.auth.token.admin !== true)
//     //     return { error: 'Only admins can add other admins, sucker' }

//     return admin.auth().getUserByEmail(data.email).then(user => {
//         console.log(user.uid)
//         return admin.auth().setCustomUserClaims(user.uid, {
//             synuid: data.synuid
//         })
//     }).then(() => {
//         return {
//             message: 'Custom UID has been set Successfuly!'
//         }
//     }).catch(err => { return err })
// })

// exports.setAdminClaims = functions.https.onCall((data, context) => {
//     // if (context.auth.token.admin !== true)
//     //     return { error: 'Only admins can add other admins, sucker' }

//     //task: Do more verification

//     return admin.auth().getUserByEmail(data.email).then(user => {
//         console.log(user.uid)
//         return admin.auth().setCustomUserClaims(user.uid, {
//             admin: true,
//             synuid: data.synuid
//         })
//     }).then(() => {
//         return {
//             message: 'Admin role & Custom UID has been set Successfuly!'
//         }
//     }).catch(err => { return err })
// })