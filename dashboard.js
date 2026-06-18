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

    complete: function (resultado) {
    datosOriginales = resultado.data.filter(d =>
    d.Anio && parseInt(d.Anio) >= 1981
);
        );

        console.log(
            "Registros válidos:",
            datosOriginales.length
        );

        cargarAnios();
        aplicarFiltros();
    },

    error: function (error) {
        console.error("Error al cargar el CSV:", error);
    }
});
