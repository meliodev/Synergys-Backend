
const admin = require('firebase-admin')
const db = admin.firestore()
const { roles } = require('../constants')
var moment = require('moment')
const _ = require('lodash')

async function denormalizationUpdateHandler(updatesConfig, newValue) {

    const batch = admin.firestore().batch()

    for (const updateConfig of updatesConfig) {
        const query = setQuery(updateConfig.query)
        await query.get().then(async (querysnapshot) => {
            if (!querysnapshot.empty)
                for (const doc of querysnapshot.docs) {
                    console.log('DOC ID::::', doc.id)
                    const update = setUpdate(doc.data(), updateConfig, newValue)
                    batch.update(doc.ref, update)
                }
        })
    }

    await batch.commit()
        .then(() => console.log('BATCH SUCCEEDED !'))
        .catch((e) => console.error(e))
}

function setQuery(queryParams) {
    const { collection, isCollectionGroup, field, operation, value } = queryParams
    let query
    if (isCollectionGroup) query = db.collectionGroup(collection)
    else query = db.collection(collection)
    query = query.where(field, operation, value)
    return query
}

function setUpdate(data, updateConfig, newValue) {

    const { updatePath, updateType } = updateConfig
    const updatePathArray = updatePath.split('.')
    const nestedData = updatePathArray.reduce((a, prop) => a[prop], data) // data[prop1][prop2]
    const { value } = updateConfig.query

    let update = {}

    if (updateType === 'array.object') {
        for (var i in nestedData) {
            if (nestedData[i].id === value)
                nestedData[i] = newValue
        }
        update[updatePath] = nestedData
    }

    else if (updateType === "object.object") {
        update = data
        _.set(update, updatePath, newValue)
    }

    else {
        console.log('FIELD OBJECT::::::::::::::', updateConfig.query.field)
        update[updatePath] = newValue
        console.log(update)
    }

    return update
}

function getRoleValue(roleId) {
    for (const roleObject of roles) {
        if (roleObject.id === roleId)
            return roleObject.value
    }
}

function setRoleCustomClaim(role) {
    let claim = {}

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

    return claim
}

async function handleUserDenormalization(userId, before, after, setUpdatesDatas) {
    const fullNameChanged = before.fullName !== after.fullName
    const emailChanged = before.email !== after.email
    const roleChanged = before.role !== after.role
    const phoneChanged = before.phone !== after.phone
    const handleDenormalization = fullNameChanged || emailChanged || roleChanged || phoneChanged

    if (handleDenormalization) {

        //UPDATE AUTH DISPLAYNAME
        if (fullNameChanged) {
            var displayName = after.fullName
            const user = await admin.auth().updateUser(userId, { displayName })
        }

        const { fullName, email, role, phone } = after
        const userObjectAfter = {
            id: userId,
            fullName,
            email,
            role,
            phone
        }

        console.log(userObjectAfter)

        const updatesDatas = setUpdatesDatas(userId)
        const response = await denormalizationUpdateHandler(updatesDatas, userObjectAfter)
        return response
    }

    return
}

//TRIGGERS HELPERS
function initEvents(before, after) {
    const isCreate = !before && after
    const isUpdate = before !== null && after !== null
    const isArchive = isUpdate && !before.deleted && after.deleted
    const events = { isCreate, isUpdate, isArchive }
    return events
}

function setTriggerAndUpdatedField(events, before, after, onUpdateField) {
    const { isCreate, isUpdate, isArchive } = events
    const trigger = isCreate ? 'onCreate' : isArchive ? 'onArchive' : isUpdate ? 'onUpdate' : ''
    //const field = isUpdate && !isArchive ? onUpdateField(trigger, before, after) : ''
    const field = onUpdateField(trigger, before, after)
    const event = { trigger, field }
    return event
}

async function updateUserTurnover(userId, projectId, billClosedAt, billAfter) {
    const year = moment(billClosedAt).format('YYYY')
    const monthYear = moment(billClosedAt).format('MM-YYYY')
    await db
        .collection('Users')
        .doc(userId)
        .collection('Turnover')
        .doc(year)
        .get()
        .then((doc) => {
            let turnoverData = doc.exists ? doc.data() : {}
            let projectsIncome = turnoverData && turnoverData.projectsIncome || {}
            projectsIncome[projectId] = billAfter
            if (!turnoverData[monthYear]) {
                turnoverData[monthYear] = {}
            }
            turnoverData[monthYear].projectsIncome = projectsIncome
            doc.ref.set(turnoverData, { merge: true })
        })
}

function getUsersByRole(role) {
    return db.collection('Users').where('role', '==', role).get().then((snapshot) => {
        let users = []
        for (const doc of snapshot.docs) {
            const { fullName, email, role } = doc.data()
            const user = { id: doc.id, fullName, email, role }
            users.push(user)
        }
        return users
    })
}

module.exports = { denormalizationUpdateHandler, getRoleValue, setRoleCustomClaim, handleUserDenormalization, initEvents, setTriggerAndUpdatedField, updateUserTurnover, getUsersByRole }



//OPTION1: update selected fields


// const admin = require('firebase-admin')
// const db = admin.firestore()
// const { roles } = require('../constants')
// var moment = require('moment')
// const _ = require('lodash')

// module.exports.updateUserFullNameOnAllDocs = async function (updatesDatas, newFullName) {

//     const updateValue = newFullName
//     const batch = admin.firestore().batch()

//     for (const updateData of updatesDatas) {

//         const query = setQuery(updateData.query)

//         await query.get().then(async (querysnapshot) => {

//             if (!querysnapshot.empty)
//                 for (const doc of querysnapshot.docs) {
//                     const update = setUpdate(doc.data(), updateData, updateValue)
//                     const update2 = {}
//                     batch.update(doc.ref, update)
//                 }
//         })
//     }

//     await batch.commit()
//         .then(() => console.log('BATCH SUCCEEDED !'))
//         .catch((e) => console.error(e))
// }

// function setQuery(queryParams) {
//     const { collection, isCollectionGroup, field, operation, value } = queryParams

//     let query
//     if (isCollectionGroup) query = db.collectionGroup(collection)
//     else query = db.collection(collection)
//     query = query.where(field, operation, value)

//     return query
// }

// function setUpdate(data, updateData, updateValue) {
//     const { updatePath, fieldType } = updateData
//     const { value } = updateData.query

//     const updatePathArray = updatePath.split('.')
//     const userVariable = updatePathArray.reduce((a, prop) => a[prop], data) // data[prop1][prop2]

//     let update = {}

//     if (fieldType === 'string') {
//         update[updatePath] = updateValue
//     }

//     else if (fieldType === 'array') {

//         userVariable.forEach((userObject) => {
//             if (userObject.id === value.id) {
//                 userObject.fullName = updateValue
//             }
//         })

//         update[updatePath] = userVariable

//     }

//     return update
// }

// module.exports.getRoleValue = function (roleId) {
//     for (const roleObject of roles) {
//         if (roleObject.id === roleId)
//             return roleObject.value
//     }
// }

// module.exports.setRoleCustomClaim = function (role) {
//     let claim = {}

//     switch (role) {
//         case 'Admin':
//             claim = { admin: true }
//             break;

//         case 'Back office':
//             claim = { backoffice: true }
//             break;

//         case 'Directeur commercial':
//             claim = { dircom: true }
//             break;

//         case 'Commercial':
//             claim = { com: true }
//             break;

//         case 'Responsable technique':
//             claim = { tech: true }
//             break;

//         case 'Poseur':
//             claim = { poseur: true }
//             break;

//         case 'Client':
//             claim = { client: true }
//             break;

//         default:
//             console.log('Something wrong happened...')
//     }
// }


//TRIGGERS HELPERS
// module.exports.initEvents = function (before, after) {
//     const isCreate = !before && after
//     const isUpdate = before !== null && after !== null
//     const isArchive = isUpdate && !before.deleted && after.deleted
//     const events = { isCreate, isUpdate, isArchive }
//     return events
// }

// module.exports.setTriggerAndUpdatedField = function (events, before, after, onUpdateField) {
//     const { isCreate, isUpdate, isArchive } = events

//     let trigger = isCreate ? 'onCreate' : isArchive ? 'onArchive' : isUpdate ? 'onUpdate' : ''
//     let field = ''

//     if (isUpdate && !isArchive) field = onUpdateField(trigger, before, after)

//     const event = { trigger, field }
//     return event
// }

// module.exports.updateUserTurnover = async function (userId, projectId, billClosedAt, billAfter) {

//     const year = moment(billClosedAt).format('YYYY')
//     const monthYear = moment(billClosedAt).format('MM-YYYY')

//     await db
//         .collection('Users')
//         .doc(userId)
//         .collection('Turnover')
//         .doc(year)
//         .get()
//         .then((doc) => {

//             console.log('YEAR', doc.id)
//             console.log('AMOUNT', billAfter.amount)

//             let turnoverData = doc.exists ? doc.data() : {}
//             let projectsIncome = turnoverData && turnoverData.projectsIncome || {}
//             projectsIncome[projectId] = billAfter
//             if (!turnoverData[monthYear]) {
//                 turnoverData[monthYear] = {}
//             }

//             turnoverData[monthYear].projectsIncome = projectsIncome

//             doc.ref.set(turnoverData, { merge: true })
//         })
// }