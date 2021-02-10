function importCSV(evt) {
    return new Promise(resolve => {
        Papa.parse(evt.target.files[0], {
            header: true,
            complete: function(results) {
                inputData = results.data
                window.localStorage.setItem('fileContent', JSON.stringify(inputData))
                const fileName = document.querySelector('.file-name');
                fileName.textContent = evt.target.files[0].name;
                resolve('resolved');
            }
        });
    })
}

function importDataFromLocalStorage() {
    let possibleData = window.localStorage.getItem('fileContent')
    if(possibleData) {
        inputData = JSON.parse(possibleData)
    }
}

function exportData(data) {
    return new Promise(resolve => {
        let jsonData = JSON.stringify(data._data)
        let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(jsonData);
        let dlAnchorElem = document.getElementById('downloadAnchorElem');
        let filename = "draft_teams_backup_" + Date.now() + ".json"
        dlAnchorElem.setAttribute("href",     dataStr     );
        dlAnchorElem.setAttribute("download", filename);
        dlAnchorElem.click();
        resolve(true)
    })
}

function importData(evt) {
    return new Promise(resolve => {
        let files = evt.target.files;
        if (!files.length) {
            alert('No file selected!');
            return;
        }
        let file = files[0];
        let reader = new FileReader();
        reader.onload = (event) => {
            window.localStorage.setItem('dataImport', event.target.result)
            resolve(true)
        };
        reader.readAsText(file);
    })
}