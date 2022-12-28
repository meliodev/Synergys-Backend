// const permissions = {
//     'Admin': {
//         projects: { canCreate: true, canRead: true, canUpdate: true, canDelete: true },
//         documents: { canCreate: true, canRead: true, canUpdate: true, canDelete: true },
//         orders: { canCreate: true, canRead: true, canUpdate: true, canDelete: true },
//         users: { canCreate: true, canRead: true, canUpdate: true, canDelete: true },
//         teams: { canCreate: true, canRead: true, canUpdate: true, canDelete: true },
//         messages: { canCreate: true, canRead: true, canUpdate: true, canDelete: true },
//         requests: { canCreate: true, canRead: true, canUpdate: true, canDelete: true },
//     },
//     'Directeur commercial': {
//         projects: { canCreate: true, canRead: true, canUpdate: true, canDelete: true },
//         documents: { canCreate: true, canRead: true, canUpdate: true, canDelete: false },
//         orders: { canCreate: false, canRead: false, canUpdate: false, canDelete: false }, //No access
//         users: { canCreate: false, canRead: true, canUpdate: false, canDelete: false }, //No access (profile read only)
//         teams: { canCreate: false, canRead: true, canUpdate: false, canDelete: false }, //No access (read only)
//         messages: { canCreate: true, canRead: true, canUpdate: false, canDelete: false },
//         requests: { canCreate: true, canRead: true, canUpdate: false, canDelete: false },
//     },
//     'Commercial': {
//         projects: { canCreate: true, canRead: true, canUpdate: true, canDelete: true },
//         documents: { canCreate: true, canRead: true, canUpdate: true, canDelete: false },
//         orders: { canCreate: false, canRead: false, canUpdate: false, canDelete: false }, //No access
//         users: { canCreate: false, canRead: true, canUpdate: false, canDelete: false }, //No access (profile read only)
//         teams: { canCreate: false, canRead: true, canUpdate: false, canDelete: false }, //No access (read only)
//         messages: { canCreate: true, canRead: true, canUpdate: false, canDelete: false },
//         requests: { canCreate: true, canRead: true, canUpdate: false, canDelete: false },
//     },
//     'Responsable technique': {
//         projects: { canCreate: true, canRead: true, canUpdate: true, canDelete: true },
//         documents: { canCreate: true, canRead: true, canUpdate: true, canDelete: false },
//         orders: { canCreate: true, canRead: true, canUpdate: true, canDelete: true },
//         users: { canCreate: false, canRead: true, canUpdate: false, canDelete: false }, //No access (profile read only)
//         teams: { canCreate: false, canRead: true, canUpdate: false, canDelete: false }, //No access (read only)
//         messages: { canCreate: true, canRead: true, canUpdate: false, canDelete: false },
//         requests: { canCreate: true, canRead: true, canUpdate: false, canDelete: false },
//     },
//     'Poseur': {
//         projects: { canCreate: false, canRead: true, canUpdate: true, canDelete: false },
//         documents: { canCreate: false, canRead: false, canUpdate: false, canDelete: false }, //No access
//         orders: { canCreate: false, canRead: false, canUpdate: false, canDelete: false }, //No access
//         users: { canCreate: false, canRead: true, canUpdate: false, canDelete: false }, //No access (profile read only)
//         teams: { canCreate: false, canRead: true, canUpdate: false, canDelete: false }, //No access (read only)
//         messages: { canCreate: true, canRead: true, canUpdate: false, canDelete: false },
//         requests: { canCreate: true, canRead: true, canUpdate: false, canDelete: false }, //SAV access only (no Projects)
//     },
//     'Client': {
//         projects: { canCreate: false, canRead: true, canUpdate: true, canDelete: false },
//         documents: { canCreate: true, canRead: true, canUpdate: false, canDelete: false },
//         orders: { canCreate: false, canRead: false, canUpdate: false, canDelete: false }, //No access
//         users: { canCreate: false, canRead: true, canUpdate: false, canDelete: false }, //No access (profile read only)
//         teams: { canCreate: false, canRead: true, canUpdate: false, canDelete: false }, //No access (read only)
//         messages: { canCreate: true, canRead: true, canUpdate: false, canDelete: false },
//         requests: { canCreate: true, canRead: true, canUpdate: false, canDelete: false },
//     }
// }

// module.exports.getPermissions = function (token) {
//     return permissions[role]
// }

module.exports.getPermissions = function (token) {

    if (token.admin)
        return {
            projects: { canCreate: true, canRead: true, canUpdate: true, canDelete: true, },
            documents: { canCreate: true, canRead: true, canUpdate: true, canDelete: true, },
            orders: { canCreate: true, canRead: true, canUpdate: true, canDelete: true },
            users: { canCreate: true, canRead: true, canUpdate: true, canDelete: true },
            teams: { canCreate: true, canRead: true, canUpdate: true, canDelete: true },
            messages: { canCreate: true, canRead: true, canUpdate: true, canDelete: true },
            requests: { canCreate: true, canRead: true, canUpdate: true, canDelete: true },
        }

    else if (token.dircom)
        return {
            projects: { canCreate: true, canRead: true, canUpdate: true, canDelete: true },
            documents: { canCreate: true, canRead: true, canUpdate: true, canDelete: false },
            orders: { canCreate: false, canRead: false, canUpdate: false, canDelete: false }, //No access
            users: { canCreate: false, canRead: true, canUpdate: false, canDelete: false }, //No access (profile read only)
            teams: { canCreate: false, canRead: true, canUpdate: false, canDelete: false }, //No access (read only)
            messages: { canCreate: true, canRead: true, canUpdate: false, canDelete: false },
            requests: { canCreate: true, canRead: true, canUpdate: false, canDelete: false },
        }

    else if (token.tech)
        return {
            projects: { canCreate: true, canRead: true, canUpdate: true, canDelete: true },
            documents: { canCreate: true, canRead: true, canUpdate: true, canDelete: false },
            orders: { canCreate: true, canRead: true, canUpdate: true, canDelete: true },
            users: { canCreate: false, canRead: true, canUpdate: false, canDelete: false }, //No access (profile read only)
            teams: { canCreate: false, canRead: true, canUpdate: false, canDelete: false }, //No access (read only)
            messages: { canCreate: true, canRead: true, canUpdate: false, canDelete: false },
            requests: { canCreate: true, canRead: true, canUpdate: false, canDelete: false },
        }


    else if (token.com)
        return {
            projects: { canCreate: true, canRead: true, canUpdate: true, canDelete: true },
            documents: { canCreate: true, canRead: true, canUpdate: true, canDelete: false },
            orders: { canCreate: false, canRead: false, canUpdate: false, canDelete: false }, //No access
            users: { canCreate: false, canRead: true, canUpdate: false, canDelete: false }, //No access (profile read only)
            teams: { canCreate: false, canRead: true, canUpdate: false, canDelete: false }, //No access (read only)
            messages: { canCreate: true, canRead: true, canUpdate: false, canDelete: false },
            requests: { canCreate: true, canRead: true, canUpdate: false, canDelete: false },
        }

    else if (token.poseur)
        return {
            projects: { canCreate: false, canRead: true, canUpdate: true, canDelete: false },
            documents: { canCreate: false, canRead: false, canUpdate: false, canDelete: false }, //No access
            orders: { canCreate: false, canRead: false, canUpdate: false, canDelete: false }, //No access
            users: { canCreate: false, canRead: true, canUpdate: false, canDelete: false }, //No access (profile read only)
            teams: { canCreate: false, canRead: true, canUpdate: false, canDelete: false }, //No access (read only)
            messages: { canCreate: true, canRead: true, canUpdate: false, canDelete: false },
            requests: { canCreate: true, canRead: true, canUpdate: false, canDelete: false }, //SAV access only (no Projects)
        }

    else if (token.client)
        return {
            projects: { canCreate: false, canRead: true, canUpdate: true, canDelete: false },
            documents: { canCreate: true, canRead: true, canUpdate: false, canDelete: false },
            orders: { canCreate: false, canRead: false, canUpdate: false, canDelete: false }, //No access
            users: { canCreate: false, canRead: true, canUpdate: false, canDelete: false }, //No access (profile read only)
            teams: { canCreate: false, canRead: true, canUpdate: false, canDelete: false }, //No access (read only)
            messages: { canCreate: true, canRead: true, canUpdate: false, canDelete: false },
            requests: { canCreate: true, canRead: true, canUpdate: false, canDelete: false },
        }
}
