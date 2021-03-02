function Database () {
    this.entries = {}
}

Database.prototype.load = function() {
    let data = window.localStorage.getItem('draftDatabase')
    if(data) {
        let parsedData = JSON.parse(data)
        this.entries = parsedData
    }
}

Database.prototype.persist = function() {
    let encodedDB = JSON.stringify(this.entries)
    window.localStorage.setItem('draftDatabase', encodedDB)
}

Database.prototype.insert = function(record) {
    Vue.set(this.entries, record.uuid, record)
    //this.entries[record.uuid] = record
    this.persist()
}

Database.prototype.delete = function(uuid) {
    if(this.entries[uuid]) {
        Vue.delete(this.entries, uuid)
        this.persist()
        //delete this.entries[uuid]
    }
}

Database.prototype.select = function(uuid) {
    if(this.entries[uuid]) {
        return this.entries[uuid]
    }
}

Database.prototype.getUUID = function() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
      );
}

Database.prototype.download = function() {
    return new Promise(resolve => {
        let data = window.localStorage.getItem('draftDatabase')
        let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(data);
        let dlAnchorElem = document.getElementById('downloadAnchorElem');
        let filename = "database_backup_" + Date.now() + ".json"
        dlAnchorElem.setAttribute("href",     dataStr     );
        dlAnchorElem.setAttribute("download", filename);
        dlAnchorElem.click();
        resolve(true)
    })
}

Database.prototype.importFromBackup = function (evt) {
    return new Promise(resolve => {
        let files = evt.target.files;
        if (!files.length) {
            alert('No file selected!');
            return;
        }
        let file = files[0];
        let reader = new FileReader();
        reader.onload = (event) => {
            this.load()
            let entries = Object.values(JSON.parse(event.target.result))
            let newEntryFound = false
            entries.forEach(entry => {
                if(!this.entries.hasOwnProperty(entry.uuid)) {
                    this.entries[entry.uuid] = entry
                    newEntryFound = true
                }
            })
            if(newEntryFound) {
                this.persist()
            }
            resolve(newEntryFound)
        };
        reader.readAsText(file);
    })
}