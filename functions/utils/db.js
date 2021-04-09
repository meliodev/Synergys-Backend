
const admin = require('firebase-admin')
const db = admin.firestore()
const { roles } = require('../constants')

module.exports.updateUserFullNameOnAllDocs = async function (updatesDatas, newFullName) {

    let promises = []

    for (const updateData of updatesDatas) {

        const { query, updatePath, fieldType } = updateData
        const { collection, isCollectionGroup, field, operation, value } = query
        let queryForm

        if (isCollectionGroup) queryForm = db.collectionGroup(collection)
        else queryForm = db.collection(collection)
        queryForm = queryForm.where(field, operation, value)

        queryForm.get().then((querysnapshot) => {

            if (querysnapshot.empty) return null

            const updateValue = newFullName

            querysnapshot.forEach((doc) => {

                const data = doc.data()
                const updatePathArray = updatePath.split('.')
                const userVariable = updatePathArray.reduce((a, prop) => a[prop], data) // data[prop1][prop2]

                let update = {}

                if (fieldType === 'string') {
                    update[updatePath] = updateValue
                }

                else if (fieldType === 'array') {
                    userVariable.forEach((userObject) => {
                        if (userObject.id === value.id) {
                            userObject.fullName = updateValue
                        }
                    })

                    update[updatePath] = userVariable
                }

                promises.push(doc.ref.update(update))
            })
        })
    }

    console.log('Promises length', promises.length)

    return Promise.all(promises)
}

module.exports.getRoleValue = function (roleId) {
    for (const roleObject of roles) {
        if (roleObject.id === roleId)
            return roleObject.value
    }
}

module.exports.setRoleCustomClaim = function (role) {
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
}


//TRIGGERS HELPERS
module.exports.initEvents = function (before, after) {
    const isCreate = !before && after
    const isUpdate = before !== null && after !== null
    const isArchive = isUpdate && !before.deleted && after.deleted
    const events = { isCreate, isUpdate, isArchive }
    return events
}

module.exports.setTriggerAndUpdatedField = function (events, before, after, onUpdateField) {
    const { isCreate, isUpdate, isArchive } = events

    let trigger = isCreate ? 'onCreate' : isArchive ? 'onArchive' : isUpdate ? 'onUpdate' : ''
    let field = ''

    if (isUpdate && !isArchive) field = onUpdateField(trigger, before, after)

    const event = { trigger, field }
    return event
}