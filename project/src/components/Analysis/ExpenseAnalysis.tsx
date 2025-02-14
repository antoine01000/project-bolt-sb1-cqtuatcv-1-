import React, { useState, useMemo, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import useAppStore from '../../store';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Users, Tags, Filter, X, ChevronDown, Search } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

type DateRange = 'all' | '3months' | '6months' | '12months' | 'year' | 'custom';

export const ExpenseAnalysis: React.FC = () => {
  const { expenses, persons, categories } = useAppStore();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [customStartDate, setCustomStartDate] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [customEndDate, setCustomEndDate] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');

  // Fermer le dropdown quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.category-dropdown')) {
        setShowCategoryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filtrer les catégories selon la recherche
  const filteredCategories = useMemo(() => {
    return categories.filter(category =>
      category.name.toLowerCase().includes(categorySearch.toLowerCase())
    );
  }, [categories, categorySearch]);

  // Filtrer les dépenses selon la période et les catégories sélectionnées
  const filteredExpenses = useMemo(() => {
    let startDate: Date;
    let endDate = new Date();
    const now = new Date();

    switch (dateRange) {
      case '3months':
        startDate = new Date(now.setMonth(now.getMonth() - 3));
        break;
      case '6months':
        startDate = new Date(now.setMonth(now.getMonth() - 6));
        break;
      case '12months':
        startDate = new Date(now.setMonth(now.getMonth() - 12));
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0);
        break;
      case 'custom':
        startDate = new Date(customStartDate);
        endDate = new Date(customEndDate);
        break;
      default:
        startDate = new Date(0); // Pour 'all'
    }

    return expenses.filter(expense => {
      const expenseDate = new Date(expense.month);
      const matchesDate = dateRange === 'all' || (expenseDate >= startDate && expenseDate <= endDate);
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(expense.category_id);
      return matchesDate && matchesCategory;
    });
  }, [expenses, dateRange, customStartDate, customEndDate, selectedCategories]);

  // Calculer les totaux mensuels et les variations
  const { monthlyTotals, monthlyVariations } = useMemo(() => {
    const totals = new Map<string, number>();
    const variations = new Map<string, number>();
    const sortedMonths = [...new Set(filteredExpenses.map(e => e.month))].sort();

    sortedMonths.forEach(month => {
      const monthExpenses = filteredExpenses.filter(e => e.month === month);
      const total = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
      totals.set(month, total);

      const previousMonth = sortedMonths[sortedMonths.indexOf(month) - 1];
      if (previousMonth) {
        const previousTotal = totals.get(previousMonth) || 0;
        const variation = previousTotal === 0 ? 0 : ((total - previousTotal) / previousTotal) * 100;
        variations.set(month, variation);
      } else {
        variations.set(month, 0);
      }
    });

    return { monthlyTotals: totals, monthlyVariations: variations };
  }, [filteredExpenses]);

  // Calculer les totaux par catégorie
  const categoryTotals = useMemo(() => {
    const totals = new Map<string, number>();
    categories
      .filter(category => selectedCategories.length === 0 || selectedCategories.includes(category.id))
      .forEach(category => {
        const categoryExpenses = filteredExpenses.filter(e => e.category_id === category.id);
        const total = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
        totals.set(category.name, total);
      });
    return new Map([...totals.entries()].sort((a, b) => b[1] - a[1]));
  }, [filteredExpenses, categories, selectedCategories]);

  // Calculer les totaux par personne et par catégorie
  const personCategoryTotals = useMemo(() => {
    const totals = new Map<string, Map<string, number>>();
    
    persons.forEach(person => {
      const categoryTotals = new Map<string, number>();
      const personExpenses = filteredExpenses.filter(e => e.person_id === person.id);

      categories
        .filter(category => selectedCategories.length === 0 || selectedCategories.includes(category.id))
        .forEach(category => {
          const amount = personExpenses
            .filter(e => e.category_id === category.id)
            .reduce((sum, e) => sum + e.amount, 0);
          if (amount > 0) {
            categoryTotals.set(category.name, amount);
          }
        });

      if (categoryTotals.size > 0) {
        totals.set(person.name, categoryTotals);
      }
    });

    return totals;
  }, [filteredExpenses, persons, categories, selectedCategories]);

  // Configuration des graphiques
  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        align: 'start' as const,
        labels: {
          boxWidth: 12,
          padding: 15,
          font: {
            size: 11
          }
        }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = context.raw as number;
            return `${context.dataset.label}: ${value.toFixed(2)} €`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: number) => `${value.toFixed(0)} €`
        }
      }
    }
  };

  // Données pour le graphique d'évolution
  const evolutionData = {
    labels: Array.from(monthlyTotals.keys()),
    datasets: [{
      label: 'Total des dépenses',
      data: Array.from(monthlyTotals.values()),
      borderColor: 'rgb(249, 115, 22)',
      backgroundColor: 'rgba(249, 115, 22, 0.1)',
      fill: true,
      tension: 0.4
    }]
  };

  // Données pour le graphique des catégories
  const categoryData = {
    labels: Array.from(categoryTotals.keys()),
    datasets: [{
      label: 'Montant total',
      data: Array.from(categoryTotals.values()),
      backgroundColor: Array.from(categoryTotals.keys()).map(name => 
        categories.find(c => c.name === name)?.color || '#gray'
      ),
      borderWidth: 0
    }]
  };

  // Données pour le graphique par personne
  const personData = {
    labels: Array.from(personCategoryTotals.keys()),
    datasets: categories
      .filter(category => selectedCategories.length === 0 || selectedCategories.includes(category.id))
      .map(category => ({
        label: category.name,
        data: Array.from(personCategoryTotals.keys()).map(person => {
          const categoryTotals = personCategoryTotals.get(person);
          return categoryTotals?.get(category.name) || 0;
        }),
        backgroundColor: category.color,
        stack: 'stack'
      }))
  };

  const evolutionOptions = {
    ...options,
    aspectRatio: 3,
    maintainAspectRatio: true
  };

  const handleSelectAllCategories = () => {
    if (selectedCategories.length === categories.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(categories.map(c => c.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <section className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-500" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateRange)}
              className="p-2 border rounded-lg"
            >
              <option value="all">Toutes les périodes</option>
              <option value="3months">3 derniers mois</option>
              <option value="6months">6 derniers mois</option>
              <option value="12months">12 derniers mois</option>
              <option value="year">Année en cours</option>
              <option value="custom">Période personnalisée</option>
            </select>
          </div>

          {dateRange === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="month"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="p-2 border rounded-lg"
              />
              <span>à</span>
              <input
                type="month"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="p-2 border rounded-lg"
              />
            </div>
          )}

          <div className="relative category-dropdown">
            <button
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              <Tags size={20} className="text-gray-500" />
              <span>
                {selectedCategories.length === 0
                  ? 'Toutes les catégories'
                  : `${selectedCategories.length} catégorie${selectedCategories.length > 1 ? 's' : ''}`}
              </span>
              <ChevronDown size={16} className="text-gray-500" />
            </button>

            {showCategoryDropdown && (
              <div className="absolute z-10 mt-2 w-72 bg-white border rounded-lg shadow-lg">
                <div className="p-2 border-b">
                  <label className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCategories.length === categories.length}
                      onChange={handleSelectAllCategories}
                      className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                    />
                    <span className="font-medium">Tout sélectionner</span>
                  </label>
                </div>
                <div className="p-2 border-b">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      placeholder="Rechercher une catégorie..."
                      className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto p-2">
                  {filteredCategories.map(category => (
                    <label
                      key={category.id}
                      className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category.id)}
                        onChange={() => {
                          setSelectedCategories(prev =>
                            prev.includes(category.id)
                              ? prev.filter(id => id !== category.id)
                              : [...prev, category.id]
                          );
                        }}
                        className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                      />
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span>{category.name}</span>
                    </label>
                  ))}
                  {filteredCategories.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      Aucune catégorie trouvée
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {selectedCategories.length > 0 && (
            <button
              onClick={() => setSelectedCategories([])}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
            >
              <X size={14} />
              Réinitialiser
            </button>
          )}
        </div>
      </section>

      {/* Section Évolution */}
      <section className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="text-orange-500" size={24} />
          <h2 className="text-2xl font-bold">Évolution des dépenses</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-6">
          {Array.from(monthlyVariations.entries()).slice(-2).map(([month, variation]) => (
            <div key={month} className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">{month}</div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold">
                  {(monthlyTotals.get(month) || 0).toFixed(2)} €
                </span>
                {variation !== 0 && (
                  <div className={`flex items-center gap-1 text-sm ${
                    variation > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {variation > 0 ? (
                      <ArrowUpRight size={16} />
                    ) : (
                      <ArrowDownRight size={16} />
                    )}
                    {Math.abs(variation).toFixed(1)}%
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="h-[300px]">
          <Line data={evolutionData} options={evolutionOptions} />
        </div>
      </section>

      {/* Section Catégories */}
      <section className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center gap-2 mb-6">
          <Tags className="text-orange-500" size={24} />
          <h2 className="text-2xl font-bold">
            {selectedCategories.length > 0 ? 'Catégories sélectionnées' : 'Répartition par catégorie'}
          </h2>
        </div>

        <Bar data={categoryData} options={options} />
      </section>

      {/* Section Personnes */}
      <section className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center gap-2 mb-6">
          <Users className="text-orange-500" size={24} />
          <h2 className="text-2xl font-bold">Répartition par personne</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-4 mb-6">
          {Array.from(personCategoryTotals.entries()).map(([person, categoryTotals]) => {
            const total = Array.from(categoryTotals.values()).reduce((a, b) => a + b, 0);

            return (
              <div key={person} className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm font-medium mb-1">{person}</div>
                <div className="text-lg font-bold">{total.toFixed(2)} €</div>
              </div>
            );
          })}
        </div>

        <Bar data={personData} options={options} />
      </section>
    </div>
  );
};