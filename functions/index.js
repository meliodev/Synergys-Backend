
const functions = require('firebase-functions')

const admin = require('firebase-admin')
admin.initializeApp()

const { addAdminRole } = require('./auth/addAdminRole')
const { setCustomClaim } = require('./auth/setCustomClaim')

const { onWriteProcess } = require('./db/process/onWrite') //#toTest = 1
const { onCreateProject } = require('./db/projects/onCreate') //#toTest = 1
const { onWriteProject } = require('./db/projects/onWrite') //#toTest = 1
const { onUpdateProject } = require('./db/projects/onUpdate') //#tested (#task: Define useful notifications to avoid spam)
const { onCreateRequest } = require('./db/requests/onCreate') //#tested
const { onUpdateRequests } = require('./db/requests/onUpdate') //#tested
const { onCreateUser } = require('./db/users/onCreate') //#tested 
const { onUpdateUser } = require('./db/users/onUpdate') //#tested
const { onDeleteUser } = require('./db/users/onDelete') //#deprecated 
const { onUpdateClient } = require('./db/clients/onUpdate') //#tested
const { onWriteAgenda } = require('./db/agenda/onWrite') //#toTest 
const { onWriteOrder } = require('./db/orders/onWrite') //#toTest 
const { onCreateAllMessages } = require('./db/AllMessages/onCreate') //#toTest 
const { sendEmail } = require('./nodeMailer/sendEmail') //#toTest 
const { sendCode } = require('./twilio/sendCode') //#toTest 
const { verifyCode, test } = require('./twilio/verifyCode') //#toTest 



exports.test = test

//Auth
exports.addAdminRole = addAdminRole
exports.setCustomClaim = setCustomClaim

//Triggers
exports.onWriteProcess = onWriteProcess
exports.onCreateProject = onCreateProject
exports.onWriteProject = onWriteProject
exports.onUpdateProject = onUpdateProject
exports.onCreateRequest = onCreateRequest
exports.onUpdateRequests = onUpdateRequests
exports.onCreateUser = onCreateUser
exports.onUpdateUser = onUpdateUser
exports.onDeleteUser = onDeleteUser
exports.onUpdateClient = onUpdateClient
exports.onWriteAgenda = onWriteAgenda
exports.onWriteOrder = onWriteOrder
exports.onCreateAllMessages = onCreateAllMessages

//Nodemailer
exports.sendEmail = sendEmail

//Twilio
exports.sendCode = sendCode
exports.verifyCode = verifyCode

// exports.helloEmulator = functions.https.onRequest(async (request, response) => {
//     const userId = request.query.userId
//     if (userId) {

//         const snapshot = await admin.firestore().collection('Users').limit(1).get()

//         let data = null
//         snapshot.forEach((doc) => {
//             data = doc.data()
//         })

//         response.send(`${data.name}`)
//     }
//     else response.send(`No user found`)
// })










