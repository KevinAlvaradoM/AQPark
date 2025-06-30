// Inicializar el mapa
var map = L.map('map-container').setView([-16.3972782, -71.5362979], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

/////////////////////////////////////////////////
////ubicaicon usurio

// Marcador personalizado para la ubicación del usuario
var userIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    shadowSize: [41, 41]
});

// Variable para almacenar el marcador del usuario
var userMarker = null;

// Mostrar y actualizar la ubicación del usuario en tiempo real
if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
        function(position) {
            var userLat = position.coords.latitude;
            var userLng = position.coords.longitude;

            // Si ya existe un marcador, actualizar su posición
            if (userMarker) {
                userMarker.setLatLng([userLat, userLng]);
            } else {
                // Crear un nuevo marcador para la ubicación del usuario
                userMarker = L.marker([userLat, userLng], { icon: userIcon }).addTo(map);
                userMarker.bindPopup('<b>¡Estás aquí!</b>').openPopup();
            }

            // Centrar el mapa en la ubicación del usuario (solo la primera vez)
            if (!map.getBounds().contains([userLat, userLng])) {
                map.setView([userLat, userLng], 13);
            }
        },
        function(error) {
            console.error('Error al obtener la ubicación:', error);
            alert('No se pudo obtener tu ubicación. Asegúrate de permitir el acceso a la geolocalización.');
        },
        {
            enableHighAccuracy: true, // Mayor precisión
            timeout: 10000, // Tiempo máximo de espera (10 segundos)
            maximumAge: 0 // No usar caché de ubicación
        }
    );
} else {
    alert('Tu navegador no soporta geolocalización.');
}
/////////////////////////////////////////////////

// Capa para los marcadores
var markersLayer = L.layerGroup().addTo(map);

// Variables para los filtros
var dataGlobal = [];
var categoriaSelect = document.getElementById('categoria-select');
var departamentoSelect = document.getElementById('departamento-select');
var provinciaSelect = document.getElementById('provincia-select');
var distritoSelect = document.getElementById('distrito-select');

// Cargar los datos JSON
fetch('https://script.google.com/macros/s/AKfycbwMIt10L78iavEjs1OE0vn50uEH_5H6x-4YhJouP8yNzHDKSjqp6lRMqBfLpxsE3nQzOw/exec')
    .then(response => response.json())
    .then(data => {
        dataGlobal = data; // Guardar datos globalmente
        populateFilters(data); // Poblar los filtros
        updateMarkers(data);   // Mostrar todos los marcadores inicialmente
    })
    .catch(error => console.error('Error al obtener los datos:', error));

// Función para poblar los filtros con opciones únicas
function populateFilters(data) {
    // Categorías únicas (asumiendo que "Categoría" existe en el JSON)
    var categorias = [...new Set(data.map(item => item.Categoría || 'Sin Categoría'))];
    categorias.forEach(cat => {
        var option = document.createElement('option');
        option.value = cat;
        option.text = cat;
        categoriaSelect.appendChild(option);
    });

    // Departamentos únicos
    var departamentos = [...new Set(data.map(item => item.Departamento))];
    departamentos.forEach(dep => {
        var option = document.createElement('option');
        option.value = dep;
        option.text = dep;
        departamentoSelect.appendChild(option);
    });

    // Provincias únicas
    var provincias = [...new Set(data.map(item => item.Provincia))];
    provincias.forEach(prov => {
        var option = document.createElement('option');
        option.value = prov;
        option.text = prov;
        provinciaSelect.appendChild(option);
    });

    // Distritos únicos (se actualizarán según provincia)
    updateDistritos(data);
}

// Actualizar distritos según la provincia seleccionada
function updateDistritos(data) {
    distritoSelect.innerHTML = '<option value="">Todos</option>'; // Resetear distritos
    var selectedProvincia = provinciaSelect.value;
    var distritos = [...new Set(data
        .filter(item => !selectedProvincia || item.Provincia === selectedProvincia)
        .map(item => item.Distrito))];
    distritos.forEach(dist => {
        var option = document.createElement('option');
        option.value = dist;
        option.text = dist;
        distritoSelect.appendChild(option);
    });
}

// Actualizar marcadores según los filtros
function updateMarkers(data) {
    markersLayer.clearLayers(); // Limpiar marcadores actuales
    var filteredData = data.filter(item => {
        var catMatch = !categoriaSelect.value || item.Categoría === categoriaSelect.value;
        var depMatch = !departamentoSelect.value || item.Departamento === departamentoSelect.value;
        var provMatch = !provinciaSelect.value || item.Provincia === provinciaSelect.value;
        var distMatch = !distritoSelect.value || item.Distrito === distritoSelect.value;
        return catMatch && depMatch && provMatch && distMatch;
    });

    filteredData.forEach(item => {
        var marker = L.marker([item.lat, item.lng]);
        marker.bindPopup(`
            <h6><b>${item.Nombre}</b></h6><br>
            ${item.Descripcion}<br>
            <b>Horario:</b> ${item.HorAten}<br>
            <b>Dirección:</b> ${item.Direccion}<br>
            <b>Precios</b><br>
            <b>Auto:</b> S/ ${item.PreAuto}<br>
            <b>Camioneta:</b> S/ ${item.PreCamioneta}<br>
            <b>Moto:</b> S/ ${item.PreMoto}<br>
            <b>Bicicleta:</b> S/ ${item.PreBicicleta}<br>
            <br>
            <div class="container text-center ">
            <div class="row">
                <div class="col ">
                <a class="btn btn-outline-success w-100" style="--bs-btn-padding-y: .25rem; --bs-btn-padding-x: .5rem; --bs-btn-font-size: .75rem;" href="${item.GoMaps}" target="_blank">Maps</a>
                </div>
                <div class="col">
                <a class="btn btn-outline-primary w-100" style="--bs-btn-padding-y: .25rem; --bs-btn-padding-x: .5rem; --bs-btn-font-size: .75rem;" href="${item.Waze}" target="_blank">Waze</a>
                </div>
            </div>
            </div>

            <br>
            <b style="font-size: 80%">Identificador: </b><span class="font-monospace" style="font-size: 80%" ><em>${item.ID}</em></span>
        `);
        markersLayer.addLayer(marker);
    });
}

// Event listeners para los filtros
categoriaSelect.addEventListener('change', () => updateMarkers(dataGlobal));
departamentoSelect.addEventListener('change', () => updateMarkers(dataGlobal));
provinciaSelect.addEventListener('change', () => {
    updateDistritos(dataGlobal);
    updateMarkers(dataGlobal);
});
distritoSelect.addEventListener('change', () => updateMarkers(dataGlobal));