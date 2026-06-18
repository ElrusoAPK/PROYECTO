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

```
download: true,
header: true,
skipEmptyLines: true,

complete: function(resultado){

    console.log("Columnas:", resultado.meta.fields);
    console.log("Registros CSV:", resultado.data.length);

    datosOriginales = resultado.data
    .map(d => {

        const fecha =
        (d.Fecha || "").trim();

        const anio =
        fecha.substring(0,4);

        return {

            Fecha: fecha,
            Anio: anio,
            Hora: (d.Hora || "").trim(),

            Magnitud:
            parseFloat(d.Magnitud) || 0,

            Profundidad:
            parseFloat(d.Profundidad) || 0,

            Referencia:
            (d["Referencia de localizacion"] || "")
            .trim()

        };

    })
    .filter(d =>

        d.Fecha &&
        d.Anio &&
        d.Magnitud >= 3 &&
        parseInt(d.Anio) >= 1981

    );

    console.log(
        "Registros válidos:",
        datosOriginales.length
    );

    cargarAnios();
    aplicarFiltros();

},

error: function(error){

    console.error(error);

    alert(
        "Error al cargar el archivo CSV."
    );

}
```

});
