let data = [];
let filtered = [];

document.addEventListener("DOMContentLoaded", () => {

Papa.parse("SSNMX_catalogo_filtrado.csv", {
    download: true,
    header: true,
    skipEmptyLines: true,

    complete: function(res) {

        console.log("CSV cargado", res.data[0]);

        data = res.data.map(d => {

            const fecha = new Date(d.Fecha || d.fecha);

            return {
                fecha,
                anio: fecha.getFullYear(),
                mag: parseFloat(d.Magnitud || d.magnitud),
                prof: parseFloat(d.Profundidad || d.profundidad)
            };

        }).filter(d => !isNaN(d.mag) && d.fecha);

        init();
    }
});

function init() {
    cargarAnios();
    aplicarFiltros();

    document.getElementById("selectAnio").onchange = aplicarFiltros;
    document.getElementById("selectMag").onchange = aplicarFiltros;
}

function cargarAnios() {

    const sel = document.getElementById("selectAnio");

    const years = [...new Set(data.map(d => d.anio))].sort();

    sel.innerHTML = `<option value="">Todos los años</option>`;

    years.forEach(y => {
        sel.innerHTML += `<option value="${y}">${y}</option>`;
    });
}

function aplicarFiltros() {

    const anio = document.getElementById("selectAnio").value;
    const mag = parseFloat(document.getElementById("selectMag").value);

    filtered = data.filter(d => {

        let ok = true;

        if (anio) ok = d.anio == anio;
        if (mag) ok = ok && d.mag >= mag;

        return ok;
    });

    render();
}

function render() {

    document.getElementById("total").textContent = filtered.length;

    const mags = filtered.map(d => d.mag);
    const profs = filtered.map(d => d.prof);

    document.getElementById("magProm").textContent =
        (mags.reduce((a,b)=>a+b,0)/mags.length || 0).toFixed(2);

    document.getElementById("profProm").textContent =
        (profs.reduce((a,b)=>a+b,0)/profs.length || 0).toFixed(2);

    document.getElementById("maxMag").textContent =
        Math.max(...mags,0).toFixed(2);

    renderTable();
    renderChart();
}

function renderTable() {

    const tbody = document.getElementById("tabla");

    tbody.innerHTML = "";

    filtered.slice(0, 100).forEach(d => {

        tbody.innerHTML += `
            <tr>
                <td>${d.fecha.toLocaleDateString()}</td>
                <td>${d.mag}</td>
                <td>${d.prof}</td>
            </tr>
        `;
    });
}

let chart;

function renderChart() {

    const count = {};

    filtered.forEach(d => {
        count[d.anio] = (count[d.anio] || 0) + 1;
    });

    const labels = Object.keys(count);
    const values = Object.values(count);

    if (chart) chart.destroy();

    chart = new Chart(document.getElementById("chartAnio"), {
        type: "line",
        data: {
            labels,
            datasets: [{
                label: "Sismos por año",
                data: values
            }]
        }
    });
}

});
