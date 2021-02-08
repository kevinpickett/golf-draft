function generateTableHead(table, data) {
    let thead = table.createTHead();
    let row = thead.insertRow();
    for (let key of data) {
        let th = document.createElement("th");
        let text = document.createTextNode(parseInt(key) + 1);
        th.appendChild(text);
        row.appendChild(th);
    }
    let th = document.createElement("th");
    let text = document.createTextNode('Sum');
    th.appendChild(text);
    row.appendChild(th);
}

function generateTable(table, data) {
    for (let element of data) {
        let row = table.insertRow();
        let sum = 0
        for (key in element) {
            let cell = row.insertCell();
            let text = document.createTextNode(element[key].name + " (" + element[key].cost + ")");
            cell.appendChild(text);
            sum += parseInt(element[key].cost)
        }
        let cell = row.insertCell();
        let text = document.createTextNode(sum);
        cell.appendChild(text);
    }
}