
const roles = [
    { id: 'admin', label: 'Admin', value: 'Admin', level: 3 },
    { id: 'backoffice', label: 'Back office', value: 'Back office', level: 3 },
    { id: 'dircom', label: 'Service commercial', value: 'Service commercial', level: 2 },
    { id: 'com', label: "Chargé d'affaires", value: "Chargé d'affaires", level: 1 },
    { id: 'tech', label: 'Service technique', value: 'Service technique', level: 1 },
    { id: 'poseur', label: 'Équipe technique', value: 'Équipe technique', level: 0 },
    { id: 'client', label: 'Client', value: 'Client', level: -1 },
    { id: 'designoffice', label: "Bureau d'étude", value: "Bureau d'étude", level: -1 }
]


module.exports = {
    roles
}
