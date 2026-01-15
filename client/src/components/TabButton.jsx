import React from 'react';

export default function TabButton({ id, label, icon, count, activeTab, setActiveTab }) {
    return (
        <button
            onClick={() => setActiveTab(id)}
            className={`relative px-6 py-2.5 rounded-full font-medium text-sm transition-all duration-200 flex items-center gap-2 ${activeTab === id
                ? 'bg-white text-indigo-600 shadow-md ring-1 ring-black/5'
                : 'text-indigo-100 hover:bg-white/10 hover:text-white'
                }`}
        >
            <span>{icon}</span>
            {label}
            {count !== undefined && (
                <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === id ? 'bg-indigo-100 text-indigo-700' : 'bg-indigo-500/30 text-white'
                    }`}>
                    {count}
                </span>
            )}
        </button>
    );
}
