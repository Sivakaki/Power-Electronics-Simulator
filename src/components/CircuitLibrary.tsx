import React, { useState } from 'react';
import { useSimStore } from '../store/useSimStore';
import { CIRCUITS, CIRCUIT_CATEGORIES } from '../simulation/circuitsData';
import { 
  FolderGit2, 
  Search, 
  Zap, 
  Network, 
  Sliders, 
  Repeat, 
  Check, 
  ChevronDown, 
  ChevronRight,
  X 
} from 'lucide-react';

interface CircuitLibraryProps {
  onClose?: () => void;
}

export const CircuitLibrary: React.FC<CircuitLibraryProps> = ({ onClose }) => {
  const { selectedCircuitId, setCircuit } = useSimStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (catId: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  const getCategoryIcon = (catId: string) => {
    switch (catId) {
      case 'single-phase': return <Zap className="w-3.5 h-3.5 text-amber-400" />;
      case 'three-phase': return <Network className="w-3.5 h-3.5 text-sky-400" />;
      case 'ac-controller': return <Sliders className="w-3.5 h-3.5 text-emerald-400" />;
      case 'dual-converter': return <Repeat className="w-3.5 h-3.5 text-purple-400" />;
      default: return <Zap className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const filteredCircuits = CIRCUITS.filter(c => {
    const matchesCategory = selectedCategoryFilter === 'all' || c.category === selectedCategoryFilter;
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.shortDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.badge.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSelect = (id: string) => {
    setCircuit(id);
    if (onClose) onClose();
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-lg overflow-hidden text-xs font-mono shadow-2xl">
      {/* Header */}
      <div className="p-2.5 border-b border-slate-800 bg-slate-900/90 flex-none">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <FolderGit2 className="w-4 h-4 text-sky-400" />
            <span className="font-semibold text-slate-200">Circuit Library</span>
            <span className="text-[10px] text-slate-400">({CIRCUITS.length} Topologies)</span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search & Category Filter */}
        <div className="space-y-1.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search circuits..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded pl-8 pr-2 py-1 text-[11px] text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-sky-500 transition"
            />
          </div>

          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-300 focus:outline-none focus:border-sky-500 cursor-pointer"
          >
            <option value="all">All Categories (13)</option>
            <option value="single-phase">Single Phase (5)</option>
            <option value="three-phase">Three Phase (4)</option>
            <option value="ac-controller">AC Controllers (2)</option>
            <option value="dual-converter">Dual Converters (2)</option>
          </select>
        </div>
      </div>

      {/* Circuit Categories List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {CIRCUIT_CATEGORIES.map(cat => {
          const catCircuits = filteredCircuits.filter(c => c.category === cat.id);
          if (catCircuits.length === 0) return null;

          const isCollapsed = collapsedCategories[cat.id];

          return (
            <div key={cat.id} className="space-y-1">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(cat.id)}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-slate-900 text-slate-300 transition text-left"
              >
                <div className="flex items-center gap-1.5 font-semibold text-[11px] text-slate-200">
                  {getCategoryIcon(cat.id)}
                  <span>{cat.name}</span>
                  <span className="text-[10px] text-slate-400 font-normal">({catCircuits.length})</span>
                </div>
                {isCollapsed ? (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                )}
              </button>

              {/* Circuits in this category */}
              {!isCollapsed && (
                <div className="space-y-1 pl-1">
                  {catCircuits.map(circuit => {
                    const isSelected = selectedCircuitId === circuit.id;

                    return (
                      <button
                        key={circuit.id}
                        onClick={() => handleSelect(circuit.id)}
                        className={`w-full text-left p-2 rounded border transition ${
                          isSelected
                            ? 'bg-sky-500/10 border-sky-500/50 shadow-sm shadow-sky-500/10'
                            : 'bg-slate-900/40 border-slate-900 hover:bg-slate-900/80 hover:border-slate-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span
                            className={`font-semibold text-[11px] ${
                              isSelected ? 'text-sky-300' : 'text-slate-300'
                            }`}
                          >
                            {circuit.name}
                          </span>
                          {isSelected && <Check className="w-3 h-3 text-sky-400 shrink-0 mt-0.5" />}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {circuit.shortDescription}
                        </div>
                        <div className="mt-1.5">
                          <span className="text-[9px] text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                            {circuit.badge}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
