document.addEventListener("DOMContentLoaded", () => {

```
let chartMagnitud;
let chartProfundidad;
let chartAnual;

let datosOriginales = [];
let datosFiltrados = [];

/* ====================================
   CARGAR CSV
==================================== */

Papa.parse("SSNMX_catalogo_filtrado.csv", {

    download: true,
    header: true,
    skipEmptyLines: true,

    complete: function(resultado){

        console.log("Columnas:", resultado.meta.fields);
        console.log("Registros CSV:", resultado.data.length);

        datosOriginales = resultado.data
        .map(d => ({

            Fecha: (d.Fecha || "").trim(),
            Hora: (d.Hora || "").trim(),
            Magnitud: parseFloat(d.Magnitud),
            Profundidad: parseFloat(d.Profundidad),

            Referencia:
                d["Referencia de localizacion"] ||
                ""

        }))
        .filter(d =>
            d.Fecha &&
            !isNaN(d.Magnitud)
        );

        console.log("Registros válidos:", datosOriginales.length);

        cargarAnios();
        aplicarFiltros();

    },

    error: function(error){

        console.error(error);

        alert(
            "Error al cargar el archivo CSV."
        );

    }

});

/* ====================================
   EVENTOS
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
   CARGAR AÑOS
==================================== */

function cargarAnios(){

    const filtro =
    document.getElementById(
        "filtroAnio"
    );

    filtro.innerHTML =
    '<option value="">Todos los años</option>';

    const anios = new Set();

    datosOriginales.forEach(d => {

        if(!d.Fecha) return;

        const anio =
        d.Fecha.substring(0,4);

        anios.add(anio);

    });

    [...anios]
    .sort()
    .forEach(anio => {

        filtro.innerHTML +=
        `<option value="${anio}">
            ${anio}
        </option>`;

    });

}

/* ====================================
   FILTROS
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
    datosOriginales.filter(d => {

        let cumpleAnio = true;
        let cumpleMagnitud = true;

        if(anio){

            cumpleAnio =
            d.Fecha.startsWith(anio);

        }

        if(magnitud){

            cumpleMagnitud =
            d.Magnitud >=
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
    datos.map(d => d.Magnitud);

    const profundidades =
    datos.map(d => d.Profundidad);

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
    .getElementById("magnitudPromedio")
    .innerText =
    promedioMag.toFixed(2);

    document
    .getElementById("profundidadPromedio")
    .innerText =
    promedioProf.toFixed(2);

    document
    .getElementById("maxMagnitud")
    .innerText =
    magnitudes.length
    ?
    Math.max(...magnitudes)
    :
    0;

    crearTabla(datos);
    crearGraficaMagnitud(magnitudes);
    crearGraficaProfundidad(profundidades);
    crearGraficaAnual(datos);

    document
    .getElementById("resumen")
    .innerHTML = `

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
    ${magnitudes.length ? Math.max(...magnitudes) : 0}
    </strong>

    `;

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
    .sort(
        (a,b)=>
        b.Magnitud-a.Magnitud
    )
    .slice(0,100)
    .forEach(d => {

        tbody.innerHTML +=

        `<tr>
            <td>${d.Fecha}</td>
            <td>${d.Hora}</td>
            <td>${d.Magnitud}</td>
            <td>${d.Profundidad}</td>
            <td>${d.Referencia}</td>
        </tr>`;

    });

}

/* ====================================
   GRAFICA MAGNITUD
==================================== */

function crearGraficaMagnitud(magnitudes){

    const rangos = {
        "3-4":0,
        "4-5":0,
        "5-6":0,
        "6-7":0,
        "7+":0
    };

    magnitudes.forEach(m => {

        if(m < 4)
            rangos["3-4"]++;

        else if(m < 5)
            rangos["4-5"]++;

        else if(m < 6)
            rangos["5-6"]++;

        else if(m < 7)
            rangos["6-7"]++;

        else
            rangos["7+"]++;

    });

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
                labels:Object.keys(rangos),
                datasets:[{
                    label:"Cantidad",
                    data:Object.values(rangos)
                }]
            }
        }
    );

}

/* ====================================
   GRAFICA PROFUNDIDAD
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
                .slice(0,100)
                .map((_,i)=>i+1),

                datasets:[{
                    label:"Profundidad",
                    data:
                    profundidades
                    .slice(0,100)
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

        const anio =
        d.Fecha.substring(0,4);

        conteo[anio] =
        (conteo[anio] || 0) + 1;

    });

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
                labels:Object.keys(conteo),
                datasets:[{
                    label:"Sismos por Año",
                    data:Object.values(conteo)
                }]
            }
        }
    );

}
```

});
