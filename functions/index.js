
const admin = require('firebase-admin')
admin.initializeApp()

const { addAdminRole } = require('./auth/addAdminRole')
const { setCustomClaim } = require('./auth/setCustomClaim')
const { onWriteProject } = require('./db/projects/onWrite')
const { onUpdateRequests } = require('./db/requests/onUpdate')
const { onCreateUser } = require('./db/users/onCreate')
const { onUpdateUser } = require('./db/users/onUpdate')
const { onDeleteUser } = require('./db/users/onDelete')
const { onWriteAgenda } = require('./db/agenda/onWrite')
const { sendEmail } = require('./nodeMailer/sendEmail')
const { sendCode } = require('./twilio/sendCode')
const { verifyCode } = require('./twilio/verifyCode')

//Auth
exports.addAdminRole = addAdminRole
exports.setCustomClaim = setCustomClaim

//Triggers
exports.onWriteProject = onWriteProject
exports.onUpdateRequests = onUpdateRequests
exports.onCreateUser = onCreateUser
exports.onUpdateUser = onUpdateUser
exports.onDeleteUser = onDeleteUser
exports.onWriteAgenda = onWriteAgenda

//Nodemailer
exports.sendEmail = sendEmail

//Twilio
exports.sendCode = sendCode
exports.verifyCode = verifyCode
