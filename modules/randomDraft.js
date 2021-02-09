function Draft (playerList, lowerLimit, upperLimit, teamSize, teamCount, minAveragePoints = 0, maxDifferential = 0, playerUsageLimit = 0) {
    this.playerList = playerList
    let playerIDs = Object.keys(playerList)
    this.playerIDs = playerIDs
    this.lowerLimit = lowerLimit;
    this.upperLimit = upperLimit;
    this.minAveragePoints = minAveragePoints
    this.maxDifferential = maxDifferential
    this.teamSize = teamSize
    this.teamCount = teamCount
    this.teams = []
    this.teamIDs = []
    this.failureCount = 0
    this.playerUsageLimit = playerUsageLimit
    this.initUsageCount()
}

Draft.prototype.buildRandomTeams = function() {
    let team;
    this.teams = []
    this.teamIDs = []
    while(this.teamIDs.length < this.teamCount) {
        team = this.buildTeam()
        if(this.isNewTeam(team.id)) {
            if(this.hasDraftRequirements(team)) {
                this.teamIDs.push(team.id)
                this.teams[team.id] = team
                this.increaseTeamPlayersUsageLimit(team.players)
            } else {
                this.failureCount += 1
                Vue.set(this, 'failureCount', this.failureCount)
            }
        } else {
            this.failureCount += 1
            Vue.set(this, 'failureCount', this.failureCount)
        }
    }

    // Now we have our teams, convert the algorithm strings to actual objects
    console.log('Failure Count: ' + this.failureCount)
}

Draft.prototype.buildTeam = function() {
    let team = new Team(this.teamSize)
    let player;
    while(Object.keys(team.players).length < this.teamSize) {
        player = this.findUnusedPlayer(team)
        team.players[player.ID] = player
    }
    team.setComputedValues()
    return team
}

Draft.prototype.hasDraftRequirements = function(team) {
    return (this.isValidSalaryCap(team) && this.hasMinAveragePoints(team) && this.isWithinDifferential(team))
}

Draft.prototype.isValidSalaryCap = function(team) {
    return (team.salaryCap >= this.lowerLimit && team.salaryCap <= this.upperLimit)
}

Draft.prototype.hasMinAveragePoints = function(team) {
    if(this.minAveragePoints && this.minAveragePoints > 0) {
        if(team.averagePoints < this.minAveragePoints) {
            return false
        } else {
            return true
        }
    } else {
        return true
    }
}

Draft.prototype.isWithinDifferential = function(team) {
    if(this.maxDifferential && this.maxDifferential > 0) {
        if(team.differential > this.maxDifferential) {
            return false
        } else {
            return true
        }
    } else {
        return true
    }
}

Draft.prototype.isNewTeam = function(teamID) {
    let result = !this.teamIDs.includes(teamID)
    return result
}

Draft.prototype.findUnusedPlayer = function(team) {
    let playerFound = false
    while(!playerFound) {
        let randomIndex = this.getRandomValidInt()
        let randomIndexValue = this.playerIDs[randomIndex]
        if(! team.players[randomIndexValue]) {
            // Check usage limit
            if(this.playerUsageLimit && this.playerUsageLimit > 0) {
                if(this.playerList[randomIndexValue].usageCount < this.playerUsageLimit) {
                    return this.playerList[randomIndexValue]
                }
            } else {
                return this.playerList[randomIndexValue]
            }
        }
    }
}

Draft.prototype.getRandomValidInt = function() {
    let min = Math.ceil(0);
    let max = Math.floor(this.playerIDs.length);
    let randomInt = Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
    return randomInt
}

Draft.prototype.initUsageCount = function() {
    Object.values(this.playerList).forEach(player => {
        player.usageCount = 0
    })
}

Draft.prototype.increaseTeamPlayersUsageLimit = function(team) {
    Object.values(team).forEach(player => {
        this.playerList[player.ID].usageCount += 1
    })
}