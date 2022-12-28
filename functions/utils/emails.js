const functions = require('firebase-functions')
const nodemailer = require('nodemailer');
const { template1 } = require('../emails/templates')
const { getCurrentAction, getResponsable } = require('./process')

//Node mailer method
async function wrapperSendMail(receivers, subject, html, attachments) {

    return new Promise((resolve, reject) => {

        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: functions.config().nodemailer.sesaccesskey,
                pass: functions.config().nodemailer.sessecretkey
            }
        })

        const mailOptions = {
            to: receivers,
            from: functions.config().nodemailer.sesaccesskey, //#task: change it to groupe-synergys
            subject,
            html,
            attachments
        }

        let resp = false

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log("error is " + error);
                console.log('RECEIVERS', receivers)
                resolve(false); // or use rejcet(false) but then you will have to handle errors
            }
            else {
                console.log('Email sent: ' + info.response);
                console.log('RECEIVERS', receivers)
                resolve(true);
            }
        })
    })

}

//Generic
function emailSetting(collection, receivers, event, docId, before, after, appLinkParams) {
    receivers = receivers.map((receiver) => receiver.email)
    const email = setEmail(collection, event, docId, before, after, appLinkParams)
    if (!email) return null
    const payload = { receivers, email }
    return payload
}

function setEmail(collection, event, docId, before, after, appLinkParams) {
    const { trigger, field } = event
    // const currentAction = getCurrentAction(after.process)
    // let responsableRole = currentAction && currentAction.responsable || ''
    const model = getEmailsModel(collection, docId, before, after, appLinkParams)
    const isHandledUpdate = trigger === 'onUpdate' && model[trigger]
    const emailElements = isHandledUpdate ? model[trigger][field] : model[trigger]
    if (!emailElements) return null
    const { subject, body, appLink } = emailElements
    var html = template1(body, appLink)
    const email = { subject, html }
    return email
}

//Specific
function getEmailsModel(collection, docId, before, after, appLinkParams) {

    let notificationsModel = null

    if (collection === 'projects') {
        const { name, state, step, address } = after
        // const currentAction = getCurrentAction(after.process)
        // let responsableRole = currentAction && currentAction.responsable || ''
        const { ListScreen, CreateScreen, DocumentId } = appLinkParams
        const appLinkRoot = `https://synergys.page.link/?link=https%3A%2F%2Fsynergys.page.link%2Fapp`
        const appLink1 = `${appLinkRoot}%3FrouteName%3D${ListScreen}`
        const appLink2 = `${appLinkRoot}%3FrouteName%3D${CreateScreen}&&${DocumentId}%3D${docId}`

        notificationsModel = {
            onCreate: {
                subject: `Le projet ${name} (${docId}) a été crée`,
                body: `Le projet ${name} (${docId}) a été crée`,  //ْreceivers: all
                appLink: appLink2
            },
            onArchive: {
                subject: `Le projet ${name} (${docId}) a été archivé`,
                body: `Le projet ${name} (${docId}) a été archivé`,  //ْreceivers: all
                appLink: appLink1
            },
            onUpdate: {
                state: {
                    subject: `Le projet ${name} (${docId}) a été mis à jour`,
                    body: `Le projet ${docId} est ${state}`,  //ْreceivers: all
                    appLink: appLink2
                },
                step: {
                    subject: `Le projet ${name} (${docId}) a été mis à jour`,
                    body: `Le projet ${name} (${docId}) est en phase ${step}`,  //ْreceivers: all
                    appLink: appLink2
                },
                address: {
                    subject: `Le projet ${name} (${docId}) a été mis à jour`,
                    body: `L'adresse du projet ${name} (${docId}) a été modifiée`,  //ْreceivers: all
                    appLink: appLink2
                },
                comContact: {
                    subject: `Le projet ${name} (${docId}) a été mis à jour`,
                    body: `Vous avez été invité a collaborer dans le projet ${name} (${docId})`, //ْreceivers: new comContact
                    appLink: appLink2
                },
                techContact: {
                    subject: `Le projet ${name} (${docId}) a été mis à jour`,
                    body: `Vous avez été invité a collaborer dans le projet ${name} (${docId})`, //ْreceivers: new techContact
                    appLink: appLink2
                },
                // process: {
                //     subject: `Action à faire`,
                //     body: `${getResponsable(after.subscribers, responsableRole).fullName} a une action à faire.`,
                //     appLink: appLink2
                // }
            }
        }
    }

    else if (collection === 'agenda') {
        const { name, assignedTo } = after
        notificationsModel = {
            onCreate: {
                subject: `La tâche ${name} a été assignée à ${assignedTo.fullName}`,
                body: `La tâche ${name} a été assignée à ${assignedTo.fullName}`,  //ْreceivers: all
                appLink: appLink2
            }
        }
    }

    return notificationsModel
}

//Handler
async function handleEmail(payload) {
    const { receivers, email } = payload
    const { subject, html } = email
    await wrapperSendMail(receivers, subject, html, [])
}


module.exports = { wrapperSendMail, emailSetting, handleEmail }
