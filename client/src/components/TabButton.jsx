import React from 'react';

export default function TabButton({ id, label, icon, count, activeTab, setActiveTab }) {
    return (
        <button
            onClick={() => setActiveTab(id)}
            className={`relative px-3 sm:px-6 py-2 rounded-full font-medium text-xs sm:text-sm transition-all duration-200 flex items-center gap-1.5 sm:gap-2 ${activeTab === id
                ? 'bg-white text-indigo-600 shadow-md ring-1 ring-black/5'
                : 'text-indigo-100 hover:bg-white/10 hover:text-white'
                }`}
        >
            <span className="text-lg sm:text-base">{icon}</span>
            <span className="whitespace-nowrap">{label}</span>
            {count !== undefined && (
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold ${activeTab === id ? 'bg-indigo-100 text-indigo-700' : 'bg-indigo-500/30 text-white'
                    }`}>
                    {count}
                </span>
            )}
        </button>
    );
}
