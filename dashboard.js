let map;
let data = [];
let markers = [];

document.addEventListener("DOMContentLoaded", () => {

    // MAPA BASE
    map = L.map('map').setView([23.6, -102.5], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    // CARGAR CSV
    Papa.parse("SSNMX_catalogo_filtrado.csv", {
        download: true,
        header: true,
        skipEmptyLines: true,

        complete: function(res) {

            data = res.data.map(d => {

                const lat = parseFloat(d.Latitud || d.lat);
                const lon = parseFloat(d.Longitud || d.lon);

                const mag = parseFloat(d.Magnitud || d.magnitud);
                const depth = parseFloat(d.Profundidad || d.profundidad);

                const fecha = new Date(d.Fecha || d.fecha);

                return {
                    lat,
                    lon,
                    mag,
                    depth,
                    fecha
                };

            }).filter(d =>
                !isNaN(d.lat) &&
                !isNaN(d.lon) &&
                !isNaN(d.mag)
            );

            cargarAnios();
            renderMarkers();
        }
    });

    document.getElementById("filtroMag").onchange = renderMarkers;
    document.getElementById("filtroAnio").onchange = renderMarkers;
});

function cargarAnios() {

    const sel = document.getElementById("filtroAnio");

    const years = [...new Set(data.map(d => d.fecha.getFullYear()))].sort();

    sel.innerHTML = `<option value="">Todos los años</option>`;

    years.forEach(y => {
        sel.innerHTML += `<option value="${y}">${y}</option>`;
    });
}

function renderMarkers() {

    markers.forEach(m => map.removeLayer(m));
    markers = [];

    const magFilter = parseFloat(document.getElementById("filtroMag").value);
    const yearFilter = document.getElementById("filtroAnio").value;

    data.forEach(d => {

        if (magFilter && d.mag < magFilter) return;
        if (yearFilter && d.fecha.getFullYear() != yearFilter) return;

        const color =
            d.mag >= 7 ? "red" :
            d.mag >= 6 ? "orange" :
            d.mag >= 5 ? "yellow" :
            "blue";

        const marker = L.circleMarker([d.lat, d.lon], {
            radius: d.mag * 2,
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
