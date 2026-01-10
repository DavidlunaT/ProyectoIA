import divisionPolitica from './division_politica.json';
import coordsParroquias from './coords_parroquias.json';

// Función auxiliar para convertir texto a Título (ej: "GUAYAS" -> "Guayas")
const toTitleCase = (str) => {
  if (!str) return "";
  return str.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
};

// Procesar los JSONs para generar la estructura de datos
const generateProvinciasData = () => {
  const data = {};

  Object.values(divisionPolitica).forEach(provItem => {
    if (!provItem.provincia) return;
    
    const nombreProvincia = toTitleCase(provItem.provincia);
    const cantonesList = [];

    if (provItem.cantones) {
      Object.values(provItem.cantones).forEach(cantonItem => {
        const nombreCanton = toTitleCase(cantonItem.canton);
        const parroquiasList = [];
        
        let latSum = 0;
        let lngSum = 0;
        let count = 0;
        let cabeceraFound = false;
        let latCabecera = 0;
        let lngCabecera = 0;

        if (cantonItem.parroquias) {
          Object.entries(cantonItem.parroquias).forEach(([id, nombre]) => {
            const nombreParroquia = toTitleCase(nombre);
            parroquiasList.push(nombreParroquia);

            // Buscar coordenadas en el segundo JSON usando el ID
            const coord = coordsParroquias[id];
            if (coord) {
              // Acumular para promedio
              latSum += coord.lat;
              lngSum += coord.lon;
              count++;

              // Intentar encontrar la cabecera cantonal (usualmente mismo nombre que cantón)
              // o si el ID termina en 50 (estándar INEC para cabeceras)
              if (nombreParroquia === nombreCanton || id.endsWith('50')) {
                latCabecera = coord.lat;
                lngCabecera = coord.lon;
                cabeceraFound = true;
              }
            }
          });
        }

        // Determinar coordenada del cantón: Prioridad Cabecera > Promedio > 0
        let finalLat = 0;
        let finalLng = 0;

        if (cabeceraFound) {
          finalLat = latCabecera;
          finalLng = lngCabecera;
        } else if (count > 0) {
          finalLat = latSum / count;
          finalLng = lngSum / count;
        }

        cantonesList.push({
          nombre: nombreCanton,
          lat: finalLat,
          lng: finalLng,
          parroquias: parroquiasList.sort()
        });
      });
    }

    // Ordenar cantones alfabéticamente
    cantonesList.sort((a, b) => a.nombre.localeCompare(b.nombre));

    data[nombreProvincia] = {
      cantones: cantonesList
    };
  });

  return data;
};

// Generamos la data una sola vez
export const provinciasData = generateProvinciasData();

// --- Funciones exportadas (API original mantenida) ---

export const getProvincias = () => Object.keys(provinciasData).sort();

export const getCantones = (provincia) => {
  const data = provinciasData[provincia];
  return data ? data.cantones : [];
};

export const getParroquias = (provincia, canton) => {
  const cantones = getCantones(provincia);
  const cantonData = cantones.find(c => c.nombre === canton);
  return cantonData ? cantonData.parroquias : [];
};

export const validateProvinciaCantonCombo = (provincia, canton) => {
  const cantones = getCantones(provincia);
  return cantones.some(c => c.nombre === canton);
};

export const getCoordinates = (provincia, canton) => {
  const cantones = getCantones(provincia);
  const cantonData = cantones.find(c => c.nombre === canton);
  return cantonData ? { lat: cantonData.lat, lng: cantonData.lng } : null;
};

export const getDays = () => Array.from({ length: 31 }, (_, i) => i + 1);

export const months = [
  { value: 1, label: "Enero" }, { value: 2, label: "Febrero" },
  { value: 3, label: "Marzo" }, { value: 4, label: "Abril" },
  { value: 5, label: "Mayo" }, { value: 6, label: "Junio" },
  { value: 7, label: "Julio" }, { value: 8, label: "Agosto" },
  { value: 9, label: "Septiembre" }, { value: 10, label: "Octubre" },
  { value: 11, label: "Noviembre" }, { value: 12, label: "Diciembre" }
];

export default provinciasData;