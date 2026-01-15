import React, { useState, useEffect } from 'react';

export default function AutomationControl() {
    const [automationStatus, setAutomationStatus] = useState({ skipNext: false });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            const res = await fetch('/api/automation/status');
            if (res.ok) {
                const data = await res.json();
                setAutomationStatus(data);
            }
        } catch (error) {
            console.error('Failed to fetch status:', error);
        }
    };

    const toggleAutomation = async () => {
        setLoading(true);
        try {
            const newSkipState = !automationStatus.skipNext;
            const res = await fetch('/api/automation/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ skipNext: newSkipState }),
            });
            if (res.ok) {
                setAutomationStatus({ skipNext: newSkipState });
            }
        } catch (error) {
            console.error('Failed to toggle automation:', error);
        } finally {
            setLoading(false);
        }
    };

    const isAutomationActive = !automationStatus.skipNext;

    return (
        <div className={`rounded-xl border p-6 transition-all duration-300 ${isAutomationActive ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        Statut Automatique
                        {isAutomationActive && (
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </span>
                        )}
                    </h3>
                    <p className={`text-sm mt-1 ${isAutomationActive ? 'text-green-700' : 'text-amber-800'}`}>
                        {isAutomationActive
                            ? "✅ L'envoi automatique est ACTIF pour ce mois-ci."
                            : "⏸️ L'envoi automatique est EN PAUSE pour ce mois-ci."}
                    </p>
                </div>
                <button
                    onClick={toggleAutomation}
                    disabled={loading}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isAutomationActive
                        ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                >
                    {loading ? '...' : (isAutomationActive ? 'Mettre en pause' : 'Réactiver')}
                </button>
            </div>
        </div>
    );
}
