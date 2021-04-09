
const _ = require('lodash')

function isCurrentActionDifferent(processBefore, processAfter) {

    if (_.isEmpty(processBefore) || _.isEmpty(processAfter)) {
        return false
    }

    let isCurrentActionDiff = false

    const currentActionBefore = getCurrentAction(processBefore)
    const currentActionAfter = getCurrentAction(processAfter)

    console.log('CURRENTACTION BEFORE', currentActionBefore.id)
    console.log('CURRENTACTION AFTER', currentActionAfter.id)

    if (currentActionBefore.id !== currentActionAfter.id) {
        isCurrentActionDiff = true
    }

    return isCurrentActionDiff
}

function getCurrentAction(process) {
    if (_.isEmpty(process)) return null

    const { currentPhaseId, currentStepId } = getCurrentStep(process)

    let { actions } = process[currentPhaseId].steps[currentStepId]
    actions.sort((a, b) => (a.actionOrder > b.actionOrder) ? 1 : -1)

    let currentAction = null

    for (const action of actions) {
        //if (!currentAction && (action.status === 'pending' || action.status === 'done' && action.isAnimation))
        if (!currentAction && action.status === 'pending')
            currentAction = action
    }

    return currentAction
}

function getCurrentStep(process) {

    let maxStepOrder = 0
    var currentPhaseId = getCurrentPhase(process)
    let currentStepId

    const { steps } = process[currentPhaseId]
    const stepsFormated = Object.entries(steps)

    stepsFormated.forEach(([stepId, step]) => {
        if (step.stepOrder > maxStepOrder) {
            maxStepOrder = step.stepOrder
            currentStepId = stepId
        }
    })

    return { currentPhaseId, currentStepId } //you can then use process[currentPhaseId].steps[currentStepId]
}

function getCurrentPhase(process) {

    const phases = Object.entries(process)

    let maxPhaseOrder = 0
    let currentPhaseId

    phases.forEach(([phaseId, phase]) => {
        if (phase.phaseOrder > maxPhaseOrder) {
            maxPhaseOrder = phase.phaseOrder
            currentPhaseId = phaseId
        }
    })

    return currentPhaseId
}

function getResponsable(subscribers, responsable) {
    subscribers = subscribers.filter((sub) => sub.role === responsable)
    const reponsable = subscribers[0]
    console.log('RESPONSABLE', responsable)
    const reponsableFullName = responsable.fullname
    return reponsableFullName
}

module.exports = { isCurrentActionDifferent, getCurrentAction, getCurrentPhase, getResponsable }