const App = new Vue({
  el: '#app',
  data: function(){
    return {
      players: {},
      playerSearch: '',
      teamPlayerSearch: '',
      draftPoolPlayerSearch: '',
      benchPlayerSearch: '',
      draftPool: {},
      bench: {},
      teams: {},
      manualBench: {},
      cuts: [],
      draft: null,
      tab: 'import-players',
      notificationMessage: false,
      notificationType: '',
      settings: {
        lowerLimit: '',
        upperLimit: '',
        teamSize: '',
        teamCount: '',
        minSalary: '',
        maxSalary: '',
        minPointsPerGame: '',
        minTeamAveragePoints: '',
        maxTeamDifferential: '',
        playerUsageLimit: '',
      },
      password: '',
      showScreen: false
    }
  },
  created: function() {
    window.addEventListener('keydown', this.passcode)
  },
  mounted: function() {
    let settings = new Settings()
    if(settings) {
      this.settings.lowerLimit = settings.lowerLimit
      this.settings.upperLimit = settings.upperLimit
      this.settings.teamSize = settings.teamSize
      this.settings.teamCount = settings.teamCount
      this.settings.minSalary = settings.minSalary
      this.settings.maxSalary = settings.maxSalary
      this.settings.minPointsPerGame = settings.minPointsPerGame
      this.settings.minTeamAveragePoints = settings.minTeamAveragePoints
      this.settings.maxTeamDifferential = settings.maxTeamDifferential
      this.settings.playerUsageLimit = settings.playerUsageLimit
    }
    this.loadPlayersFromStorage()
    this.initPlayersCut()
    this.loadDraftPoolFromStorage()
    this.loadBenchFromStorage()
    this.loadTeamsFromStorage()
    this.getCountPlayerTimesUsed()
  },
  methods: {
    passcode(e) {
      this.password += e.key
      if(this.password.includes('blake')){
        this.showScreen = true
        window.removeEventListener('keydown', this.passcode)
      }
    },
    async loadPlayers(event) {
      window.localStorage.removeItem('draftCuts')
      await importCSV(event)
      this.loadPlayersFromStorage()
      let draftPool = {}
      Object.values(this.players).forEach(player => {
        draftPool[player.ID] = player
      })
      this.draftPool = draftPool
      this.bench = {}
      this.teams = {}
      this.cuts = []
      this.saveDraftPool(this.draftPool)
      this.saveBench(this.bench)
      window.localStorage.removeItem('draftTeams')
    },
    loadPlayersFromStorage() {
      let players = this.loadFromStorage('fileContent')
      if(players) {
        let playersObject = {}
        players.forEach((player) => {
          if(player.ID && player.Name) {
            playersObject[player.ID] = player
          }
        })
        this.players = playersObject
      }
    },
    loadTeamsFromStorage() {
      let teams = this.loadFromStorage('draftTeams')
      if(teams) {
        let teamsObject = {}
        teams.forEach(team => {
          teamsObject[team.id] = team
        })
        this.teams = teamsObject
      }      
    },
    loadBenchFromStorage() {
      let players = this.loadFromStorage('draftBench')
      if(players) {
        let playersObject = {}
        players.forEach(player => {
          playersObject[player.ID] = player
        })
        this.bench = playersObject
      } 
    },
    loadDraftPoolFromStorage() {
      let players = this.loadFromStorage('draftPool')
      if(players) {
        let playersObject = {}
        players.forEach(player => {
          playersObject[player.ID] = player
        })
        this.draftPool = playersObject
      } 
    },
    loadFromStorage(key) {
      let data = window.localStorage.getItem(key)
      let parsedData = JSON.parse(data)
      return parsedData
    },
    buildTeams(isRebuild = false) {
      this.draft = new Draft(this.draftPool, 
        this.settings.lowerLimit, 
        this.settings.upperLimit, 
        this.settings.teamSize, 
        this.settings.teamCount,
        this.settings.minTeamAveragePoints,
        this.settings.maxTeamDifferential,
        this.settings.playerUsageLimit,
      )
      if(isRebuild) {
        this.draft.reBuild(this.teams)
      } else {
        this.draft.buildRandomTeams()
      }
      
      let encodedTeams = JSON.stringify(Object.values(this.draft.teams))
      window.localStorage.setItem('draftTeams', encodedTeams)
      this.teams = this.draft.teams
      this.getCountPlayerTimesUsed()
    },
    setTab(tab) {
      this.tab = tab
    },
    removeTeams() {
      let confirmRemoveTeams = confirm("Please confirm that you would like to remove the current set of teams.");
      if(confirmRemoveTeams) {
        this.teams = {}
        window.localStorage.removeItem('draftTeams')
        // Reset Counters to Zero
        for(const [key, player] of Object.entries(this.players)) {
          player.teamCount = 0
        }
      }
    },
    setManualBench(playerID) {
      let player = this.getPlayer(playerID)
      player.benched = true
      Vue.set(this.manualBench, player.ID, player)
      Vue.delete(this.draftPool, player.ID)
      Vue.set(this.bench, player.ID, player)
      this.saveDraftPool(this.draftPool)
      this.saveBench(this.bench)
    },
    removeManualBench(playerID) {
      let player = this.getPlayer(playerID)
      player.benched = false
      Vue.delete(this.manualBench, player.ID)
      Vue.delete(this.bench, player.ID)
      Vue.set(this.draftPool, player.ID, player)
      this.saveDraftPool(this.draftPool)
      this.saveBench(this.bench)
    },
    setMadeCut(playerID) {
      this.cuts.push(playerID)
      let encodedPlayers = JSON.stringify(Object.values(this.cuts))
      window.localStorage.setItem('draftCuts', encodedPlayers)
      this.$forceUpdate()
    },
    setMissedCut(playerID) {
      let index = this.cuts.indexOf(playerID)
      if(index != -1){
        this.cuts.splice(index, 1)
     }
      let encodedPlayers = JSON.stringify(Object.values(this.cuts))
      window.localStorage.setItem('draftCuts', encodedPlayers)
      this.$forceUpdate()
    },
    saveDraftPool(pool) {
      let encodedPlayers = JSON.stringify(Object.values(pool))
      window.localStorage.setItem('draftPool', encodedPlayers)
    },
    saveBench(bench) {
      let encodedPlayers = JSON.stringify(Object.values(bench))
      window.localStorage.setItem('draftBench', encodedPlayers)
    },
    getPlayer(playerID) {
      return this.players[playerID]
    },
    saveSettings() {
      let settings = new Settings()
      let saveResult = settings.saveSettings(this.settings)
      if(saveResult) {
        this.notificationType = 'success'
        this.notificationMessage = "Settings Saved"
        setTimeout(() => { this.notificationMessage = false }, 3000);
      } else {
        this.notificationType = 'failure'
        this.notificationMessage = settings.validationMessage
        setTimeout(() => { this.notificationMessage = false }, 3000);
      }
      
    },
    setDraftPool() {
      let draftPool = {}
      for(const [key, player] of Object.entries(this.players)) {
          draftPool[player.ID] = player
      }
      this.saveDraftPool(draftPool)
      this.draftPool = draftPool

    },
    benchByMinSalary() {
      if(this.settings.minSalary && this.settings.minSalary > 0){
        for(const [key, player] of Object.entries(this.draftPool)) {
          if(parseInt(player.Salary) < parseInt(this.settings.minSalary)) {
            this.setManualBench(player.ID)
          }
        }
      }
    },
    benchByMaxSalary() {
      if(this.settings.maxSalary && this.settings.maxSalary > 0){
        for(const [key, player] of Object.entries(this.draftPool)) {
          if(parseInt(player.Salary) > parseInt(this.settings.maxSalary)) {
            this.setManualBench(player.ID)
          }
        }
      }
    },
    benchByMinPoints() {
      if(this.settings.minPointsPerGame && this.settings.minPointsPerGame > 0){
        for(const [key, player] of Object.entries(this.draftPool)) {
          if(parseInt(player.AvgPointsPerGame) < parseInt(this.settings.minPointsPerGame)) {
            this.setManualBench(player.ID)
          }
        }
      }
    },
    exportTeamsCSV() {
      const rows = [
        ['Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 5', 'Player 6', 'Salary', 'Average Points', 'Max/Min Diff', 'Player IDs']
      ];

      Object.values(this.teams).forEach(team => {
        let teamData = []
        Object.values(team.players).forEach(player => {
          teamData.push(player.displayName)
        })
        teamData.push(team.salaryCap)
        teamData.push(team.averagePoints)
        teamData.push(team.differential)
        teamData.push(team.id.replaceAll(',', ' '))
        rows.push(teamData)
      })

      let csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");

      let encodedUri = encodeURI(csvContent);
      let link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      let filename = "draft_teams_" + Date.now() + ".csv"
      link.setAttribute("download", filename);
      document.body.appendChild(link);

      link.click();
      document.body.removeChild(link);
    },
    getCountPlayerTimesUsed(){
      if(this.teams && Object.keys(this.teams).length > 0) {
        // Reset Counters to Zero
        for(const [key, player] of Object.entries(this.players)) {
          player.teamCount = 0
        }
        // Count
        Object.values(this.teams).forEach(team => {
          Object.values(team.players).forEach(player => {
            this.players[player.ID].teamCount += 1
          })
        })
      }
    },
    initPlayersCut() {
      let players = this.loadFromStorage('draftCuts')
      if(players) {
        this.cuts = players
      } 
    },
    getCutStatus(playerID) {
      return this.cuts.includes(playerID)
    },
    getTeamCutCount(team) {
      let count = 0
      for(const [key, player] of Object.entries(team.players)){
        if(this.cuts.includes(player.ID)) {
          count += 1
        }
      }
      return count
    },
    async removePlayer(playerID) {
      // Confirm Removal
      let confirmation = confirm('Removing a player will cause the teams the player was on to be rebuilt. Confirm to proceed.')
      
      if(confirmation) {
      // Remove Player From Draft Pool && Main List
        await this.deletePlayer(playerID)
        let removedTeamCount = 0
        let index = 1
        let editedTeams = []
        for(const [key, team] of Object.entries(this.teams)){
          if(team.players[playerID]) {
            // Get Players
            let players = team.players
            // Remove Current Player From Teams
            delete players[playerID]
            // Save
            this.teams[key].players = players
            removedTeamCount += 1
            editedTeams.push(index)
          }
          index++
        }
        // Find new players that work for each team
        if(removedTeamCount > 0) {
          this.buildTeams(true)
          this.notificationMessage = "Edited Teams: " + editedTeams.toString()
          setTimeout(() => { this.notificationMessage = false }, 5000); 46,54,58,63
        }
      }      
    },
    deletePlayer(playerID) {
      return new Promise(resolve => {
        if(this.players[playerID]) {
          Vue.delete(this.players, playerID)
          let encodedPlayers = JSON.stringify(Object.values(this.players))
          window.localStorage.setItem('fileContent', encodedPlayers)
        }
        if(this.draftPool[playerID]) {
          Vue.delete(this.draftPool, playerID)
          let encodedPlayers = JSON.stringify(Object.values(this.draftPool))
          window.localStorage.setItem('draftPool', encodedPlayers)
        }
        if(this.bench[playerID]) {
          Vue.delete(this.bench, playerID)
          let encodedPlayers = JSON.stringify(Object.values(this.bench))
          window.localStorage.setItem('draftBench', encodedPlayers)
        }
        if(this.manualBench[playerID]) {
          Vue.delete(this.manualBench, playerID)
        }
        if(this.cuts.includes(playerID)) {
          Vue.delete(this.cuts, playerID)
          let encodedPlayers = JSON.stringify(Object.values(this.cuts))
          window.localStorage.setItem('draftCuts', encodedPlayers)
        }
        resolve(true)
      })
    },
    textSearch(players) {
      if(this.teamPlayerSearch == '') {
        return true
      } else {
        let text = this.teamPlayerSearch.toLowerCase()
        let names = Object.values(players).map(player => player.Name.toLowerCase()).toString()
        return names.includes(text)
      }
    },
    textSearchName(name, search) {
       if(search == '') {
        return true
      } else {
        let text = name.toLowerCase()
        let searchString = search.toLowerCase()
        let result = text.includes(searchString)
        return result
      }
    },
    exportAllData() {
      let exportAllData = {
        players: JSON.parse(JSON.stringify(this.players)),
        draftPool: JSON.parse(JSON.stringify(this.draftPool)),
        bench: JSON.parse(JSON.stringify(this.bench)),
        teams: JSON.parse(JSON.stringify(Object.values(this.teams))),
        manualBench: JSON.parse(JSON.stringify(this.manualBench)),
        cuts: JSON.parse(JSON.stringify(this.cuts)),
        settings: JSON.parse(JSON.stringify(this.settings))
      }

      exportData(exportAllData)
    },
    async importAllData(event) {
      await importData(event)
      let data = this.loadFromStorage('dataImport')
      this.importObjects(data.players, 'players')
      this.importObjects(data.draftPool, 'draftPool')
      this.importObjects(data.bench, 'bench')
      this.importObjects(data.manualBench, 'manualBench')
      this.importObjects(data.teams, 'teams')
      this.settings = data.settings
      this.cuts = data.cuts
    },
    importObjects(objects, property) {
      let object = {}
      let idProperty = property == 'teams' ? 'id' : 'ID'

      Object.values(objects).forEach(someObject => {
        object[someObject[idProperty]] = someObject
      })

      this[property] = object
    },
    validateSettings() {
      let settings = new Settings()
      return settings.validate()
    }

  }
})
