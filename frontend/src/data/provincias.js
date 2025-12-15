/**
 * Datos de provincias, cantones y parroquias de Ecuador
 * Incluye coordenadas geográficas para cada cantón
 */

export const provinciasData = {
  "Guayas": {
    cantones: [
      { 
        nombre: "Guayaquil", 
        lat: -2.1894, 
        lng: -79.8891,
        parroquias: ["Tarqui", "Ximena", "Febres-Cordero", "Letamendi", "Urdaneta", "Sucre", "Ayacucho", "Roca", "Olmedo", "García Moreno", "Pascuales", "Chongón"]
      },
      { 
        nombre: "Durán", 
        lat: -2.1678, 
        lng: -79.8311,
        parroquias: ["Eloy Alfaro", "El Recreo", "Divino Niño"]
      },
      { 
        nombre: "Samborondón", 
        lat: -1.9633, 
        lng: -79.7239,
        parroquias: ["Samborondón", "La Puntilla", "Tarifa"]
      },
      { 
        nombre: "Daule", 
        lat: -1.8614, 
        lng: -79.9781,
        parroquias: ["Daule", "La Aurora", "Satélite", "Los Lojas", "Juan Bautista Aguirre"]
      },
      { 
        nombre: "Milagro", 
        lat: -2.1347, 
        lng: -79.5872,
        parroquias: ["Milagro", "Chobo", "Mariscal Sucre", "Roberto Astudillo"]
      }
    ]
  },
  "Pichincha": {
    cantones: [
      { 
        nombre: "Quito", 
        lat: -0.1807, 
        lng: -78.4678,
        parroquias: ["La Mariscal", "Centro Histórico", "La Carolina", "Cotocollao", "Chillogallo", "Guamaní", "Turubamba", "Calderón", "Pomasqui", "San Antonio", "Conocoto", "Tumbaco"]
      },
      { 
        nombre: "Cayambe", 
        lat: 0.0389, 
        lng: -78.1422,
        parroquias: ["Cayambe", "Ayora", "Juan Montalvo", "Cangahua", "Olmedo", "Santa Rosa de Cusubamba"]
      },
      { 
        nombre: "Rumiñahui", 
        lat: -0.3128, 
        lng: -78.4428,
        parroquias: ["Sangolquí", "San Rafael", "San Pedro de Taboada", "Cotogchoa", "Rumipamba"]
      },
      { 
        nombre: "Mejía", 
        lat: -0.5167, 
        lng: -78.5500,
        parroquias: ["Machachi", "Aloasí", "Aloag", "Cutuglahua", "El Chaupi", "Manuel Cornejo Astorga", "Tambillo", "Uyumbicho"]
      },
      { 
        nombre: "Pedro Moncayo", 
        lat: 0.0833, 
        lng: -78.2667,
        parroquias: ["Tabacundo", "La Esperanza", "Malchinguí", "Tocachi", "Tupigachi"]
      }
    ]
  },
  "Azuay": {
    cantones: [
      { 
        nombre: "Cuenca", 
        lat: -2.9001, 
        lng: -79.0059,
        parroquias: ["El Sagrario", "Gil Ramírez Dávalos", "San Sebastián", "El Batán", "Yanuncay", "Bellavista", "Totoracocha", "Monay", "Machángara", "Hermano Miguel", "El Vecino", "Cañaribamba"]
      },
      { 
        nombre: "Gualaceo", 
        lat: -2.8833, 
        lng: -78.7833,
        parroquias: ["Gualaceo", "Daniel Córdova Toral", "Jadán", "Mariano Moreno", "Zhidmad", "Luis Cordero Vega", "Remigio Crespo Toral", "San Juan"]
      },
      { 
        nombre: "Paute", 
        lat: -2.7833, 
        lng: -78.7500,
        parroquias: ["Paute", "Bulán", "Chicán", "El Cabo", "Guarainag", "San Cristóbal", "Tomebamba", "Dugdug"]
      },
      { 
        nombre: "Sigsig", 
        lat: -3.0500, 
        lng: -78.7833,
        parroquias: ["Sigsig", "Cuchil", "Guel", "Ludo", "San Bartolomé", "San José de Raranga", "Jima"]
      },
      { 
        nombre: "Girón", 
        lat: -3.1500, 
        lng: -79.1333,
        parroquias: ["Girón", "Asunción", "San Gerardo"]
      }
    ]
  },
  "Manabí": {
    cantones: [
      { 
        nombre: "Portoviejo", 
        lat: -1.0544, 
        lng: -80.4522,
        parroquias: ["Portoviejo", "12 de Marzo", "Colón", "Picoazá", "San Pablo", "Andrés de Vera", "Francisco Pacheco", "18 de Octubre", "Simón Bolívar", "Crucita", "Riochico", "Abdón Calderón"]
      },
      { 
        nombre: "Manta", 
        lat: -0.9537, 
        lng: -80.7333,
        parroquias: ["Manta", "Los Esteros", "Tarqui", "Eloy Alfaro", "San Mateo", "Santa Marianita"]
      },
      { 
        nombre: "Chone", 
        lat: -0.6961, 
        lng: -80.0967,
        parroquias: ["Chone", "Santa Rita", "Convento", "Canuto", "San Antonio", "Chibunga", "Eloy Alfaro", "Ricaurte", "Boyacá"]
      },
      { 
        nombre: "Jipijapa", 
        lat: -1.3500, 
        lng: -80.5833,
        parroquias: ["Jipijapa", "Dr. Miguel Morán Lucio", "Manuel Inocencio Parrales y Guale", "América", "El Anegado", "Julcuy", "La Unión", "Membrillal", "Pedro Pablo Gómez", "Puerto de Cayo"]
      },
      { 
        nombre: "Montecristi", 
        lat: -1.0472, 
        lng: -80.6617,
        parroquias: ["Montecristi", "Anibal San Andrés", "Colorado", "La Pila", "Las Pampas", "General Eloy Alfaro"]
      }
    ]
  }
};

/**
 * Obtiene la lista de provincias disponibles
 */
export const getProvincias = () => Object.keys(provinciasData);

/**
 * Obtiene los cantones de una provincia específica
 */
export const getCantones = (provincia) => {
  const data = provinciasData[provincia];
  return data ? data.cantones : [];
};

/**
 * Obtiene las parroquias de un cantón
 */
export const getParroquias = (provincia, canton) => {
  const cantones = getCantones(provincia);
  const cantonData = cantones.find(c => c.nombre === canton);
  return cantonData ? cantonData.parroquias : [];
};

/**
 * Valida si un cantón pertenece a una provincia
 */
export const validateProvinciaCantonCombo = (provincia, canton) => {
  const cantones = getCantones(provincia);
  return cantones.some(c => c.nombre === canton);
};

/**
 * Obtiene las coordenadas de un cantón
 */
export const getCoordinates = (provincia, canton) => {
  const cantones = getCantones(provincia);
  const cantonData = cantones.find(c => c.nombre === canton);
  return cantonData ? { lat: cantonData.lat, lng: cantonData.lng } : null;
};

/**
 * Genera los días del mes (1-31)
 */
export const getDays = () => Array.from({ length: 31 }, (_, i) => i + 1);

/**
 * Lista de meses con sus nombres
 */
export const months = [
  { value: 1, label: "Enero" },
  { value: 2, label: "Febrero" },
  { value: 3, label: "Marzo" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Mayo" },
  { value: 6, label: "Junio" },
  { value: 7, label: "Julio" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Septiembre" },
  { value: 10, label: "Octubre" },
  { value: 11, label: "Noviembre" },
  { value: 12, label: "Diciembre" }
];

export default provinciasData;
