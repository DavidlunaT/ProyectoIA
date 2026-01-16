import { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { 
  MapPin, Calendar, ArrowLeft, Shield, ChevronDown, CheckCircle2
} from 'lucide-react';
import { months } from '../data/provincias';

const Dashboard = ({ data, query, onReset }) => {
  const [selectedParroquias, setSelectedParroquias] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const availableParroquias = useMemo(() => {
    return data?.parroquias_data ? Object.keys(data.parroquias_data).sort() : [];
  }, [data]);

  // --- 1. LÓGICA DE COLOR DE CABECERA (Header) ---
  const getHeaderColorClass = (level) => {
    const safeLevel = level?.toLowerCase() || '';
    if (safeLevel === 'crítico' || safeLevel === 'extremo') return 'bg-red-500';
    if (safeLevel === 'alto') return 'bg-orange-500';
    if (safeLevel === 'medio') return 'bg-yellow-500';
    return 'bg-green-600'; // Bajo o Ninguno = Verde Oscuro
  };

  // --- 2. LÓGICA DE COLOR DE BARRAS (Chart) ---
  const getBarColor = (prob, eventName) => {
    // CASO A: Es "NINGUNO" (Calma)
    // Si la probabilidad de "NINGUNO" es alta, es BUENO -> Verde
    if (eventName === 'NINGUNO') {
      return '#16a34a'; // green-600 (Siempre verde si es Ninguno)
    }

    // CASO B: Es un DESASTRE (Incendio, Inundación, etc.)
    // Si la probabilidad es alta, es PELIGROSO -> Rojo
    if (prob >= 75) return '#ef4444'; // Rojo
    if (prob >= 50) return '#f97316'; // Naranja
    if (prob >= 25) return '#eab308'; // Amarillo
    return '#22c55e'; // Verde (Poca probabilidad de desastre)
  };

  const toggleParroquia = (p) => {
    setSelectedParroquias(prev => 
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header General */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 rounded-2xl shadow-2xl p-8 text-white">
        <div className="flex justify-between items-center mb-4">
          <button onClick={onReset} className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg">
            <ArrowLeft className="w-5 h-5" /> <span>Nueva Consulta</span>
          </button>
          <div className="bg-white/20 px-4 py-2 rounded-lg flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            {query.day} de {months.find(m => m.value === query.month)?.label}
          </div>
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold">Resultados del Análisis</h1>
          <p className="text-xl mt-2 flex justify-center items-center gap-2">
            <MapPin /> {query.canton}, {query.provincia}
          </p>
          <p className="text-sm opacity-80 mt-2">
            Se analizaron {availableParroquias.length} parroquias exitosamente
          </p>
        </div>
      </div>

      {/* Dropdown Selector */}
      <div className="bg-white rounded-2xl shadow-xl p-6 relative">
        <h2 className="text-lg font-bold mb-4 text-gray-700">Seleccionar Parroquias a Visualizar</h2>
        <div 
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full p-3 border rounded-lg cursor-pointer flex justify-between items-center hover:border-blue-400"
        >
          <span className="text-gray-600">
            {selectedParroquias.length === 0 
              ? "Haga clic para seleccionar parroquias..." 
              : `${selectedParroquias.length} seleccionadas`}
          </span>
          <ChevronDown />
        </div>

        {isDropdownOpen && (
          <div className="absolute z-10 w-full left-0 mt-1 bg-white border rounded-lg shadow-xl max-h-60 overflow-y-auto">
            <div className="p-2 border-b flex justify-between bg-gray-50">
                <button onClick={() => setSelectedParroquias(availableParroquias)} className="text-blue-600 text-sm font-bold">Todas</button>
                <button onClick={() => setSelectedParroquias([])} className="text-gray-500 text-sm">Ninguna</button>
            </div>
            {availableParroquias.map(p => (
              <div 
                key={p} 
                onClick={() => toggleParroquia(p)}
                className={`p-3 cursor-pointer hover:bg-blue-50 flex justify-between items-center ${selectedParroquias.includes(p) ? 'bg-blue-50' : ''}`}
              >
                <span>{p}</span>
                {selectedParroquias.includes(p) && <CheckCircle2 className="w-4 h-4 text-blue-500" />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tarjetas de Resultados */}
      <div className="grid md:grid-cols-1 gap-6">
        {selectedParroquias.length === 0 && (
          <div className="text-center py-12 text-gray-400 bg-white rounded-2xl shadow">
            Seleccione al menos una parroquia para ver los detalles de riesgo.
          </div>
        )}

        {selectedParroquias.map(parroquiaName => {
          const pData = data.parroquias_data[parroquiaName];
          if (!pData) return null;

          // Convertir a porcentajes (0-100)
          const chartData = pData.predictions.map(pred => ({
            ...pred,
            probability: parseFloat((pred.probability * 100).toFixed(1))
          }));

          return (
            <div key={parroquiaName} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
              {/* Encabezado: Color basado en el Riesgo Global */}
              <div className={`p-4 flex justify-between items-center text-white ${getHeaderColorClass(pData.max_risk)}`}>
                <div className="flex items-center gap-3">
                  <Shield className="w-6 h-6" />
                  <span className="font-bold text-lg">{parroquiaName}</span>
                </div>
                <div className="text-xs uppercase font-bold bg-white/20 px-2 py-1 rounded">
                  Riesgo Global: {pData.max_risk}
                </div>
              </div>

              {/* Gráfico */}
              <div className="p-6">
                <div className="h-64 w-full">
                  <ResponsiveContainer>
                    <BarChart data={chartData} layout="vertical" margin={{left: 20, right: 20}}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis type="number" domain={[0, 100]} hide />
                      <YAxis type="category" dataKey="event_type" width={140} tick={{fontSize: 11}} />
                      <Tooltip formatter={(val) => [`${val}%`, 'Probabilidad']} />
                      
                      {/* BARRAS: Color inteligente según si es Ninguno o Desastre */}
                      <Bar dataKey="probability" radius={[0, 4, 4, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={getBarColor(entry.probability, entry.event_type)} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;