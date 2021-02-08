const App = new Vue({
  el: '#app',
  data: function(){
    return {
      loading: false,
      players: {},
      draftPool: {},
      bench: {},
      teams: {},
      manualBench: {},
      draft: null,
      tab: 'import-players',
      notificationMessage: false,
      settings: {
        lowerLimit: 0,
        upperLimit: 0,
        teamSize: 0,
        teamCount: 0,
        minSalary: 0,
        maxSalary: 0,
        minPointsPerGame: 0,
        minTeamAveragePoints: 0,
        maxTeamDifferential: 0
      }
    }
  },
  mounted: function() {
    let settings = this.loadFromStorage('draftSettings')
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
    }
    this.loadPlayersFromStorage()
    this.loadDraftPoolFromStorage()
    this.loadBenchFromStorage()
    this.loadTeamsFromStorage()
    this.getCountPlayerTimesUsed()
  },
  methods: {
    async loadPlayers(event) {
      await importCSV(event)
      this.loadPlayersFromStorage()
      let draftPool = {}
      Object.values(this.players).forEach(player => {
        draftPool[player.ID] = player
      })
      this.draftPool = draftPool
      this.bench = {}
      this.teams = {}
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
    buildTeams() {
      this.draft = new Draft(this.draftPool, 
        this.settings.lowerLimit, 
        this.settings.upperLimit, 
        this.settings.teamSize, 
        this.settings.teamCount,
        this.settings.minTeamAveragePoints,
        this.settings.maxTeamDifferential
      )
      this.draft.buildRandomTeams()
      
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
      let settings = {
        lowerLimit: this.settings.lowerLimit,
        upperLimit: this.settings.upperLimit,
        teamSize: this.settings.teamSize,
        teamCount: this.settings.teamCount,
        minSalary: this.settings.minSalary,
        maxSalary: this.settings.maxSalary,
        minPointsPerGame: this.settings.minPointsPerGame,
        minTeamAveragePoints: this.settings.minTeamAveragePoints,
        maxTeamDifferential: this.settings.maxTeamDifferential
      }
      let encodedSettings = JSON.stringify(settings)
      window.localStorage.setItem('draftSettings', encodedSettings)
      this.notificationMessage = "Settings Saved"
      setTimeout(() => { this.notificationMessage = false }, 3000);
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
    }
  }
})
