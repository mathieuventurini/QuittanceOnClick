import React, { useState, useEffect } from 'react';
import ReceiptForm from './components/ReceiptForm';

function App() {
  const [history, setHistory] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const fetchHistory = () => {
    fetch('/api/history')
      .then(res => res.json())
      .then(data => setHistory(data))
      .catch(err => console.error('Failed to fetch history', err));
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="min-h-screen bg-warm-bg text-warm-text font-sans selection:bg-warm-primary selection:text-white">
      {/* Header Section */}
      <header className="bg-gradient-to-r from-warm-primary to-indigo-600 sticky top-0 z-20 shadow-lg shadow-indigo-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center transform hover:rotate-6 transition-transform cursor-pointer border border-white/20">
              {/* Happy House Logo */}
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <path d="M9 22V12h6v10" />
                <path d="M10 16h4" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight drop-shadow-sm">
              Quittance<span className="text-indigo-200">OnClick</span>
            </h1>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-sm text-indigo-100 font-medium bg-white/10 py-1 px-3 rounded-full border border-white/20 backdrop-blur-md">
            <span>🏠</span>
            <span>Simplifiez vos locations !</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Column: Form (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="mb-2">
              <h2 className="text-3xl font-extrabold text-warm-text flex items-center gap-2">
                Nouvelle Quittance <span className="text-2xl">✨</span>
              </h2>
              <p className="text-warm-muted text-lg">C'est parti ! Remplissez les infos pour envoyer votre document.</p>
            </div>
            <ReceiptForm onReceiptSent={fetchHistory} />
          </div>

          {/* Right Column: History (5 cols) */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl shadow-xl shadow-warm-primary/5 border border-warm-border overflow-hidden sticky top-24 transform transition-all hover:shadow-2xl hover:shadow-warm-primary/10">
              <button
                onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                className="w-full px-6 py-4 border-b border-warm-border bg-warm-bg/30 flex justify-between items-center hover:bg-warm-bg transition-colors"
              >
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-warm-text">Historique récent</h3>
                  <span className="text-xs font-bold px-2 py-1 bg-warm-primary text-white rounded-full shadow-sm">
                    {history.length}
                  </span>
                </div>
                <svg
                  className={`w-5 h-5 text-warm-muted transition-transform duration-300 ${isHistoryOpen ? 'transform rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isHistoryOpen && (
                <ul className="divide-y divide-warm-border max-h-[400px] overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-300">
                  {history.length === 0 ? (
                    <li className="p-12 text-center flex flex-col items-center justify-center">
                      <div className="relative mb-4">
                        <div className="absolute inset-0 bg-warm-primary/20 blur-xl rounded-full"></div>
                        <div className="relative bg-white p-4 rounded-2xl shadow-sm border border-warm-border/50">
                          {/* Resting Cat or Ghost Illustration */}
                          <svg className="w-16 h-16 text-warm-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M12 3v2" strokeLinecap="round" />
                            <path d="M18.5 5.5l-1.5 1.5" strokeLinecap="round" />
                            <path d="M21 12h-2" strokeLinecap="round" />
                            <path d="M5.5 5.5l1.5 1.5" strokeLinecap="round" />
                            <path d="M3 12h2" strokeLinecap="round" />
                            <path d="M12 19a7 7 0 1 0 0-14 7 7 0 0 0 0 14z" />
                            <path d="M9 13v-1" strokeWidth="2" strokeLinecap="round" />
                            <path d="M15 13v-1" strokeWidth="2" strokeLinecap="round" />
                            <path d="M10 16a2 2 0 0 0 4 0" strokeLinecap="round" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-warm-text font-bold text-lg">C'est calme ici...</p>
                      <p className="text-warm-muted mt-1">Envoyez une quittance pour réveiller l'historique ! 🚀</p>
                    </li>
                  ) : (
                    history.map((receipt) => (
                      <li key={receipt.id} className="group hover:bg-warm-bg/50 transition-colors duration-200">
                        <div className="px-6 py-4">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold text-warm-text group-hover:text-warm-primary transition-colors">
                              {receipt.period}
                            </p>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${receipt.status.includes('Sent')
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                              }`}>
                              {receipt.status === 'Sent' ? 'Envoyé' : receipt.status}
                            </span>
                          </div>
                          <div className="flex justify-between items-end">
                            <div>
                              <p className="text-sm text-warm-text font-medium">{receipt.tenantName}</p>
                              <p className="text-xs text-warm-muted mt-0.5">
                                {new Date(receipt.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            <p className="font-mono text-sm font-bold text-warm-text">
                              {receipt.amount} €
                            </p>
                          </div>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
