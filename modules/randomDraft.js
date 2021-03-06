function Draft (playerList, lowerLimit, upperLimit, teamSize, teamCount, minAveragePoints = 0, maxDifferential = 0, playerUsageLimit = 0, playerUsageMin = 0, failureLimit = 0) {
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
    this.playerUsageMin = playerUsageMin
    this.failureLimit = failureLimit
    this.initUsageCount()
}

Draft.prototype.buildRandomTeams = function() {
    let team;
    this.teams = []
    this.teamIDs = []
    let failureCount = 0
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
        if(failureCount == this.failureLimit) {
            throw new Error("Timed out building teams. Try again or try lower settings.");
        } else {
            failureCount++
        }
    }
}

Draft.prototype.reBuild = function(teams) {
    for(const [key, oldTeam] of Object.entries(teams)){
        let team
        if(Object.keys(oldTeam.players).length == this.teamSize) {
            team = new Team(this.teamSize)
            team.players = oldTeam.players
            team.setComputedValues()
            this.teamIDs.push(team.id)
            this.teams[team.id] = team
            this.increaseTeamPlayersUsageLimit(team.players)
        } else {
            let teamFound = false
            let failureCount = 0
            while(!teamFound) {
                team = this.buildTeam(JSON.parse(JSON.stringify(oldTeam.players)))
                if(this.hasDraftRequirements(team)) {
                    this.teamIDs.push(team.id)
                    this.teams[team.id] = team
                    this.increaseTeamPlayersUsageLimit(team.players)
                    teamFound = true
                }
                if(failureCount == this.failureLimit) {
                    throw new Error("Timed out building teams. Try again or try lower settings.");
                } else {
                    failureCount++
                }
            }
        }
    }
}

Draft.prototype.forceUsage = function() {
    this.teams = []
    this.teamIDs = []
    let teams = []
    let teamCount = 0
    while(teamCount < this.teamCount) {
        let team = new Team(this.teamSize)
        teams.push(team)
        teamCount++
    }

    let usageCount = 0
    while(usageCount < this.playerUsageMin) {
        Object.values(this.playerList).forEach(player => {
            let teamFound = false
            let team
            let teamID
            let teamSize
            let failureCount = 0
            while(!teamFound) {
                teamID = this.getRandomTeamInt()
                team = teams[teamID] 
                teamSize = Object.values(team.players).length
                if(teamSize < this.playerUsageMin + 1 && teamSize < this.teamSize) {
                    teamFound = true
                }
                if(failureCount == this.failureLimit) {
                    throw new Error("Timed out building teams. Try again or try lower settings.");
                } else {
                    failureCount++
                }
            }
            teams[teamID].players[player.ID] = player
        })
        usageCount++
    }
    teamsObject = {}
    teams.forEach((team, index) => {
        teamsObject[index] = team
    })

    this.reBuild(teamsObject)
}

Draft.prototype.buildTeam = function(partialTeam = {}) {
    let team = new Team(this.teamSize)
    let player;
    if(Object.keys(partialTeam).length > 0) {
        team.players = partialTeam
    }
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

Draft.prototype.getRandomTeamInt = function() {
    let min = Math.ceil(0);
    let max = Math.floor(this.teamCount);
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