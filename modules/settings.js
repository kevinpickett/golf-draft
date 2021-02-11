function Settings () {
    this.lowerLimit = ''
    this.upperLimit = ''
    this.teamSize = ''
    this.teamCount = ''
    this.minSalary = ''
    this.maxSalary = ''
    this.minPointsPerGame = ''
    this.minTeamAveragePoints = ''
    this.maxTeamDifferential = ''
    this.playerUsageLimit = ''
    this.loadSettings()
    
    this.requiredSettings = [
        'lowerLimit',
        'upperLimit',
        'teamSize',
        'teamCount',
    ]

    this.intRules = [
        'lowerLimit',
        'upperLimit',
        'teamSize',
        'teamCount',
        'minSalary',
        'maxSalary',
        'maxTeamDifferential',
        'playerUsageLimit'
    ]

    this.saveAbleProps = [
        'lowerLimit',
        'upperLimit',
        'teamSize',
        'teamCount',
        'minSalary',
        'maxSalary',
        'maxTeamDifferential',
        'playerUsageLimit',
        'minPointsPerGame',
        'minTeamAveragePoints'
    ]

    this.floatRules = [
        'minPointsPerGame',
        'minTeamAveragePoints'
    ]

    this.validationMessage = ''
    this.isValid = false
}

Settings.prototype.validate = function() {
    if(!this.validateRequired()) {
        return false
    }

    if(!this.validateIntegerRules()) {
        return false
    }

    if(!this.validateFloatRules()) {
        return false
    }

    return true
}

Settings.prototype.validateRequired = function() {
    let unsetRequiredRules = []
    this.requiredSettings.forEach(rule => {
        if(this[rule] == '' || this[rule] == null || this[rule] == 'undefined') {
            unsetRequiredRules.push(rule)
        }
    })
    let result = unsetRequiredRules.length == 0
    if(!result) {
        this.validationMessage = 'The following required rules are not set or are invalid: ' + unsetRequiredRules.toString()
    } else {
        this.validationMessage = ''
    }
    return result
}

Settings.prototype.validateIntegerRules = function() {
    this.intRules.forEach(rule => {
        if(!this.isValidInteger(rule)) {
            return false
        }
    })
    return true
}

Settings.prototype.validateFloatRules = function() {
    this.floatRules.forEach(rule => {
        if(!this.isValidFloat(rule)) {
            return false
        }
    })
    return true
}

Settings.prototype.isValidInteger = function(rule) {
    let isValid = true
    if(this[rule] != 0 && this[rule] != '' && this[rule] != 'undefined') {
        if(typeof this[rule] == 'int' || this[rule] > 0) {
            isValid = true
            this.validationMessage = ''
        } else {
            this.validationMessage = 'Rule: "' + rule + '" - Not a valid positive whole number'
            isValid = false
        }
    }
    
    this.isValid = isValid
    return isValid
}

Settings.prototype.isValidFloat = function(rule) {
    let isValid = true
    if(this[rule] != 0 && this[rule] != '' && this[rule] != 'undefined') {
        if(typeof this[rule] == 'float' || this[rule] > 0) {
            isValid = true
            this.validationMessage = ''
        } else {
            this.validationMessage = 'Rule: "' + rule + '" - Not a valid positive number'
            isValid = false
        }
    }
    
    this.isValid = isValid
    return isValid
}

Settings.prototype.loadSettings = function() {
    let parsedData = {}
    let data = window.localStorage.getItem('draftSettings')
    if(data) {
        parsedData = JSON.parse(data)
    }

    this.mapSettings(parsedData)
}

Settings.prototype.saveSettings = function(settings = {}) {
    this.mapSettings(settings)
    if(this.validate()) {
        this.storeSettings()
        return true
    } else {
        return false
    }
}

Settings.prototype.mapSettings = function(settings = {}) {
    this.lowerLimit = settings.lowerLimit && !isNaN(parseInt(settings.lowerLimit)) ? parseInt(settings.lowerLimit) : ''
    this.upperLimit = settings.upperLimit && !isNaN(parseInt(settings.upperLimit)) ? parseInt(settings.upperLimit) : ''
    this.teamSize = settings.teamSize && !isNaN(parseInt(settings.teamSize)) ? parseInt(settings.teamSize) : ''
    this.teamCount = settings.teamCount && !isNaN(parseInt(settings.teamCount))? parseInt(settings.teamCount) : ''
    this.minSalary = settings.minSalary && !isNaN(parseInt(settings.minSalary)) ? parseInt(settings.minSalary) : ''
    this.maxSalary = settings.maxSalary && !isNaN(parseInt(settings.maxSalary)) ? parseInt(settings.maxSalary) : ''
    this.minPointsPerGame = settings.minPointsPerGame && !isNaN(parseFloat(settings.minPointsPerGame)) ? parseFloat(settings.minPointsPerGame) : ''
    this.minTeamAveragePoints = settings.minTeamAveragePoints && !isNaN(parseFloat(settings.minTeamAveragePoints)) ? parseFloat(settings.minTeamAveragePoints) : ''
    this.maxTeamDifferential = settings.maxTeamDifferential && !isNaN(parseInt(settings.maxTeamDifferential)) ? parseInt(settings.maxTeamDifferential) : ''
    this.playerUsageLimit = settings.playerUsageLimit && !isNaN(parseInt(settings.playerUsageLimit)) ? parseInt(settings.playerUsageLimit) : ''
}

Settings.prototype.storeSettings = function() {
    let settings = {}
    this.saveAbleProps.forEach(settingName => {
        settings[settingName] = this[settingName]
    })
    let encodedSettings = JSON.stringify(settings)
    window.localStorage.setItem('draftSettings', encodedSettings)
    return true
}