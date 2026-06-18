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

            console.log("CSV cargado:", res.data[0]);

            data = res.data.map(d => {

                const fecha = new Date(d.Fecha || d.fecha);

                return {
                    lat: parseFloat(d.Latitud || d.lat),
                    lon: parseFloat(d.Longitud || d.lon),
                    mag: parseFloat(d.Magnitud || d.magnitud),
                    depth: parseFloat(d.Profundidad || d.profundidad),
                    fecha: fecha
                };

            }).filter(d =>
                !isNaN(d.lat) &&
                !isNaN(d.lon) &&
                !isNaN(d.mag) &&
                d.fecha instanceof Date &&
                !isNaN(d.fecha)
            );

            cargarAnios();
            render();
        }
    });

    const btn = document.getElementById("btnFiltrar");
    if (btn) btn.onclick = render;
});


// =========================
// AÑOS
// =========================
function cargarAnios() {

    const years = [...new Set(data.map(d => d.fecha.getFullYear()))]
        .filter(Boolean)
        .sort((a, b) => a - b);

    const ini = document.getElementById("anioInicio");
    const fin = document.getElementById("anioFin");

    if (!ini || !fin) return;

    ini.innerHTML = "";
    fin.innerHTML = "";

    years.forEach(y => {
        ini.innerHTML += `<option value="${y}">${y}</option>`;
        fin.innerHTML += `<option value="${y}">${y}</option>`;
    });

    ini.value = years[0] || "";
    fin.value = years[years.length - 1] || "";
}


// =========================
// RENDER GENERAL
// =========================
function render() {

    const iniEl = document.getElementById("anioInicio");
    const finEl = document.getElementById("anioFin");

    if (!iniEl || !finEl) return;

    const ini = parseInt(iniEl.value);
    const fin = parseInt(finEl.value);

    const filtered = data.filter(d => {

        const y = d.fecha.getFullYear();

        if (isNaN(ini) || isNaN(fin)) return true;

        return y >= ini && y <= fin;
    });

    drawMap(filtered);
    drawTable(filtered);
    spearman(filtered);

    // ================= KPI =================
    const totalEl = document.getElementById("total");
    const magEl = document.getElementById("magProm");
    const profEl = document.getElementById("profProm");

    const mags = filtered.map(d => d.mag);
    const profs = filtered.map(d => d.depth);

    const avg = arr =>
        arr.reduce((a, b) => a + b, 0) / (arr.length || 1);

    if (totalEl) totalEl.innerText = filtered.length;
    if (magEl) magEl.innerText = avg(mags).toFixed(2);
    if (profEl) profEl.innerText = avg(profs).toFixed(2);
}


// =========================
// MAPA
// =========================
function drawMap(filtered) {

    markers.forEach(m => map.removeLayer(m));
    markers = [];

    filtered.forEach(d => {

        const color =
            d.mag >= 7 ? "red" :
            d.mag >= 6 ? "orange" :
            d.mag >= 5 ? "yellow" :
            "blue";

        const marker = L.circleMarker([d.lat, d.lon], {
            radius: Math.max(d.mag * 2, 3),
            color,
            fillOpacity: 0.7
        }).addTo(map);

        marker.bindPopup(`
            <b>Magnitud:</b> ${d.mag}<br>
            <b>Profundidad:</b> ${d.depth} km<br>
            <b>Fecha:</b> ${d.fecha.toLocaleString()}
        `);

        markers.push(marker);
    });
}


// =========================
// TABLA
// =========================
function drawTable(filtered) {

    const tbody = document.getElementById("tabla");
    if (!tbody) return;

    tbody.innerHTML = "";

    filtered.slice(0, 100).forEach(d => {

        tbody.innerHTML += `
            <tr>
                <td>${d.fecha ? d.fecha.toLocaleDateString() : "-"}</td>
                <td>${d.mag ?? "-"}</td>
                <td>${d.depth ?? "-"}</td>
            </tr>
        `;
    });
}


// =========================
// SPEARMAN
// =========================
function spearman(data) {

    const x = data.map(d => d.mag);
    const y = data.map(d => d.depth);

    if (x.length === 0) {
        document.getElementById("spearman").innerText = "Sin datos";
        return;
    }

    const rank = arr =>
        arr.map((v, i) => ({ v, i }))
            .sort((a, b) => a.v - b.v)
            .map((o, i) => ({ ...o, r: i + 1 }))
            .sort((a, b) => a.i - b.i)
            .map(o => o.r);

    const rx = rank(x);
    const ry = rank(y);

    let d2 = 0;

    for (let i = 0; i < x.length; i++) {
        d2 += Math.pow(rx[i] - ry[i], 2);
    }

    const n = x.length;

    const rho = 1 - (6 * d2) / (n * (n*n - 1));

    document.getElementById("spearman").innerText =
        isNaN(rho) ? "Sin datos" : rho.toFixed(4);
}
