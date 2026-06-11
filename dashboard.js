let mapa;
let chartMagnitud;
let chartProfundidad;
let chartAnual;

let datosOriginales = [];
let datosFiltrados = [];

/* ====================================
   CARGAR CSV AUTOMÁTICAMENTE
==================================== */

document.addEventListener("DOMContentLoaded", () => {

    Papa.parse(
        "datos/SSNMX_catalogo_19000601_20260602.csv",
        {
            download: true,
            header: true,
            skipEmptyLines: true,

            beforeFirstChunk: function(chunk){

                const lineas = chunk.split("\n");

                return lineas
                .slice(4)
                .join("\n");

            },

            complete: function(resultado){

                datosOriginales = resultado.data;

                cargarAnios();

                aplicarFiltros();

            },

            error: function(error){

                console.error(error);

                alert(
                    "Error al cargar el CSV."
                );

            }

        }

    );

});

/* ====================================
   CARGAR AÑOS EN FILTRO
==================================== */

function cargarAnios(){

    const filtro =
    document.getElementById(
    "filtroAnio"
    );

    filtro.innerHTML =
    '<option value="">Todos los años</option>';

    const anios = new Set();

    datosOriginales.forEach(d=>{

        if(!d.Fecha) return;

        anios.add(
        d.Fecha.substring(0,4)
        );

    });

    [...anios]
    .sort()
    .forEach(anio=>{

        filtro.innerHTML +=

        `<option value="${anio}">
            ${anio}
        </option>`;

    });

}

/* ====================================
   EVENTOS FILTROS
==================================== */

document
.getElementById("filtroAnio")
.addEventListener(
"change",
aplicarFiltros
);

document
.getElementById("filtroMagnitud")
.addEventListener(
"change",
aplicarFiltros
);

/* ====================================
   APLICAR FILTROS
==================================== */

function aplicarFiltros(){

    const anio =
    document.getElementById(
    "filtroAnio"
    ).value;

    const magnitud =
    document.getElementById(
    "filtroMagnitud"
    ).value;

    datosFiltrados =
    datosOriginales.filter(d=>{

        let cumpleAnio = true;
        let cumpleMagnitud = true;

        if(anio){

            cumpleAnio =
            d.Fecha &&
            d.Fecha.startsWith(anio);

        }

        if(magnitud){

            cumpleMagnitud =
            parseFloat(d.Magnitud) >=
            parseFloat(magnitud);

        }

        return (
            cumpleAnio &&
            cumpleMagnitud
        );

    });

    procesarDatos(
    datosFiltrados
    );

}

/* ====================================
   KPIs
==================================== */

function procesarDatos(datos){

    const magnitudes =
    datos
    .map(d=>parseFloat(d.Magnitud))
    .filter(n=>!isNaN(n));

    const profundidades =
    datos
    .map(d=>parseFloat(d.Profundidad))
    .filter(n=>!isNaN(n));

    document
    .getElementById("total")
    .innerText =
    datos.length.toLocaleString();

    const promedioMag =
    magnitudes.length
    ?
    magnitudes.reduce((a,b)=>a+b,0)
    /
    magnitudes.length
    :
    0;

    const promedioProf =
    profundidades.length
    ?
    profundidades.reduce((a,b)=>a+b,0)
    /
    profundidades.length
    :
    0;

    document
    .getElementById(
    "magnitudPromedio"
    )
    .innerText =
    promedioMag.toFixed(2);

    document
    .getElementById(
    "profundidadPromedio"
    )
    .innerText =
    promedioProf.toFixed(2);

    document
    .getElementById(
    "maxMagnitud"
    )
    .innerText =
    magnitudes.length
    ?
    Math.max(...magnitudes)
    :
    0;

    crearMapa(datos);

    crearTabla(datos);

    crearGraficaMagnitud(
    magnitudes
    );

    crearGraficaProfundidad(
    profundidades
    );

    crearGraficaAnual(
    datos
    );

    document
    .getElementById(
    "resumen"
    )
    .innerHTML =

    `
    <strong>
    ${datos.length.toLocaleString()}
    </strong>

    eventos sísmicos analizados.

    <br><br>

    Magnitud promedio:
    <strong>
    ${promedioMag.toFixed(2)}
    </strong>

    <br>

    Profundidad promedio:
    <strong>
    ${promedioProf.toFixed(2)} km
    </strong>

    <br>

    Magnitud máxima:
    <strong>
    ${magnitudes.length ?
    Math.max(...magnitudes)
    : 0}
    </strong>
    `;

}

/* ====================================
   MAPA
==================================== */

function crearMapa(datos){

    if(mapa){

        mapa.remove();

    }

    mapa =
    L.map("map")
    .setView(
    [23.6345,-102.5528],
    5
    );

    L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    ).addTo(mapa);

    datos
    .slice(0,300)
    .forEach(d=>{

        const lat =
        parseFloat(d.Latitud);

        const lon =
        parseFloat(d.Longitud);

        if(
            !isNaN(lat) &&
            !isNaN(lon)
        ){

            L.marker(
            [lat,lon]
            )
            .addTo(mapa)
            .bindPopup(

            `<b>Fecha:</b> ${d.Fecha}<br>
             <b>Magnitud:</b> ${d.Magnitud}<br>
             <b>Profundidad:</b> ${d.Profundidad} km<br>
             <b>Ubicación:</b><br>
             ${d["Referencia de localizacion"]}`

            );

        }

    });

}

/* ====================================
   TABLA
==================================== */

function crearTabla(datos){

    const tbody =
    document.querySelector(
    "#tablaSismos tbody"
    );

    tbody.innerHTML = "";

    datos
    .slice(0,100)
    .forEach(d=>{

        tbody.innerHTML +=

        `
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

    if(chartMagnitud)
    chartMagnitud.destroy();

    chartMagnitud =
    new Chart(

        document.getElementById(
        "graficaMagnitud"
        ),

        {

            type:"bar",

            data:{

                labels:
                magnitudes
                .slice(0,30)
                .map((_,i)=>i+1),

                datasets:[{

                    label:
                    "Magnitud",

                    data:
                    magnitudes
                    .slice(0,30)

                }]

            }

        }

    );

}

/* ====================================
   GRAFICA PROFUNDIDADES
==================================== */

function crearGraficaProfundidad(profundidades){

    if(chartProfundidad)
    chartProfundidad.destroy();

    chartProfundidad =
    new Chart(

        document.getElementById(
        "graficaProfundidad"
        ),

        {

            type:"line",

            data:{

                labels:
                profundidades
                .slice(0,30)
                .map((_,i)=>i+1),

                datasets:[{

                    label:
                    "Profundidad",

                    data:
                    profundidades
                    .slice(0,30)

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

    datos.forEach(d=>{

        if(!d.Fecha) return;

        const anio =
        d.Fecha.substring(0,4);

        conteo[anio] =
        (conteo[anio] || 0) + 1;

    });

    const labels =
    Object.keys(conteo);

    const valores =
    Object.values(conteo);

    if(chartAnual)
    chartAnual.destroy();

    chartAnual =
    new Chart(

        document.getElementById(
        "graficaAnual"
        ),

        {

            type:"bar",

            data:{

                labels,

                datasets:[{

                    label:
                    "Sismos por Año",

                    data:
                    valores

                }]

            }

        }

    );

}