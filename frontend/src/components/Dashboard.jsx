import { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  MapPin, 
  Calendar, 
  AlertTriangle, 
  ArrowLeft, 
  Droplets, 
  Mountain, 
  Flame, 
  Activity,
  Shield,
  ChevronDown,
  X,
  CheckCircle2
} from 'lucide-react';
import { months, getParroquias } from '../data/provincias';

/**
 * Dashboard de Analisis de Riesgos Catastroficos
 * Muestra informacion de riesgo por parroquia seleccionada
 */
const Dashboard = ({ data, query, onReset }) => {
  const [selectedParroquias, setSelectedParroquias] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Obtener parroquias del canton
  const parroquias = getParroquias(query.provincia, query.canton);

  // Configuracion de eventos
  const eventConfig = {
    'Inundacion': { 
      icon: Droplets, 
      color: '#3b82f6',
      gradient: 'from-blue-400 to-blue-600',
      bgLight: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    'Deslizamiento': { 
      icon: Mountain, 
      color: '#8b5cf6',
      gradient: 'from-purple-400 to-purple-600',
      bgLight: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    'Incendio': { 
      icon: Flame, 
      color: '#f97316',
      gradient: 'from-orange-400 to-orange-600',
      bgLight: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    'Sismo': { 
      icon: Activity, 
      color: '#ef4444',
      gradient: 'from-red-400 to-red-600',
      bgLight: 'bg-red-50',
      borderColor: 'border-red-200'
    }
  };

  // Generar datos mock por parroquia
  const generateParroquiaData = (parroquia) => {
    const seed = parroquia.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const random = (min, max) => {
      const x = Math.sin(seed * (min + max)) * 10000;
      return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min;
    };

    const predictions = [
      { event_type: 'Inundacion', probability: random(15, 85), risk_level: '' },
      { event_type: 'Deslizamiento', probability: random(10, 70), risk_level: '' },
      { event_type: 'Incendio', probability: random(5, 60), risk_level: '' },
      { event_type: 'Sismo', probability: random(5, 40), risk_level: '' }
    ].map(p => ({
      ...p,
      risk_level: p.probability >= 75 ? 'critico' : p.probability >= 50 ? 'alto' : p.probability >= 25 ? 'medio' : 'bajo'
    }));

    const maxRisk = predictions.reduce((max, p) => p.probability > max.probability ? p : max, predictions[0]);
    
    return {
      parroquia,
      predictions,
      maxRisk,
      overallRiskLevel: maxRisk.risk_level
    };
  };

  // Datos de parroquias seleccionadas
  const parroquiasData = useMemo(() => {
    return selectedParroquias.map(p => generateParroquiaData(p));
  }, [selectedParroquias]);

  // Toggle parroquia selection
  const toggleParroquia = (parroquia) => {
    setSelectedParroquias(prev => 
      prev.includes(parroquia) 
        ? prev.filter(p => p !== parroquia)
        : [...prev, parroquia]
    );
  };

  // Seleccionar todas
  const selectAll = () => {
    setSelectedParroquias(parroquias);
    setIsDropdownOpen(false);
  };

  // Deseleccionar todas
  const clearAll = () => {
    setSelectedParroquias([]);
  };

  // Obtener color por nivel de riesgo
  const getRiskColor = (level) => {
    switch(level) {
      case 'critico': return 'text-red-600 bg-red-100 border-red-300';
      case 'alto': return 'text-orange-600 bg-orange-100 border-orange-300';
      case 'medio': return 'text-yellow-600 bg-yellow-100 border-yellow-300';
      default: return 'text-green-600 bg-green-100 border-green-300';
    }
  };

  // Mes formateado
  const monthName = months.find(m => m.value === query.month)?.label || '';

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header con ubicacion destacada */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 rounded-2xl shadow-2xl p-8 text-white">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onReset}
            className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Nueva consulta</span>
          </button>
          <div className="flex items-center space-x-2 bg-white/20 px-4 py-2 rounded-lg">
            <Calendar className="w-5 h-5" />
            <span className="font-medium">{query.day} de {monthName}</span>
          </div>
        </div>
        
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Analisis de Riesgos Catastroficos
          </h1>
          <div className="flex items-center justify-center space-x-3 text-xl md:text-2xl text-white/90">
            <MapPin className="w-6 h-6" />
            <span className="font-semibold">{query.canton}</span>
            <span className="text-white/60">|</span>
            <span>{query.provincia}</span>
          </div>
          <p className="text-white/70 mt-2">
            {parroquias.length} parroquias disponibles para analisis
          </p>
        </div>
      </div>

      {/* Selector de Parroquias */}
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-blue-500" />
            Seleccionar Parroquias
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={selectAll}
              className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all"
            >
              Seleccionar todas
            </button>
            <button
              onClick={clearAll}
              className="text-sm px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
            >
              Limpiar
            </button>
          </div>
        </div>

        {/* Dropdown de parroquias */}
        <div className="relative">
          <div
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer flex items-center justify-between hover:border-blue-300 transition-all"
          >
            <span className={selectedParroquias.length > 0 ? 'text-gray-800' : 'text-gray-400'}>
              {selectedParroquias.length > 0 
                ? selectedParroquias.length + ' parroquia(s) seleccionada(s)'
                : 'Seleccione las parroquias a analizar'
              }
            </span>
            <ChevronDown className={'w-5 h-5 text-gray-400 transition-transform ' + (isDropdownOpen ? 'rotate-180' : '')} />
          </div>

          {isDropdownOpen && (
            <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto">
              {parroquias.map((parroquia) => (
                <div
                  key={parroquia}
                  onClick={() => toggleParroquia(parroquia)}
                  className={'px-4 py-3 cursor-pointer flex items-center justify-between hover:bg-gray-50 transition-all ' + (selectedParroquias.includes(parroquia) ? 'bg-blue-50' : '')}
                >
                  <span className="text-gray-700">{parroquia}</span>
                  {selectedParroquias.includes(parroquia) && (
                    <CheckCircle2 className="w-5 h-5 text-blue-500" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tags de parroquias seleccionadas */}
        {selectedParroquias.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {selectedParroquias.map((parroquia) => (
              <span
                key={parroquia}
                className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
              >
                {parroquia}
                <X
                  className="w-4 h-4 ml-2 cursor-pointer hover:text-blue-900"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleParroquia(parroquia);
                  }}
                />
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Informacion de Parroquias Seleccionadas */}
      {parroquiasData.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
          <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            Seleccione parroquias para ver el analisis
          </h3>
          <p className="text-gray-400">
            Use el selector de arriba para elegir una o mas parroquias
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {parroquiasData.map((parroquiaData) => (
            <div key={parroquiaData.parroquia} className="bg-white rounded-2xl shadow-xl overflow-hidden">
              {/* Header de parroquia con alerta */}
              <div className={'p-6 text-white ' + (
                parroquiaData.overallRiskLevel === 'critico' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                parroquiaData.overallRiskLevel === 'alto' ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                parroquiaData.overallRiskLevel === 'medio' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                'bg-gradient-to-r from-green-500 to-green-600'
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="w-8 h-8" />
                    <div>
                      <h3 className="text-2xl font-bold">{parroquiaData.parroquia}</h3>
                      <p className="text-white/80">Parroquia de {query.canton}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm uppercase tracking-wide text-white/80">Nivel de Riesgo</div>
                    <div className="text-3xl font-bold uppercase">{parroquiaData.overallRiskLevel}</div>
                  </div>
                </div>
                
                {/* Alerta principal */}
                {(parroquiaData.overallRiskLevel === 'critico' || parroquiaData.overallRiskLevel === 'alto') && (
                  <div className="mt-4 bg-white/20 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5" />
                      <span className="font-semibold">Alerta de Alto Riesgo:</span>
                    </div>
                    <p className="mt-1">
                      Se detecta alta probabilidad de <strong>{parroquiaData.maxRisk.event_type}</strong> ({parroquiaData.maxRisk.probability}%)
                    </p>
                  </div>
                )}
              </div>

              {/* Contenido */}
              <div className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Grafico de probabilidades */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <Activity className="w-5 h-5 mr-2 text-purple-500" />
                      Probabilidad por Tipo de Evento
                    </h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={parroquiaData.predictions}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                          <XAxis type="number" domain={[0, 100]} unit="%" />
                          <YAxis type="category" dataKey="event_type" width={100} />
                          <Tooltip 
                            formatter={(value) => [value + '%', 'Probabilidad']}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                          />
                          <Bar dataKey="probability" radius={[0, 4, 4, 0]}>
                            {parroquiaData.predictions.map((entry, index) => (
                              <Cell key={'cell-' + index} fill={eventConfig[entry.event_type]?.color || '#666'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Resumen de riesgos */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <Shield className="w-5 h-5 mr-2 text-green-500" />
                      Resumen de Riesgos
                    </h4>
                    <div className="space-y-3">
                      {parroquiaData.predictions.map((pred) => {
                        const config = eventConfig[pred.event_type];
                        const Icon = config?.icon || Activity;
                        return (
                          <div 
                            key={pred.event_type}
                            className={'p-4 rounded-lg border ' + config?.bgLight + ' ' + config?.borderColor}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className={'p-2 rounded-lg bg-gradient-to-br ' + config?.gradient}>
                                  <Icon className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-800">{pred.event_type}</div>
                                  <div className="text-sm text-gray-500">Probabilidad: {pred.probability}%</div>
                                </div>
                              </div>
                              <span className={'px-3 py-1 rounded-full text-sm font-medium border ' + getRiskColor(pred.risk_level)}>
                                {pred.risk_level.charAt(0).toUpperCase() + pred.risk_level.slice(1)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Indicador de modelo */}
      {data?.is_mock && (
        <div className="text-center text-gray-400 text-sm py-4">
          <span className="inline-flex items-center px-3 py-1 bg-gray-100 rounded-full">
            Datos de demostracion - Modelo: {data.model_version || 'mock-v1.0.0'}
          </span>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
