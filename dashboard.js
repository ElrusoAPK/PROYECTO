let chartMagnitud;
let chartProfundidad;
let chartAnual;

let datosOriginales = [];
let datosFiltrados = [];

// ===============================
// VARIABLES GLOBALES
// ===============================
let datosOriginales = [];
let datosFiltrados = [];

// ===============================
// FUNCIÓN cargarAnios (AQUÍ VA)
// ===============================
function cargarAnios() {
    const select = document.getElementById("selectAnios");

    if (!select) {
        console.warn("No existe el select de años");
        return;
    }

    const anios = [...new Set(datosOriginales.map(d => d.Anio))]
        .filter(a => a && !isNaN(a))
        .sort((a, b) => a - b);

    select.innerHTML = "<option value=''>Todos</option>";

    anios.forEach(anio => {
        const option = document.createElement("option");
        option.value = anio;
        option.textContent = anio;
        select.appendChild(option);
    });
}

/* ====================================
   CARGAR CSV
==================================== */
Papa.parse("SSNMX_catalogo_filtrado.csv", {
    download: true,
    header: true,
    skipEmptyLines: true,

    // 🔴 AQUÍ VA TU complete
    complete: function (resultado) {

        console.log("CSV cargado:", resultado);

        if (!resultado || !Array.isArray(resultado.data)) {
            console.error("Datos inválidos del CSV");
            return;
        }

        datosOriginales = resultado.data.filter(d =>
            d && d.Anio && !isNaN(parseInt(d.Anio)) && parseInt(d.Anio) >= 1981
        );

        console.log("Registros válidos:", datosOriginales.length);

        if (typeof cargarAnios === "function") cargarAnios();
        if (typeof aplicarFiltros === "function") aplicarFiltros();
    },

    error: function (error) {
        console.error("Error al cargar el CSV:", error);
    }
});

