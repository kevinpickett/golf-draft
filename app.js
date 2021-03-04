Vue.component('player-replace', {
  props: ['player', 'team', 'players', 'settings'],
  data: function() {
    return {
      edit: false,
      playerID: this.player.ID
    }
  },
  methods: {
    isEligible(replacement) {
      let isEligible = false
      if(!this.team.id.includes(replacement.ID) || replacement.ID == this.player.ID) {
        let cap = parseInt(this.team.salaryCap) - parseInt(this.player.Salary) + parseInt(replacement.Salary)
        isEligible = (cap >= parseInt(this.settings.lowerLimit) && cap <= parseInt(this.settings.upperLimit))
      } 
      return isEligible
    },
    saveReplacementPlayer() {
      let emitData = {
        oldPlayerID: this.player.ID,
        newPlayerID: this.playerID,
        teamID: this.team.id
      }
      this.$emit('save-replacement-child', emitData)
    }
  },
  template: `<div>
              <span v-if="!edit" v-on:dblclick="edit = true">{{player.displayName}}</span>
              <div v-else class="field has-addons">
                <p class="control">
                  <button class="button is-small is-danger" @click="edit = false">
                    <span class="icon is-small">
                      <i class="fas fa-times is-small"></i>
                    </span>
                  </button>
                </p>
                <p class="control">
                  <div class="select is-small">
                    <select v-model="playerID">
                      <template v-for="item in players">
                        <option v-if="isEligible(item)" :key="item.ID" v-bind:value="item.ID">{{item.displayName}}</option>
                      </template>
                    </select>
                  </div>
                </p>
                <p class="control">
                  <button class="button is-small is-success" @click='saveReplacementPlayer()'>
                    <span class="icon is-small">
                      <i class="fas fa-check is-small"></i>
                    </span>
                  </button>
                </p>
              </div>
            </div>`
})

Vue.component('player-points', {
  props: ['player'],
  data: function() {
    return {
      edit: false,
      playerID: this.player.ID,
      points: this.player.points ? this.player.points : 0
    }
  },
  methods: {
    updatePlayerPoints() {
      let points = parseFloat(this.points)
      if(points != '' && points != 'undefined' && !isNaN(points) && (typeof points == 'float' || typeof points == 'int' || typeof points == 'number')) {
        let emitData = {
          points: this.points,
          playerID: this.playerID
        }
        this.$emit('update-points', emitData)
        this.edit = false
      } else {
        this.$emit('error-message', 'Invalid points value.')
      }
    }
  },
  template: `<div>
              <div v-if="!edit" v-on:dblclick="edit = true">{{points}}</div>
              <div v-else class="field has-addons">
                <p class="control">
                  <button class="button is-small is-danger" @click="edit = false">
                    <span class="icon is-small">
                      <i class="fas fa-times is-small"></i>
                    </span>
                  </button>
                </p>
                <p class="control">
                  <div class=" is-small">
                    <input type="text" class="input is-small" v-model="points"/>
                  </div>
                </p>
                <p class="control">
                  <button class="button is-small is-success" @click='updatePlayerPoints()'>
                    <span class="icon is-small">
                      <i class="fas fa-check is-small"></i>
                    </span>
                  </button>
                </p>
              </div>
            </div>`
})

Vue.component('database-import', {
  data: function() {
    return {
      uploadMode: false,
      fileName: ''
    }
  },
  methods: {
    async importDatabase(evt) {
      let importer = new Database()
      await importer.importFromBackup(evt).then(result => {
        this.$emit('database-updated', result)
        this.uploadMode = false
      })
    }
  },
  template: `<div class="level-item">
              <button v-if="!uploadMode" type="button" class="button is-info" @click="uploadMode = true;">
                  <span class="icon is-small">
                      <i class="fas fa-cloud-download-alt fa-lg"></i>
                  </span>
              </button>
              <div v-else>
                <div class="file has-name is-info">
                  <label class="file-label">
                      <input class="file-input" type="file" name="fileinput" id="fileinput"
                          @change="importDatabase">
                      <span class="file-cta">
                          <span class="file-icon">
                              <i class="fas fa-upload"></i>
                          </span>
                          <span class="file-label">
                              Choose a file…
                          </span>
                      </span>
                      <span class="file-name">

                      </span>
                  </label>
                </div>
              </div>
              
            </div>`
})

const App = new Vue({
  el: '#app',
  data: function(){
    return {
      players: {},
      displayPlayers: [],
      playersSort: 'Salary',
      playersDesc: 'true',
      displayPool: [],
      poolSort: 'Salary',
      poolDesc: 'true',
      displayBench: [],
      benchSort: 'Salary',
      benchDesc: 'true',
      displayTeams: [],
      teamSort: 'salaryCap',
      teamDesc: 'true',
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
      //tab: 'import-players',
      tab: '',
      notificationMessage: false,
      notificationType: '',
      database: new Database(),
      dbEntryName: '',
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
        playerUsageMin: '',
        failureLimit: ''
      },
      reportType: '',
      cutReportData: {},
      highlightTeam: '',
      email: 'kevinpickett90@gmail.com',
      password: '',
      user: null,
      authLoaded: false,
      loginError: ''
    }
  },
  mounted: function() {
    // Auth
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/firebase.User
        var uid = user.uid;
        this.user = user
        this.setTab('import-players')
        this.authLoaded = true
        // ...
      } else {
        this.user = null
        this.setTab('login')
        this.authLoaded = true
      }
    });

    // Data
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
      this.settings.playerUsageMin = settings.playerUsageMin
      this.settings.failureLimit = settings.failureLimit
    }
    this.database.load()
    this.loadPlayersFromStorage()
    this.initPlayersCut()
    this.loadDraftPoolFromStorage()
    this.loadBenchFromStorage()
    this.loadTeamsFromStorage()
    this.getCountPlayerTimesUsed()
    this.getAllTeamPoints()
    this.setPlayerSort(this.playersSort, false)
    this.setPoolSort(this.poolSort, false)
    this.setBenchSort(this.benchSort, false)
    this.setTeamSort(this.teamSort, false)
  },
  computed: {
    authenticated: function() {
      if(this.user && this.user.uid) {
        return true
      } else {
        return false
      }
    }
  },
  methods: {
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
        this.displayPlayers = Object.values(this.players)
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
        this.getAllTeamCutCount()
        this.displayTeams = Object.values(this.teams)
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
        this.displayBench = Object.values(this.bench)
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
        this.displayPool = Object.values(this.draftPool)
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
        this.settings.playerUsageMin,
        this.settings.failureLimit
      )
      try {
        if(isRebuild) {
          this.draft.reBuild(this.teams)
        } else {
          this.draft.buildRandomTeams()
        }
        
        let encodedTeams = JSON.stringify(Object.values(this.draft.teams))
        window.localStorage.setItem('draftTeams', encodedTeams)
        this.teams = this.draft.teams
        this.displayTeams = Object.values(this.teams)
        this.setPlayerSort(this.playersSort, false)
        this.getAllTeamCutCount()
        this.getAllTeamPoints()
        this.setTeamSort(this.teamSort, false)
        this.getCountPlayerTimesUsed()
      } catch (error) {
        this.notificationType = 'failure'
        this.notificationMessage = error
        setTimeout(() => { this.notificationMessage = false }, 3000);
      }
    },
    forceUsageBuildTeams() {
      this.draft = new Draft(this.draftPool, 
        this.settings.lowerLimit, 
        this.settings.upperLimit, 
        this.settings.teamSize, 
        this.settings.teamCount,
        this.settings.minTeamAveragePoints,
        this.settings.maxTeamDifferential,
        this.settings.playerUsageLimit,
        this.settings.playerUsageMin,
        this.settings.failureLimit
      )

      try {
        this.draft.forceUsage()
        let encodedTeams = JSON.stringify(Object.values(this.draft.teams))
        window.localStorage.setItem('draftTeams', encodedTeams)
        this.teams = this.draft.teams
        this.displayTeams = Object.values(this.teams)
        this.setPlayerSort(this.playersSort, false)
        this.getAllTeamCutCount()
        this.getAllTeamPoints()
        this.setTeamSort(this.teamSort, false)
        this.getCountPlayerTimesUsed()
      } catch (error) {
        this.notificationType = 'failure'
        this.notificationMessage = error
        setTimeout(() => { this.notificationMessage = false }, 3000);
      }
    },
    setTab(tab) {
      this.tab = tab
    },
    removeTeams() {
      let confirmRemoveTeams = confirm("Please confirm that you would like to remove the current set of teams.");
      if(confirmRemoveTeams) {
        this.teams = {}
        this.displayTeams = []
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
      this.displayBench.push(player)
      Vue.delete(this.displayPool, this.displayPool.findIndex(item => item.ID == playerID))
      this.saveDraftPool(this.draftPool)
      this.saveBench(this.bench)
      this.setBenchSort(this.benchSort, false)
    },
    removeManualBench(playerID) {
      let player = this.getPlayer(playerID)
      player.benched = false
      Vue.delete(this.manualBench, player.ID)
      Vue.delete(this.bench, player.ID)
      Vue.set(this.draftPool, player.ID, player)
      this.displayPool.push(player)
      Vue.delete(this.displayBench, this.displayBench.findIndex(item => item.ID == playerID))
      this.saveDraftPool(this.draftPool)
      this.saveBench(this.bench)
      this.setPoolSort(this.poolSort, false)
    },
    setMadeCut(playerID) {
      this.cuts.push(playerID)
      let encodedPlayers = JSON.stringify(Object.values(this.cuts))
      window.localStorage.setItem('draftCuts', encodedPlayers)
      this.$forceUpdate()
      this.getAllTeamCutCount()
    },
    setMissedCut(playerID) {
      let index = this.cuts.indexOf(playerID)
      if(index != -1){
        this.cuts.splice(index, 1)
     }
      let encodedPlayers = JSON.stringify(Object.values(this.cuts))
      window.localStorage.setItem('draftCuts', encodedPlayers)
      this.$forceUpdate()
      this.getAllTeamCutCount()
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
    getAllTeamCutCount() {
      for(const [key, team] of Object.entries(this.teams)){
        this.teams[key].teamCutCount = this.getTeamCutCount(team)
      }
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
          this.getAllTeamCutCount()
          this.getAllTeamPoints()
          setTimeout(() => { this.notificationMessage = false }, 5000);
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
      let exportObject = this.getExportData()
      exportData(exportObject)
    },
    getExportData() {
      let exportObject = {
        players: JSON.parse(JSON.stringify(this.players)),
        draftPool: JSON.parse(JSON.stringify(this.draftPool)),
        bench: JSON.parse(JSON.stringify(this.bench)),
        teams: JSON.parse(JSON.stringify(Object.values(this.teams))),
        manualBench: JSON.parse(JSON.stringify(this.manualBench)),
        cuts: JSON.parse(JSON.stringify(this.cuts)),
        settings: JSON.parse(JSON.stringify(this.settings))
      }
      return exportObject
    },
    importProgramData(data){
      this.importObjects(data.players, 'players')
      this.importObjects(data.draftPool, 'draftPool')
      this.importObjects(data.bench, 'bench')
      this.importObjects(data.manualBench, 'manualBench')
      this.importObjects(data.teams, 'teams')
      this.setPlayerSort(this.playersSort, false)
      this.setPoolSort(this.poolSort, false)
      this.setBenchSort(this.benchSort, false)
      this.setTeamSort(this.teamSort, false)
      this.settings = data.settings
      this.cuts = data.cuts
      this.getAllTeamCutCount()
    },
    async importAllData(event) {
      await importData(event)
      let data = this.loadFromStorage('dataImport')
      this.importProgramData(data)
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
    },
    saveDBEntry() {
      if(this.dbEntryName == '') {
        this.notificationType = 'failure'
        this.notificationMessage = 'To save record, datbase name must be set.'
        setTimeout(() => { this.notificationMessage = false }, 3000);
        return
      }

      let record = {
        uuid: this.database.getUUID(),
        name: this.dbEntryName,
        timestamp: Date.now(),
        data: this.getExportData()
      }
      this.database.insert(record)
      this.dbEntryName = ''
    },
    deleteDBEntry(uuid) {
      let confirmation = confirm('Please confirm you would like to delete Database record.')
      if(confirmation) {
        this.database.delete(uuid)
      }
    },
    unixTime(unixTime) {
      return new Date(unixTime).toLocaleDateString("en-US") + " " + new Date(unixTime).toLocaleTimeString("en-US")
    },
    loadDBEntry(uuid) {
      let data = this.database.select(uuid)
      if(data && data.data) {
        if(data.name) {
          this.dbEntryName = data.name
        }
        this.importProgramData(data.data)
        this.getAllTeamPoints()
        this.setTab('import-players')
      }
    },
    textSort(data, property, desc = 'true') {
      let propA = desc ? 1 : -1
      let propB = desc ? -1 : 1
      if(desc === 'true') {
        data.sort((a, b) => (a[property] > b[property]) ? propA : propB)
      } else {
        data.sort((a, b) => (a[property] > b[property]) ? propB : propA)
      }
      return data
    },
    numericSort(data, property, desc = 'true') {
      if(desc === 'true') {
        data.sort((a, b) => b[property] - a[property])
      } else {
        data.sort((b, a) => b[property] - a[property])
      }
      
      return data
    },
    sortPlayers() {
      let players = Object.values(this.players)
      if(this.playersSort == 'Name') {
        return this.textSort(players, this.playersSort, this.playersDesc)
      } else {
        return this.numericSort(players, this.playersSort, this.playersDesc)
      }
    },
    setPlayerSort(property, modifyDesc = true) {
      if(modifyDesc) {
        if(property == this.playersSort) {
          this.playersDesc =  this.playersDesc == 'false' ? 'true' : 'false'
        } else {
          this.playersDesc = 'true'
        }
      }
      
      this.playersSort = property
      this.displayPlayers = []
      let players = Object.values(this.players)
      if(this.playersSort == 'Name') {
        this.displayPlayers = this.textSort(players, this.playersSort, this.playersDesc)
      } else {
        this.displayPlayers = this.numericSort(players, this.playersSort, this.playersDesc)
      }
    },
    setPoolSort(property, modifyDesc = true) {
      if(modifyDesc) {
        if(property == this.poolSort) {
          this.poolDesc = this.poolDesc == 'false' ? 'true' : 'false'
        } else {
          this.poolDesc = 'true'
        }
      }
      this.poolSort = property
      this.displayPool = []
      let pool = Object.values(this.draftPool)
      if(this.poolSort == 'Name') {
        this.displayPool = this.textSort(pool, this.poolSort, this.poolDesc)
      } else {
        this.displayPool = this.numericSort(pool, this.poolSort, this.poolDesc)
      }
    },
    setBenchSort(property, modifyDesc = true) {
      if(modifyDesc) {
        if(property == this.benchSort) {
          this.benchDesc = this.benchDesc == 'false' ? 'true' : 'false'
        } else {
          this.benchDesc = 'true'
        }
      }
      this.benchSort = property
      this.displayBench = []
      let bench = Object.values(this.bench)
      if(this.benchSort == 'Name') {
        this.displayBench = this.textSort(bench, this.benchSort, this.benchDesc)
      } else {
        this.displayBench = this.numericSort(bench, this.benchSort, this.benchDesc)
      }
    },
    setTeamSort(property, modifyDesc = true) {
      if(modifyDesc) {
        if(property == this.teamSort) {
          this.teamDesc = this.teamDesc == 'false' ? 'true' : 'false'
        } else {
          this.teamDesc = 'true'
        }
      }
      this.teamSort = property
      this.displayTeams = []
      let team = Object.values(this.teams)
      this.displayTeams = this.numericSort(team, this.teamSort, this.teamDesc)
    },
    runCutReport() {
      this.reportType = 'cutReport'
      let cutReportData = {}
      Object.values(this.teams).forEach(team => {
        if(!cutReportData.hasOwnProperty(team.teamCutCount)) {
          cutReportData[team.teamCutCount] = 0
        }
        cutReportData[team.teamCutCount] += 1
      }) 
      this.cutReportData = cutReportData
    },
    saveReplacement(emitData) {
      let oldTeam = this.teams[emitData.teamID]
      let newPlayer = this.players[emitData.newPlayerID]

      let newTeam = new Team(this.settings.teamSize)
      newTeam.players = JSON.parse(JSON.stringify(oldTeam.players))
      delete newTeam.players[emitData.oldPlayerID]
      newTeam.players[newPlayer.ID] = newPlayer
      newTeam.setComputedValues()
      if(this.teams.hasOwnProperty(newTeam.id)) {
        this.notificationType = 'failure'
        this.notificationMessage = 'Team already exists.'
        setTimeout(() => { this.notificationMessage = false }, 3000);
      } else {
        this.teams[newTeam.id] = newTeam 
        this.highlightTeam = newTeam.id
        Vue.set(this.teams, newTeam.id, newTeam)
        Vue.delete(this.teams, oldTeam.id)
        this.getAllTeamCutCount()
        this.setTeamSort(this.teamSort, false)
        this.getCountPlayerTimesUsed()
        setTimeout(() => { this.highlightTeam = '' }, 2000);
        let encodedTeams = JSON.stringify(Object.values(this.teams))
        window.localStorage.setItem('draftTeams', encodedTeams)
      }
    },
    displayErrorMessage(message) {
      this.notificationType = 'failure'
      this.notificationMessage = message
      setTimeout(() => { this.notificationMessage = false }, 3000);
    },
    updatePlayerPoints(emitData) {
      let playerID = emitData.playerID
      let points = parseFloat(emitData.points)
      Vue.set(this.players[playerID], 'points', points)
      let encodedPlayers = JSON.stringify(Object.values(this.players))
      window.localStorage.setItem('fileContent', encodedPlayers)
      this.getAllTeamPoints()
      let encodedTeams = JSON.stringify(Object.values(this.teams))
      window.localStorage.setItem('draftTeams', encodedTeams)
      this.setPlayerSort(this.playersSort, false)
    },
    getTeamPoints(team) {
      let teamPoints = 0.0
      for(const [key, teamPlayer] of Object.entries(team.players)){
        let player = this.players[teamPlayer.ID]
        if(player.hasOwnProperty('points')) {
          let points = parseFloat(player.points) 
          if(!isNaN(points) && points > 0) {
            teamPoints += points
          }
        }
      }
      return teamPoints
    },
    getAllTeamPoints() {
      for(const [key, team] of Object.entries(this.teams)){
        this.teams[key].points = this.getTeamPoints(team)
      }
    },
    exportDB() {
      this.database.download()
    },
    reloadDatabase(result) {
      if(result) {
        this.database.load()
        this.notificationType = 'success'
        this.notificationMessage = 'New entries added.'
        setTimeout(() => { this.notificationMessage = false }, 3000);
      } else {
        this.notificationType = 'failure'
        this.notificationMessage = 'Invalid file or no new entries found.'
        setTimeout(() => { this.notificationMessage = false }, 3000);
      }
    },
    login() {
      firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION)
      .then(() => {
        return firebase.auth().signInWithEmailAndPassword(this.email, this.password)
      }).then(() => {
        this.loginError = ''
        this.email = ''
        this.password = ''
      })
      .catch((error) => {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        this.loginError = errorMessage
      });
    },
    logout() {
      firebase.auth().signOut().then(() => {
        this.setTab('login')
      }).catch((error) => {
        // An error happened.
      });
    }
  },
})
