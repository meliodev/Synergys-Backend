

const functions = require('firebase-functions')
const admin = require('firebase-admin')
const { denormalizationUpdateHandler } = require('../../utils/db')
const _ = require('lodash')

function setUpdatesConfig(projectId) {
    const updatesConfig = [
        //Agenda
        { query: { collection: 'Agenda', field: 'project.id', operation: '==', value: projectId }, updatePath: 'project', updateType: 'object' },
        //Documents
        { query: { collection: 'Documents', field: 'project.id', operation: '==', value: projectId }, updatePath: 'project', updateType: 'object' },
        // { query: { collection: 'Documents', field: 'orderData.project.id', operation: '==', value: projectId }, updatePath: 'orderData.project', updateType: 'object.object' },
        //Orders
        { query: { collection: 'Orders', field: 'project.id', operation: '==', value: projectId }, updatePath: 'project', updateType: 'object' },
        //Requests
        { query: { collection: 'Requests', field: 'project.id', operation: '==', value: projectId }, updatePath: 'project', updateType: 'object' },
    ]
    return updatesConfig
}

exports.onUpdateProject = functions.firestore
    .document('Projects/{projectId}')
    .onUpdate(async (change, context) => {

        const { projectId } = context.params
        const after = change.after.data()
        const before = change.before.data()

        const comContactChanged = !_.isEqual(before.comContact, after.comContact) //#tested
        const techContactChanged = !_.isEqual(before.techContact, after.techContact) //#tested
        const updateTasksAssignedTo = comContactChanged || techContactChanged

        if (updateTasksAssignedTo) {
            await admin
                .firestore()
                .collection('Agenda')
                .where("project.id", "==", projectId)
                .where("status", "==", 'En cours')
                .get()
                .then(async (querysnapshot) => {
                    for (const doc of querysnapshot.docs) {
                        const task = doc.data()
                        if (task.assignedTo.id === before.techContact.id) {
                            var assignedTo = after.techContact
                        }
                        else if (task.assignedTo.id === before.comContact.id) {
                            var assignedTo = after.comContact
                        }
                        await doc.ref.update({ assignedTo })
                    }
                })
        }

        await handleProjectDenormalization(projectId, before, after)
        return
    })

async function handleProjectDenormalization(projectId, before, after) {
    const nameChanged = before.name !== after.name //#tested
    const clientChanged = !_.isEqual(before.client, after.client) //#tested
    const stepChanged = before.step !== after.step //#tested
    const addressChanged = !_.isEqual(before.address, after.address) //#tested
    const comContactChanged = !_.isEqual(before.comContact, after.comContact) //#tested
    const techContactChanged = !_.isEqual(before.techContact, after.techContact) //#tested
    const intervenantChanged = !_.isEqual(before.intervenant, after.intervenant) //#tested
    const workTypesChanged = !_.isEqual(before.workTypes, after.workTypes) //#toTest

    const isHandleDenormalizationUpdate = nameChanged || clientChanged || stepChanged || addressChanged || comContactChanged || techContactChanged || intervenantChanged || workTypesChanged

    if (isHandleDenormalizationUpdate) {
        const { name, client, step, address, comContact, techContact, intervenant, workTypes } = after
        const projectObjectAfter = {
            id: projectId,
            name,
            client,
            step,
            address,
            comContact,
            techContact,
            intervenant,
            workTypes
        }
        const updatesConfig = setUpdatesConfig(projectId)
        const response = await denormalizationUpdateHandler(updatesConfig, projectObjectAfter)
        return response
    }

    return
}














