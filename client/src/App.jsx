import React, { useState, useEffect } from 'react';
import AutomationControl from './components/AutomationControl';
import ManualSend from './components/ManualSend';
import Login from './components/Login';
import TabButton from './components/TabButton';



function App() {
  const [history, setHistory] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = loading

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      setIsAuthenticated(data.authenticated);
      if (data.authenticated) {
        fetchHistory();
      }
    } catch (err) {
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/history');
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  if (isAuthenticated === null) {
    return <div className="min-h-screen bg-warm-bg flex items-center justify-center text-warm-text">Chargement...</div>;
  }

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'history'



  return (
    <div className="min-h-screen bg-warm-bg text-gray-900 font-sans antialiased selection:bg-indigo-100 selection:text-indigo-900 pb-12">
      {/* Header Section */}
      <header className="bg-gradient-to-r from-warm-primary to-indigo-600 shadow-lg shadow-indigo-500/20 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm shadow-inner border border-white/10">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight leading-tight">
                  QuittanceOnClick
                </h1>
                <p className="text-xs text-indigo-100 font-medium">Gestion locative simplifiée</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="flex bg-black/10 p-1 rounded-full backdrop-blur-sm">
              <TabButton id="dashboard" label="Tableau de bord" icon="📊" activeTab={activeTab} setActiveTab={setActiveTab} />
              <TabButton id="history" label="Historique" icon="📜" count={history.length} activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fade-in">
            {/* 1. Automation Status (Top Priority) */}
            <section>
              <AutomationControl />
            </section>

            {/* 2. Manual Send (Secondary) */}
            <section>
              <ManualSend onReceiptSent={fetchHistory} />
            </section>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Historique des envois</h2>
              <span className="text-sm text-gray-500">{history.length} quittances générées</span>
            </div>

            {history.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-warm-border p-12 text-center">
                <div className="w-16 h-16 bg-warm-surface rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📭</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">Aucune quittance</h3>
                <p className="text-gray-500">L'historique est vide pour le moment.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {history.map((receipt) => (
                  <div key={receipt.id} className="bg-white p-5 rounded-xl shadow-sm border border-warm-border hover:shadow-md transition-shadow flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        {new Date(receipt.date).getDate()}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{receipt.period}</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>{receipt.tenantName}</span>
                          <span>•</span>
                          <span className="font-medium text-gray-700">{receipt.amount}€</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${receipt.status.includes('Auto')
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : 'bg-blue-100 text-blue-700 border border-blue-200'
                        }`}>
                        {receipt.status}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(receipt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}

export default App;
