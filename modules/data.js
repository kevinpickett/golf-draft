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