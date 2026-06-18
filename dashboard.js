let datosOriginales = [];
let datosFiltrados = [];

// ===============================
// CARGA DEL CSV
// ===============================
document.addEventListener("DOMContentLoaded", () => {

    Papa.parse("SSNMX_catalogo_filtrado.csv", {
        download: true,
        header: true,
        skipEmptyLines: true,

        complete: function (resultado) {

            console.log("CSV cargado:", resultado);

            if (!resultado || !Array.isArray(resultado.data)) {
                console.error("CSV inválido");
                return;
            }

            // 🔥 NORMALIZAR DATOS (IMPORTANTE)
            datosOriginales = resultado.data
                .map(d => {

                    // Detectar fecha correctamente
                    const fechaRaw = d.Fecha || d.fecha || d.date;

                    const fechaObj = fechaRaw ? new Date(fechaRaw) : null;

                    return {
                        ...d,
                        _fecha: fechaObj,
                        _anio: fechaObj ? fechaObj.getFullYear() : null,
                        _magnitud: parseFloat(d.Magnitud || d.magnitud),
                        _profundidad: parseFloat(d.Profundidad || d.profundidad)
                    };
                })
                .filter(d => d._anio && d._anio >= 1981);

            console.log("Registros válidos:", datosOriginales.length);

            cargarAnios();
            aplicarFiltros();
        },

        error: function (error) {
            console.error("Error CSV:", error);
        }
    });

});


// ===============================
// CARGAR AÑOS EN SELECT
// ===============================
function cargarAnios() {

    const select = document.getElementById("selectAnios");

    if (!select) {
        console.warn("selectAnios no existe en el HTML");
        return;
    }

    const anios = [...new Set(datosOriginales.map(d => d._anio))]
        .filter(Boolean)
        .sort((a, b) => a - b);

    select.innerHTML = "<option value=''>Todos los años</option>";

    anios.forEach(anio => {
        const option = document.createElement("option");
        option.value = anio;
        option.textContent = anio;
        select.appendChild(option);
    });

    // evento cambio
    select.onchange = aplicarFiltros;
}


// ===============================
// APLICAR FILTROS
// ===============================
function aplicarFiltros() {

    const anio = document.getElementById("selectAnios")?.value;
    const magnitud = document.getElementById("filtroMagnitud")?.value;

    datosFiltrados = datosOriginales.filter(d => {

        let ok = true;

        if (anio) ok = ok && d._anio == anio;

        if (magnitud) ok = ok && d._magnitud >= parseFloat(magnitud);

        return ok;
    });

    actualizarKPIs();
    llenarTabla();
    actualizarGraficas();
}


// ===============================
// KPIs
// ===============================
function actualizarKPIs() {

    document.getElementById("total").textContent = datosFiltrados.length;

    const mags = datosFiltrados.map(d => d._magnitud).filter(Boolean);
    const profs = datosFiltrados.map(d => d._profundidad).filter(Boolean);

    const avg = arr => arr.reduce((a, b) => a + b, 0) / (arr.length || 1);

    document.getElementById("magnitudPromedio").textContent = avg(mags).toFixed(2);
    document.getElementById("profundidadPromedio").textContent = avg(profs).toFixed(2);
    document.getElementById("maxMagnitud").textContent = Math.max(...mags, 0).toFixed(2);
}


// ===============================
// TABLA
// ===============================
function llenarTabla() {

    const tbody = document.querySelector("#tablaSismos tbody");

    if (!tbody) return;

    tbody.innerHTML = "";

    datosFiltrados.slice(0, 200).forEach(d => {

        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${d._fecha ? d._fecha.toLocaleDateString() : "-"}</td>
            <td>${d._fecha ? d._fecha.toLocaleTimeString() : "-"}</td>
            <td>${d._magnitud || "-"}</td>
            <td>${d._profundidad || "-"}</td>
            <td>${d.Ubicacion || d.ubicacion || "-"}</td>
        `;

        tbody.appendChild(tr);
    });
}


// ===============================
// GRÁFICAS (BÁSICAS)
// ===============================
let chartAnual, chartMagnitud, chartProfundidad;

function actualizarGraficas() {

    // AGRUPAR POR AÑO
    const conteoAnios = {};

    datosFiltrados.forEach(d => {
        if (!d._anio) return;
        conteoAnios[d._anio] = (conteoAnios[d._anio] || 0) + 1;
    });

    const labels = Object.keys(conteoAnios);
    const values = Object.values(conteoAnios);

    if (chartAnual) chartAnual.destroy();

    chartAnual = new Chart(document.getElementById("graficaAnual"), {
        type: "line",
        data: {
            labels,
            datasets: [{
                label: "Sismos por año",
                data: values
            }]
        }
    });

    // MAGNITUD
    const mags = datosFiltrados.map(d => d._magnitud).filter(Boolean);

    if (chartMagnitud) chartMagnitud.destroy();

    chartMagnitud = new Chart(document.getElementById("graficaMagnitud"), {
        type: "bar",
        data: {
            labels: mags,
            datasets: [{
                label: "Magnitud",
                data: mags
            }]
        }
    });

    // PROFUNDIDAD
    const profs = datosFiltrados.map(d => d._profundidad).filter(Boolean);

    if (chartProfundidad) chartProfundidad.destroy();

    chartProfundidad = new Chart(document.getElementById("graficaProfundidad"), {
        type: "bar",
        data: {
            labels: profs,
            datasets: [{
                label: "Profundidad",
                data: profs
            }]
        }
    });
}
