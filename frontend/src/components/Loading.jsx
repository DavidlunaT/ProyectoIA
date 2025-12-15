import { useState, useEffect } from 'react';
import { Check, Loader2, Database, Brain, Calculator } from 'lucide-react';

/**
 * Componente de Carga con Pasos Secuenciales
 * Muestra el progreso de la predicción con animaciones
 */
const Loading = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);

  const steps = [
    {
      id: 1,
      title: 'Preprocesando datos...',
      description: 'Validando ubicación y parámetros temporales',
      icon: Database,
      duration: 1500
    },
    {
      id: 2,
      title: 'Generando embeddings...',
      description: 'Transformando datos para el modelo de IA',
      icon: Brain,
      duration: 2000
    },
    {
      id: 3,
      title: 'Calculando probabilidades...',
      description: 'Ejecutando modelo de predicción',
      icon: Calculator,
      duration: 1500
    }
  ];

  useEffect(() => {
    const timeouts = [];
    let totalDelay = 0;
    
    // Programar cada paso
    steps.forEach((step, index) => {
      const stepTimeout = setTimeout(() => {
        setCurrentStep(index);
      }, totalDelay);
      timeouts.push(stepTimeout);
      
      totalDelay += step.duration;
      
      const completeTimeout = setTimeout(() => {
        setCompletedSteps(prev => [...prev, index]);
      }, totalDelay);
      timeouts.push(completeTimeout);
    });
    
    // Programar la llamada a onComplete después de todos los pasos
    const finalTimeout = setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, totalDelay + 500);
    timeouts.push(finalTimeout);

    return () => {
      timeouts.forEach(t => clearTimeout(t));
    };
  }, [onComplete]);

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4 animate-pulse">
          <Brain className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Procesando Predicción
        </h2>
        <p className="text-gray-500 text-sm">
          Por favor espere mientras analizamos los datos
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = completedSteps.includes(index);
          const isCurrent = currentStep === index && !isCompleted;
          const isPending = index > currentStep;

          return (
            <div
              key={step.id}
              className={`flex items-start space-x-4 p-4 rounded-lg transition-all duration-500 ${
                isCompleted
                  ? 'bg-green-50 border border-green-200'
                  : isCurrent
                  ? 'bg-blue-50 border border-blue-200'
                  : 'bg-gray-50 border border-gray-200'
              }`}
            >
              {/* Icon/Check */}
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                isCompleted
                  ? 'bg-green-500'
                  : isCurrent
                  ? 'bg-blue-500'
                  : 'bg-gray-300'
              }`}>
                {isCompleted ? (
                  <Check className="w-5 h-5 text-white animate-check-appear" />
                ) : isCurrent ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <Icon className="w-5 h-5 text-white" />
                )}
              </div>

              {/* Text */}
              <div className="flex-1">
                <h3 className={`font-semibold transition-colors duration-300 ${
                  isCompleted
                    ? 'text-green-700'
                    : isCurrent
                    ? 'text-blue-700'
                    : 'text-gray-400'
                }`}>
                  {step.id}. {step.title}
                </h3>
                <p className={`text-sm mt-1 transition-colors duration-300 ${
                  isCompleted
                    ? 'text-green-600'
                    : isCurrent
                    ? 'text-blue-600'
                    : 'text-gray-400'
                }`}>
                  {step.description}
                </p>
              </div>

              {/* Status Badge */}
              <div className="flex-shrink-0">
                {isCompleted && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    Completado
                  </span>
                )}
                {isCurrent && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 animate-pulse">
                    En proceso...
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="mt-8">
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>Progreso</span>
          <span>{Math.round((completedSteps.length / steps.length) * 100)}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500 ease-out"
            style={{ width: `${(completedSteps.length / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-gray-400 text-xs mt-6">
        Modelo de IA procesando datos geoespaciales
      </p>
    </div>
  );
};

export default Loading;
