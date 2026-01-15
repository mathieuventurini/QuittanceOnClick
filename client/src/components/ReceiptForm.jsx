import React, { useState, useEffect } from 'react';

const ReceiptForm = ({ onReceiptSent }) => {
    // Helper to get capitalized month
    const getCurrentPeriod = () => {
        const date = new Date();
        const month = date.toLocaleDateString('fr-FR', { month: 'long' });
        const year = date.getFullYear();
        return `${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`;
    };

    const [formData, setFormData] = useState({
        tenantName: '',
        address: '10 Rue de la Pierre, 37100 Tours',
        email: '',
        amount: '',
        period: getCurrentPeriod()
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);



    const [skipAutomation, setSkipAutomation] = useState(false);

    // Load automation status on mount
    useEffect(() => {
        fetch('/api/automation/status')
            .then(res => res.json())
            .then(data => setSkipAutomation(!!data.skipNext))
            .catch(err => console.error('Failed to load validation status', err));
    }, []);

    const toggleAutomation = async () => {
        const newStatus = !skipAutomation;
        try {
            await fetch('/api/automation/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ skipNext: newStatus })
            });
            setSkipAutomation(newStatus);
            if (newStatus) {
                setMessage({ type: 'success', text: 'Envoi automatique désactivé pour ce mois.' });
            } else {
                setMessage({ type: 'success', text: 'Envoi automatique réactivé.' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Erreur lors de la mise à jour.' });
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validateForm = () => {
        const required = ['tenantName', 'amount', 'email', 'address', 'period'];
        const missing = required.filter(field => !formData[field]?.trim());

        if (missing.length > 0) {
            setMessage({
                type: 'error',
                text: 'Veuillez remplir tous les champs obligatoires.'
            });
            return false;
        }
        return true;
    };

    const handlePreview = async () => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            const response = await fetch('/api/receipts/preview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Preview failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (err) {
            setMessage({ type: 'error', text: 'Erreur lors de la prévisualisation' });
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            const response = await fetch('/api/receipts/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error);

            setMessage({ type: 'success', text: 'Quittance envoyée avec succès !' });
            if (onReceiptSent) onReceiptSent(result.receipt);

        } catch (err) {
            setMessage({ type: 'error', text: `Erreur: ${err.message}` });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-warm-border">
                {message && (
                    <div className={`p-4 mb-6 rounded-lg flex items-center gap-2 ${message.type === 'success'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                        {message.type === 'success' ? (
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        ) : (
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        )}
                        <span className="text-sm font-medium">{message.text}</span>
                    </div>
                )}

                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-warm-text flex items-center gap-2">
                                <span>📅</span> Période
                            </label>
                            <input
                                type="text"
                                name="period"
                                value={formData.period}
                                onChange={handleChange}
                                className="block w-full rounded-xl border-warm-border shadow-sm focus:border-warm-primary focus:ring-warm-primary sm:text-sm p-3 border-2 transition-all hover:border-warm-muted/50 focus:scale-[1.01]"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-warm-text flex items-center gap-2">
                                <span>💰</span> Montant (€)
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    name="amount"
                                    value={formData.amount}
                                    onChange={handleChange}
                                    className="block w-full rounded-xl border-warm-border shadow-sm focus:border-warm-primary focus:ring-warm-primary sm:text-sm p-3 pr-8 border-2 transition-all hover:border-warm-muted/50 focus:scale-[1.01]"
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <span className="text-warm-muted text-lg">€</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-warm-text flex items-center gap-2">
                            <span>👤</span> Nom du Locataire
                        </label>
                        <input
                            type="text"
                            name="tenantName"
                            value={formData.tenantName}
                            onChange={handleChange}
                            className="block w-full rounded-xl border-warm-border shadow-sm focus:border-warm-primary focus:ring-warm-primary sm:text-sm p-3 border-2 transition-all hover:border-warm-muted/50 focus:scale-[1.01]"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-warm-text flex items-center gap-2">
                            <span>📧</span> Email du Locataire
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="block w-full rounded-xl border-warm-border shadow-sm focus:border-warm-primary focus:ring-warm-primary sm:text-sm p-3 border-2 transition-all hover:border-warm-muted/50 focus:scale-[1.01]"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-warm-text flex items-center gap-2">
                            <span>🏡</span> Adresse du Bien
                        </label>
                        <textarea
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            className="block w-full rounded-xl border-warm-border shadow-sm focus:border-warm-primary focus:ring-warm-primary sm:text-sm p-3 border-2 transition-all hover:border-warm-muted/50 focus:scale-[1.01]"
                            rows="3"
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-6">
                        <button
                            onClick={handlePreview}
                            disabled={loading}
                            className="flex-1 py-3 px-4 border-2 border-warm-border text-warm-text font-medium rounded-xl hover:bg-warm-bg hover:border-warm-muted/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-warm-muted transition-all duration-200"
                        >
                            Prévisualiser
                        </button>
                        <button
                            onClick={handleSend}
                            disabled={loading}
                            className="flex-1 py-3 px-4 rounded-xl shadow-md text-white font-medium bg-warm-primary hover:bg-warm-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-warm-primary transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Traitement...
                                </>
                            ) : (
                                <>
                                    <span>Envoyer la quittance</span>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Automation Control Panel */}
            <div className={`p-6 rounded-2xl border transition-all duration-300 ${skipAutomation ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200 shadow-sm'}`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h3 className={`font-semibold text-lg flex items-center gap-2 ${skipAutomation ? 'text-red-800' : 'text-green-700'}`}>
                            {!skipAutomation && (
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                </span>
                            )}
                            {skipAutomation ? 'Envoi Automatique Désactivé' : 'Envoi Automatique Actif'}
                        </h3>
                        <p className={`text-sm mt-1 ${skipAutomation ? 'text-red-600' : 'text-warm-muted'}`}>
                            {skipAutomation
                                ? "La quittance ne sera PAS envoyée automatiquement le 8 de ce mois."
                                : "Prochain envoi automatique prévu le 8 du mois (si les données sont complètes)."}
                        </p>
                    </div>
                    <button
                        onClick={toggleAutomation}
                        className={`px-4 py-2 rounded-lg font-medium text-sm border focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${skipAutomation
                            ? 'bg-white text-red-700 border-red-300 hover:bg-red-50 focus:ring-red-500'
                            : 'bg-white text-warm-text border-warm-border hover:bg-warm-bg focus:ring-warm-muted'
                            }`}
                    >
                        {skipAutomation ? 'Réactiver l\'envoi' : 'Ne pas envoyer ce mois-ci'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReceiptForm;
