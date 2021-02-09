function Team (teamSize) {
    this.players = {}
    this.teamSize = teamSize
    this.id = null
    this.salaryCap = null
    this.averagePoints = null
    this.differential = null
}

// Draft.prototype.buildTeam = function() {
//     let team = []
//     return team
// }

Team.prototype.setComputedValues = function() {
    this.getTeamID()
    this.getSalaryCap()
    this.getAveragePoints()
    this.getPlayerDisplayNames()
    this.getDifferential()
}

Team.prototype.getTeamID = function() {
    let teamIDsArray = Object.keys(this.players)
    let sortedTeamIDsArray = teamIDsArray.sort(function(a, b){return a-b})
    this.id = sortedTeamIDsArray.toString()
}

Team.prototype.isValidSalaryCap = function() {
    let teamIDsArray = this.players.values().map(player => player.ID).sort(function(a, b){return a-b})
    this.id = teamIDsArray.toString()
}

Team.prototype.getSalaryCap = function() {
    let sum = 0
    for(const [key, player] of Object.entries(this.players)) {
        if(player.Salary && player.Salary > 0) {
            sum += parseInt(player.Salary)
        }
    }
    this.salaryCap = sum
}

Team.prototype.getAveragePoints = function() {
    let sum = 0
    for(const [key, player] of Object.entries(this.players)) {
        sum += parseFloat(player.AvgPointsPerGame)
    }
    let average = sum / Object.keys(this.players).length
    this.averagePoints = average.toFixed(2)
}

Team.prototype.getPlayerDisplayNames = function() {
    for(const [key, player] of Object.entries(this.players)) {
        player.displayName = player.Name + " (" + player.Salary + ")"
    }
}

Team.prototype.getDifferential = function() {
    let salaries = Object.values(this.players).map(player => parseInt(player.Salary))
    let max = Math.max(...salaries)
    let min = Math.min(...salaries)
    
    this.differential = max - min
}

