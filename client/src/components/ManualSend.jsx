import React, { useState } from 'react';

const PRESETS = {
    address: "",
    amount: "",
    tenantName: "",
    email: ""
};

export default function ManualSend({ onReceiptSent }) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [formData, setFormData] = useState({
        tenantName: PRESETS.tenantName,
        address: PRESETS.address,
        amount: PRESETS.amount,
        email: PRESETS.email,
        period: new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    });
    const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: '' }
    const [errors, setErrors] = useState({});

    // ... existing handlers ...
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.tenantName.trim()) newErrors.tenantName = "Le nom du locataire est requis";
        if (!formData.address.trim()) newErrors.address = "L'adresse est requise";
        if (!formData.amount.trim()) newErrors.amount = "Le montant est requis";
        if (!formData.email.trim()) newErrors.email = "L'email est requis";
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Format d'email invalide";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };


    const handlePreview = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        setPreviewUrl(null);
        setToast(null);

        try {
            const capitilizedPeriod = formData.period.charAt(0).toUpperCase() + formData.period.slice(1);
            const response = await fetch('/api/receipts/preview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, period: capitilizedPeriod }),
            });

            if (!response.ok) throw new Error('Erreur génération preview');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            setPreviewUrl(url);
        } catch (error) {
            console.error(error);
            setToast({ type: 'error', message: "Impossible de générer l'aperçu." });
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!validateForm()) return;

        if (!confirm(`Confirmer l'envoi de la quittance à ${formData.email} ?`)) return;

        setLoading(true);
        setToast(null);

        try {
            const capitilizedPeriod = formData.period.charAt(0).toUpperCase() + formData.period.slice(1);
            const response = await fetch('/api/receipts/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, period: capitilizedPeriod }),
            });

            const data = await response.json();

            if (response.ok) {
                setToast({ type: 'success', message: 'Quittance envoyée avec succès !' });
                setPreviewUrl(null); // Close preview after success
                if (onReceiptSent) onReceiptSent();
            } else {
                throw new Error(data.error || "Erreur lors de l'envoi.");
            }
        } catch (error) {
            console.error(error);
            setToast({ type: 'error', message: `Erreur: ${error.message}` });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-warm-border overflow-hidden transition-all duration-300">
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="p-6 border-b border-warm-border bg-gray-50/50 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors select-none"
            >
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Envoi Manuel</h2>
                    <p className="text-sm text-gray-500">Générer et envoyer une quittance ponctuelle</p>
                </div>
                <div className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            {isOpen && (
                <div className="p-6 space-y-6 animate-fade-in">
                    {/* Form Fields Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Period (Full width) */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-warm-text mb-2 flex items-center gap-2">
                                <span>📅</span> Période
                            </label>
                            <input
                                type="text"
                                name="period"
                                value={formData.period}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 rounded-xl border-2 border-indigo-200 bg-white focus:ring-2 focus:ring-warm-primary transition-all"
                            />
                        </div>

                        {/* Tenant & Amount */}
                        <div>
                            <label className="block text-sm font-medium text-warm-text mb-2 flex items-center gap-2">
                                <span>👤</span> Locataire
                            </label>
                            <input
                                type="text"
                                name="tenantName"
                                value={formData.tenantName}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-2 rounded-xl border-2 border-indigo-200 bg-white focus:ring-2 focus:ring-warm-primary transition-all ${errors.tenantName ? 'border-red-300 ring-2 ring-red-100' : ''}`}
                            />
                            {errors.tenantName && <p className="text-xs text-red-500 mt-1">{errors.tenantName}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-warm-text mb-2 flex items-center gap-2">
                                <span>💰</span> Montant (€)
                            </label>
                            <input
                                type="number"
                                name="amount"
                                value={formData.amount}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-2 rounded-xl border-2 border-indigo-200 bg-white focus:ring-2 focus:ring-warm-primary transition-all ${errors.amount ? 'border-red-300 ring-2 ring-red-100' : ''}`}
                            />
                            {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
                        </div>

                        {/* Address (Full width) */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-warm-text mb-2 flex items-center gap-2">
                                <span>🏠</span> Adresse du bien
                            </label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-2 rounded-xl border-2 border-indigo-200 bg-white focus:ring-2 focus:ring-warm-primary transition-all ${errors.address ? 'border-red-300 ring-2 ring-red-100' : ''}`}
                            />
                            {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
                        </div>

                        {/* Email (Full width) */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-warm-text mb-2 flex items-center gap-2">
                                <span>📧</span> Email du locataire
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-2 rounded-xl border-2 border-indigo-200 bg-white focus:ring-2 focus:ring-warm-primary transition-all ${errors.email ? 'border-red-300 ring-2 ring-red-100' : ''}`}
                            />
                            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                        </div>
                    </div>

                    {/* Toast Message */}
                    {toast && (
                        <div className={`p-4 rounded-xl flex items-center gap-3 ${toast.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {toast.type === 'success' ? '✅' : '⚠️'}
                            {toast.message}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <button
                            onClick={handlePreview}
                            disabled={loading}
                            className="flex-1 px-6 py-3 rounded-xl border-2 border-warm-primary text-warm-primary font-semibold hover:bg-warm-surface transition-colors disabled:opacity-50"
                        >
                            {loading ? '...' : '👁️ Prévisualiser'}
                        </button>
                        <button
                            onClick={handleSend}
                            disabled={loading}
                            className="flex-1 px-6 py-3 rounded-xl bg-warm-primary text-white font-semibold shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all disabled:opacity-50"
                        >
                            {loading ? 'Envoi...' : '📤 Envoyer la quittance'}
                        </button>
                    </div>

                    {/* PDF Preview */}
                    {previewUrl && (
                        <div className="mt-8 border-t border-warm-border pt-8 animate-fade-in">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-warm-text">Aperçu du document</h3>
                                <button onClick={() => setPreviewUrl(null)} className="text-sm text-warm-muted hover:text-warm-text">
                                    Fermer
                                </button>
                            </div>
                            <iframe
                                src={previewUrl}
                                className="w-full h-[600px] rounded-xl border border-warm-border shadow-inner bg-gray-100"
                                title="Aperçu PDF"
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
