//Update current value from projects where createdBy.id === userId && only turnoverGoalMonth

const functions = require('firebase-functions')
const admin = require('firebase-admin')
const db = admin.firestore()

const { initEvents } = require('../../utils/db;')

exports.onWriteTurnover = functions.firestore
    .document('Users/{userId}/Turnover/{yearId}')
    .onWrite(async (change, context) => {

        const { userId, yearId } = context.params
        const before = change.before.exists ? change.before.data() : null
        const after = change.after.exists ? change.after.data() : null

        if (!after) return //deleted from db

        const events = initEvents(before, after) //events = { isCreate, isUpdate, isArchive }

        const isNewMonthGoal = !before[after.lastMonthEdited]
        const isInitUserCurrentTurnover = events.isCreate || events.isUpdate && isNewMonthGoal
        if (!isInitUserCurrentTurnover) return

        let yearlyTurnover = after.current || 0
        let monthlyTurnover = 0

        await db.collection('Projects').where('createdBy.id', '==', userId).get().then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                const project = doc.data()

                if (project.bill) {
                    const formatedMonthYear = moment(project.bill.closedAt).format('MM-YYYY')
                    if (formatedMonthYear === after.lastMonthEdited) {
                        yearlyTurnover += project.bill.amount
                        monthlyTurnover += project.bill.amount
                    }
                }
            })
        })

        const update = {}
        update[`${after.lastMonthEdited}.current`] = monthlyTurnover
        update['current'] = yearlyTurnover
        change.after.ref.update(update)

        return
    })
