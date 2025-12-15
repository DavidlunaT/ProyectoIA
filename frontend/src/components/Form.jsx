import { useState, useEffect } from 'react';
import { MapPin, Calendar, AlertTriangle, ChevronDown, Search } from 'lucide-react';
import { 
  getProvincias, 
  getCantones, 
  validateProvinciaCantonCombo,
  getDays,
  months 
} from '../data/provincias';

/**
 * Componente de Formulario de Consulta
 * Permite seleccionar provincia, cantón, día y mes para la predicción
 */
const Form = ({ onSubmit }) => {
  const [provincia, setProvincia] = useState('');
  const [canton, setCanton] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [error, setError] = useState('');
  const [cantonesDisponibles, setCantonesDisponibles] = useState([]);

  const provincias = getProvincias();
  const days = getDays();

  // Actualizar cantones cuando cambia la provincia
  useEffect(() => {
    if (provincia) {
      const cantones = getCantones(provincia);
      setCantonesDisponibles(cantones);
      // Resetear el cantón si no es válido para la nueva provincia
      if (canton && !validateProvinciaCantonCombo(provincia, canton)) {
        setCanton('');
        setError(`El cantón "${canton}" no pertenece a ${provincia}. Por favor seleccione un cantón válido.`);
      } else {
        setError('');
      }
    } else {
      setCantonesDisponibles([]);
      setCanton('');
    }
  }, [provincia]);

  // Validar combinación cuando cambia el cantón
  useEffect(() => {
    if (provincia && canton) {
      if (!validateProvinciaCantonCombo(provincia, canton)) {
        setError(`Error: El cantón "${canton}" no pertenece a la provincia "${provincia}".`);
      } else {
        setError('');
      }
    }
  }, [canton, provincia]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validación final
    if (!provincia || !canton || !day || !month) {
      setError('Por favor complete todos los campos.');
      return;
    }

    if (!validateProvinciaCantonCombo(provincia, canton)) {
      setError(`Error: El cantón "${canton}" no pertenece a la provincia "${provincia}".`);
      return;
    }

    setError('');
    onSubmit({
      provincia,
      canton,
      day: parseInt(day),
      month: parseInt(month)
    });
  };

  const isFormValid = provincia && canton && day && month && !error;

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
          <AlertTriangle className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Predicción de Eventos Catastróficos
        </h1>
        <p className="text-gray-500 text-sm">
          Sistema de predicción para Ecuador
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Provincia */}
        <div className="space-y-2">
          <label className="flex items-center text-sm font-medium text-gray-700">
            <MapPin className="w-4 h-4 mr-2 text-blue-500" />
            Provincia
          </label>
          <div className="relative">
            <select
              value={provincia}
              onChange={(e) => setProvincia(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="">Seleccione una provincia</option>
              {provincias.map((prov) => (
                <option key={prov} value={prov}>{prov}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Cantón */}
        <div className="space-y-2">
          <label className="flex items-center text-sm font-medium text-gray-700">
            <MapPin className="w-4 h-4 mr-2 text-green-500" />
            Cantón
          </label>
          <div className="relative">
            <select
              value={canton}
              onChange={(e) => setCanton(e.target.value)}
              disabled={!provincia}
              className={`w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                !provincia ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <option value="">
                {provincia ? 'Seleccione un cantón' : 'Primero seleccione una provincia'}
              </option>
              {cantonesDisponibles.map((c) => (
                <option key={c.nombre} value={c.nombre}>{c.nombre}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Fecha de Predicción - Día y Mes */}
        <div className="space-y-2">
          <label className="flex items-center text-sm font-medium text-gray-700">
            <Calendar className="w-4 h-4 mr-2 text-purple-500" />
            Fecha de Predicción
          </label>
          <div className="grid grid-cols-2 gap-3">
            {/* Día */}
            <div className="relative">
              <select
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">Día</option>
                {days.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
            {/* Mes */}
            <div className="relative">
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">Mes</option>
                {months.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 text-sm font-medium flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
              {error}
            </p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isFormValid}
          className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-all duration-300 flex items-center justify-center space-x-2 ${
            isFormValid
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          <Search className="w-5 h-5" />
          <span>Consultar Predicción</span>
        </button>
      </form>

      {/* Footer Info */}
      <p className="text-center text-gray-400 text-xs mt-6">
        Sistema de IA para predicción de eventos catastróficos
      </p>
    </div>
  );
};

export default Form;
