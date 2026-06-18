let mapa;
let chartMagnitud;
let chartProfundidad;
let chartAnual;

let datosOriginales = [];
let datosFiltrados = [];

/* ====================================
   FUNCIÓN AUXILIAR (AÑO LIMPIO)
==================================== */

function obtenerAnio(fecha){

    if(!fecha) return null;

    const f = String(fecha).trim();
    const anio = f.substring(0,4);

    if(!anio || isNaN(anio)) return null;

    return anio;
}

/* ====================================
   INICIALIZACIÓN CORRECTA
==================================== */

document.addEventListener("DOMContentLoaded", () => {

    const filtroAnio = document.getElementById("filtroAnio");
    const filtroMagnitud = document.getElementById("filtroMagnitud");

    if(!filtroAnio || !filtroMagnitud){
        console.error("Faltan elementos HTML de filtros");
        return;
    }

    filtroAnio.addEventListener("change", aplicarFiltros);
    filtroMagnitud.addEventListener("change", aplicarFiltros);

    Papa.parse("datos/SSNMX_catalogo_filtrado.csv", {
        download: true,
        header: true,
        skipEmptyLines: true,

        complete: function(resultado){

            console.log("TOTAL REGISTROS:", resultado.data.length);

            datosOriginales = resultado.data;

            cargarAnios();
            aplicarFiltros();

        },

        error: function(error){
            console.error(error);
            alert("Error al cargar el CSV.");
        }
    });

});

/* ====================================
   CARGAR AÑOS EN FILTRO
==================================== */

function cargarAnios(){

    const filtro = document.getElementById("filtroAnio");

    filtro.innerHTML = '<option value="">Todos los años</option>';

    const anios = new Set();

    datosOriginales.forEach(d => {

        const anio = obtenerAnio(d.Fecha);

        if(anio && anio >= 1981 && anio <= 2026){
            anios.add(anio);
        }

    });

    [...anios]
    .sort((a,b)=>a-b)
    .forEach(anio => {

        const option = document.createElement("option");
        option.value = anio;
        option.textContent = anio;

        filtro.appendChild(option);

    });

    console.log("Años cargados:", [...anios]);
}

/* ====================================
   APLICAR FILTROS
==================================== */

function aplicarFiltros(){

    const anio = document.getElementById("filtroAnio").value;
    const magnitud = document.getElementById("filtroMagnitud").value;

    datosFiltrados = datosOriginales.filter(d => {

        let cumpleAnio = true;
        let cumpleMagnitud = true;

        if(anio){
            cumpleAnio = obtenerAnio(d.Fecha) === anio;
        }

        if(magnitud){
            cumpleMagnitud =
                parseFloat(d.Magnitud) >= parseFloat(magnitud);
        }

        return cumpleAnio && cumpleMagnitud;
    });

    procesarDatos(datosFiltrados);
}

/* ====================================
   KPIs
==================================== */

function procesarDatos(datos){

    if(!datos || datos.length === 0){
        console.warn("Sin datos");
        return;
    }

    const magnitudes = datos
        .map(d => parseFloat(d.Magnitud))
        .filter(n => !isNaN(n));

    const profundidades = datos
        .map(d => parseFloat(d.Profundidad))
        .filter(n => !isNaN(n));

    document.getElementById("total").innerText =
        datos.length.toLocaleString();

    const promedioMag = magnitudes.length
        ? magnitudes.reduce((a,b)=>a+b,0) / magnitudes.length
        : 0;

    const promedioProf = profundidades.length
        ? profundidades.reduce((a,b)=>a+b,0) / profundidades.length
        : 0;

    document.getElementById("magnitudPromedio").innerText =
        promedioMag.toFixed(2);

    document.getElementById("profundidadPromedio").innerText =
        promedioProf.toFixed(2);

    document.getElementById("maxMagnitud").innerText =
        magnitudes.length ? Math.max(...magnitudes) : 0;

    crearMapa(datos);
    crearTabla(datos);
    crearGraficaMagnitud(magnitudes);
    crearGraficaProfundidad(profundidades);
    crearGraficaAnual(datos);

    document.getElementById("resumen").innerHTML = `
        <strong>${datos.length.toLocaleString()}</strong>
        eventos sísmicos analizados.
        <br><br>
        Magnitud promedio: <strong>${promedioMag.toFixed(2)}</strong>
        <br>
        Profundidad promedio: <strong>${promedioProf.toFixed(2)} km</strong>
        <br>
        Magnitud máxima: <strong>${magnitudes.length ? Math.max(...magnitudes) : 0}</strong>
    `;
}

/* ====================================
   MAPA
==================================== */

function crearMapa(datos){

    if(mapa) mapa.remove();

    mapa = L.map("map").setView([23.6345,-102.5528], 5);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png")
    .addTo(mapa);

    datos.slice(0,300).forEach(d => {

        const lat = parseFloat(d.Latitud);
        const lon = parseFloat(d.Longitud);

        if(!isNaN(lat) && !isNaN(lon)){

            L.marker([lat,lon])
            .addTo(mapa)
            .bindPopup(`
                <b>Fecha:</b> ${d.Fecha}<br>
                <b>Magnitud:</b> ${d.Magnitud}<br>
                <b>Profundidad:</b> ${d.Profundidad} km<br>
                <b>Ubicación:</b><br>
                ${d["Referencia de localizacion"]}
            `);

        }

    });

}

/* ====================================
   TABLA
==================================== */

function crearTabla(datos){

    const tbody = document.querySelector("#tablaSismos tbody");

    tbody.innerHTML = "";

    datos.slice(0,100).forEach(d => {

        tbody.innerHTML += `
        <tr>
            <td>${d.Fecha || "-"}</td>
            <td>${d.Hora || "-"}</td>
            <td>${d.Magnitud || "-"}</td>
            <td>${d.Profundidad || "-"}</td>
            <td>${d["Referencia de localizacion"] || "-"}</td>
        </tr>
        `;

    });

}

/* ====================================
   GRAFICA MAGNITUDES
==================================== */

function crearGraficaMagnitud(magnitudes){

    if(chartMagnitud) chartMagnitud.destroy();

    chartMagnitud = new Chart(
        document.getElementById("graficaMagnitud"),
        {
            type:"bar",
            data:{
                labels: magnitudes.slice(0,30).map((_,i)=>i+1),
                datasets:[{
                    label:"Magnitud",
                    data:magnitudes.slice(0,30)
                }]
            }
        }
    );

}

/* ====================================
   GRAFICA PROFUNDIDADES
==================================== */

function crearGraficaProfundidad(profundidades){

    if(chartProfundidad) chartProfundidad.destroy();

    chartProfundidad = new Chart(
        document.getElementById("graficaProfundidad"),
        {
            type:"line",
            data:{
                labels: profundidades.slice(0,30).map((_,i)=>i+1),
                datasets:[{
                    label:"Profundidad",
                    data:profundidades.slice(0,30)
                }]
            }
        }
    );

}

/* ====================================
   GRAFICA ANUAL
==================================== */

function crearGraficaAnual(datos){

    const conteo = {};

    datos.forEach(d => {

        const anio = obtenerAnio(d.Fecha);
        if(!anio) return;

        conteo[anio] = (conteo[anio] || 0) + 1;

    });

    const labels = Object.keys(conteo).sort((a,b)=>a-b);
    const valores = labels.map(l => conteo[l]);

    if(chartAnual) chartAnual.destroy();

    chartAnual = new Chart(
        document.getElementById("graficaAnual"),
        {
            type:"bar",
            data:{
                labels,
                datasets:[{
                    label:"Sismos por Año",
                    data:valores
                }]
            }
        }
    );

}
