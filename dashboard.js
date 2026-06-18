let map;
let data = [];
let markers = [];

document.addEventListener("DOMContentLoaded", () => {

    map = L.map("map").setView([23.6, -102.5], 5);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "OpenStreetMap"
    }).addTo(map);

    Papa.parse("SSNMX_catalogo_filtrado.csv", {
        download: true,
        header: true,
        skipEmptyLines: true,

        complete: function(res) {

            data = res.data.map(d => {

                const fecha = new Date(d.Fecha || d.fecha);

                return {
                    lat: parseFloat(d.Latitud || d.lat),
                    lon: parseFloat(d.Longitud || d.lon),
                    mag: parseFloat(d.Magnitud || d.magnitud),
                    depth: parseFloat(d.Profundidad || d.profundidad),
                    fecha
                };

            }).filter(d =>
                !isNaN(d.lat) &&
                !isNaN(d.lon) &&
                !isNaN(d.mag)
            );

            cargarAnios();
            render();
        }
    });

    document.getElementById("btnFiltrar").onclick = render;
});

function cargarAnios() {

    const years = [...new Set(data.map(d => d.fecha.getFullYear()))].sort();

    const ini = document.getElementById("anioInicio");
    const fin = document.getElementById("anioFin");

    ini.innerHTML = "";
    fin.innerHTML = "";

    years.forEach(y => {
        ini.innerHTML += `<option value="${y}">${y}</option>`;
        fin.innerHTML += `<option value="${y}">${y}</option>`;
    });

    ini.value = years[0];
    fin.value = years[years.length - 1];
}

function render() {

    const ini = parseInt(document.getElementById("anioInicio").value);
    const fin = parseInt(document.getElementById("anioFin").value);

    const filtered = data.filter(d => {
        const y = d.fecha.getFullYear();
        return y >= ini && y <= fin;
    });

    // =========================
    // MAPA
    // =========================
    drawMap(filtered);

    // =========================
    // TABLA
    // =========================
    drawTable(filtered);

    // =========================
    // SPEARMAN
    // =========================
    spearman(filtered);

    // =========================
    // KPIs (SIDEBAR)
    // =========================
    document.getElementById("total").innerText = filtered.length;

    const mags = filtered.map(d => d.mag);
    const profs = filtered.map(d => d.depth);

    const avg = arr =>
        arr.reduce((a, b) => a + b, 0) / (arr.length || 1);

    document.getElementById("magProm").innerText =
        avg(mags).toFixed(2);

    document.getElementById("profProm").innerText =
        avg(profs).toFixed(2);
}

function drawTable(filtered) {

    const tbody = document.getElementById("tabla");
    tbody.innerHTML = "";

    filtered.slice(0, 100).forEach(d => {

        tbody.innerHTML += `
            <tr>
                <td>${d.fecha.toLocaleDateString()}</td>
                <td>${d.mag}</td>
                <td>${d.depth}</td>
            </tr>
        `;
    });
}

function spearman(data) {

    const x = data.map(d => d.mag);
    const y = data.map(d => d.depth);

    const rank = arr =>
        arr.map((v, i) => ({
            v,
            i
        }))
        .sort((a, b) => a.v - b.v)
        .map((o, i) => ({
            ...o,
            r: i + 1
        }))
        .sort((a, b) => a.i - b.i)
        .map(o => o.r);

    const rx = rank(x);
    const ry = rank(y);

    const n = x.length;

    let d2 = 0;

    for (let i = 0; i < n; i++) {
        d2 += Math.pow(rx[i] - ry[i], 2);
    }

    const rho = 1 - (6 * d2) / (n * (n*n - 1));

    document.getElementById("spearman").innerText =
        isNaN(rho) ? "Sin datos" : rho.toFixed(4);
}
