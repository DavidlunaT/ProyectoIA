import { useState, useRef, useCallback } from 'react';
import Form from './components/Form';
import Loading from './components/Loading';
import Dashboard from './components/Dashboard';

/**
 * Aplicación Principal - Sistema de Predicción de Eventos Catastróficos
 * 
 * Estados de la aplicación:
 * - 'form': Vista inicial con formulario de consulta
 * - 'loading': Vista de carga con pasos secuenciales
 * - 'results': Dashboard con resultados de predicción
 */
function App() {
  const [view, setView] = useState('form'); // 'form' | 'loading' | 'results'
  const [query, setQuery] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  
  // Refs para mantener valores actualizados en callbacks
  const resultsRef = useRef(null);
  const errorRef = useRef(null);

  /**
   * Maneja el envío del formulario
   */
  const handleFormSubmit = async (formData) => {
    setQuery(formData);
    setView('loading');
    setError(null);
    errorRef.current = null;
    resultsRef.current = null;

    try {
      // Llamar al backend
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      // Leer el texto de la respuesta primero
      const responseText = await response.text();
      
      if (!response.ok) {
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        if (responseText) {
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch {
            errorMessage = responseText || errorMessage;
          }
        }
        throw new Error(errorMessage);
      }

      // Parsear la respuesta JSON
      if (!responseText) {
        throw new Error('El servidor no devolvió datos');
      }
      
      const data = JSON.parse(responseText);
      setResults(data);
      resultsRef.current = data;
      
      // El Loading component llamará a handleLoadingComplete cuando termine
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
      errorRef.current = err.message;
      // Aún así dejamos que el loading termine para mostrar el error después
    }
  };

  /**
   * Maneja la finalización de la animación de carga
   */
  const handleLoadingComplete = useCallback(() => {
    if (errorRef.current) {
      // Si hubo error, volver al formulario
      setView('form');
      alert(`Error: ${errorRef.current}`);
    } else if (resultsRef.current) {
      // Mostrar resultados
      setView('results');
    } else {
      // Si por alguna razón no hay resultados ni error, esperar un poco más
      setTimeout(() => {
        if (resultsRef.current) {
          setView('results');
        } else {
          setView('form');
          alert('Error: No se recibieron resultados');
        }
      }, 1000);
    }
  }, []);

  /**
   * Reinicia la aplicación para una nueva consulta
   */
  const handleReset = () => {
    setView('form');
    setQuery(null);
    setResults(null);
    setError(null);
  };

  return (
    <div className="min-h-screen py-12 px-4">
      {/* Background decorativo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse-slow"></div>
      </div>

      {/* Contenido principal */}
      <div className="relative z-10">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg">
            🌍 Ecuador Alert System
          </h1>
          <p className="text-white/80 text-sm md:text-base">
            Sistema de Predicción de Eventos Catastróficos
          </p>
        </header>

        {/* Vistas */}
        <main className="max-w-4xl mx-auto">
          {view === 'form' && (
            <Form onSubmit={handleFormSubmit} />
          )}
          
          {view === 'loading' && (
            <Loading onComplete={handleLoadingComplete} />
          )}
          
          {view === 'results' && results && (
            <Dashboard 
              data={results} 
              query={query} 
              onReset={handleReset} 
            />
          )}
        </main>

        {/* Footer */}
        <footer className="text-center mt-12 text-white/60 text-sm">
          <p>© 2025 Sistema de Predicción de Eventos Catastróficos</p>
          <p className="mt-1">Desarrollado para Ecuador 🇪🇨</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
