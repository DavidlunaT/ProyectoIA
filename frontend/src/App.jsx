import { useState, useRef, useCallback } from 'react';
import Form from './components/Form';
import Loading from './components/Loading';
import Dashboard from './components/Dashboard';

function App() {
  const [view, setView] = useState('form'); // 'form' | 'loading' | 'results'
  const [query, setQuery] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  
  // Refs para coordinación
  const resultsRef = useRef(null);
  const errorRef = useRef(null);
  const animationDoneRef = useRef(false);

  // URL del Backend (Flexible para dev y prod)
  const API_URL = import.meta.env.VITE_API_URL || "https://proyectoia-backend-8ez3.onrender.com";

  const handleFormSubmit = async (formData) => {
    setQuery(formData);
    setView('loading');
    setError(null);
    setResults(null);
    
    // Resetear referencias
    errorRef.current = null;
    resultsRef.current = null;
    animationDoneRef.current = false;

    try {
      console.log("📡 Enviando petición a:", `${API_URL}/api/predict`);
      
      const response = await fetch(`${API_URL}/api/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const responseText = await response.text();
      
      if (!response.ok) {
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch { /* ignore json parse error */ }
        throw new Error(errorMessage);
      }

      if (!responseText) throw new Error('El servidor no devolvió datos');
      
      const data = JSON.parse(responseText);
      
      setResults(data);
      resultsRef.current = data;

      if (animationDoneRef.current) {
        setView('results');
      }

    } catch (err) {
      console.error('❌ Error en fetch:', err);
      setError(err.message);
      errorRef.current = err.message;

      if (animationDoneRef.current) {
        setView('form');
        alert(`Error: ${err.message}`);
      }
    }
  };

  const handleLoadingComplete = useCallback(() => {
    console.log(" Animación de carga terminada");
    animationDoneRef.current = true;

    // Lógica de coordinación:
    if (errorRef.current) {
      // Si ya ocurrió un error, volver
      setView('form');
      alert(`Error: ${errorRef.current}`);
    } else if (resultsRef.current) {
      // Si ya hay resultados, mostrar dashboard
      setView('results');
    } 
    // ELSE: Si no hay error NI resultados, NO HACER NADA.
    // Dejar que el usuario siga viendo la pantalla de carga.
    // El handleFormSubmit se encargará de cambiar la vista cuando termine el fetch.
  }, []);

  const handleReset = () => {
    setView('form');
    setQuery(null);
    setResults(null);
    setError(null);
  };

  return (
    <div className="min-h-screen py-12 px-4 relative">
       {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 animate-pulse"></div>
      </div>

      <div className="relative z-10">
        <header className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg">
            🌍 Ecuador Alert System
          </h1>
          <p className="text-white/80 text-sm md:text-base">
            Sistema de Predicción de Eventos Catastróficos
          </p>
        </header>

        <main className="max-w-4xl mx-auto">
          {view === 'form' && <Form onSubmit={handleFormSubmit} />}
          {view === 'loading' && <Loading onComplete={handleLoadingComplete} />}
          {view === 'results' && results && <Dashboard data={results} query={query} onReset={handleReset} />}
        </main>

        <footer className="text-center mt-12 text-white/60 text-sm">
          <p>© 2025 Sistema de Predicción de Eventos Catastróficos</p>
        </footer>
      </div>
    </div>
  );
}

export default App;