import React, { useState, useEffect, useRef } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
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
  ArcElement
} from 'chart.js';
import useAppStore from '../../store';
import { Expense, Category } from '../../types';
import {
  ArrowUpRight,
  ArrowDownRight,
  Table,
  Copy,
  Edit2,
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  GripVertical,
  Euro,
  Calendar,
  User
} from 'lucide-react';
import { AddExpenseModal } from '../Expenses/AddExpenseModal';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const ExpenseCharts: React.FC = () => {
  const { expenses, persons, categories, addExpense, deleteExpense, updateExpense, updateCategoriesOrder } = useAppStore();
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [showMonthlyTable, setShowMonthlyTable] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Effet pour faire défiler la table vers la droite au montage
  useEffect(() => {
    if (tableRef.current && showMonthlyTable) {
      // Petit délai pour laisser le temps au DOM de se mettre à jour
      setTimeout(() => {
        tableRef.current?.scrollTo({
          left: tableRef.current.scrollWidth,
          behavior: 'smooth'
        });
      }, 100);
    }
  }, [showMonthlyTable]);

  // Trier les mois par ordre chronologique
  const months = [...new Set(expenses.map(e => e.month))].sort();

  const getVariation = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const handleCopyMonth = (sourceMonth: string) => {
    const targetMonth = prompt('Entrez le mois cible (YYYY-MM):');
    if (!targetMonth?.match(/^\d{4}-\d{2}$/)) {
      alert('Format de mois invalide. Utilisez YYYY-MM');
      return;
    }

    const monthExpenses = expenses.filter(e => e.month === sourceMonth);
    if (monthExpenses.length === 0) {
      alert('Aucune dépense à copier pour ce mois');
      return;
    }

    if (!confirm(`Copier ${monthExpenses.length} dépenses vers ${targetMonth} ?`)) {
      return;
    }

    monthExpenses.forEach(expense => {
      addExpense({
        month: targetMonth,
        amount: expense.amount,
        person_id: expense.person_id,
        category_id: expense.category_id,
        comment: expense.comment
      });
    });
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Erreur lors du changement de mode plein écran:', err);
    }
  };

  const handleCloseModal = async () => {
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Erreur lors de la sortie du mode plein écran:', err);
    } finally {
      setShowMonthlyTable(false);
      setEditingExpense(null);
    }
  };

  const barData = {
    labels: months,
    datasets: Object.values(
      expenses.reduce((acc: any, expense) => {
        const person = persons.find(p => p.id === expense.person_id);
        const category = categories.find(c => c.id === expense.category_id);
        if (!category) return acc;

        const key = `${expense.person_id}-${category.order}-${category.id}`;
        
        if (!acc[key]) {
          acc[key] = {
            label: `${person?.name || '?'} - ${category.name}`,
            data: {},
            backgroundColor: category.color || 'gray',
            stack: expense.person_id.toString(),
            order: category.order
          };
        }
        
        acc[key].data[expense.month] = (acc[key].data[expense.month] || 0) + expense.amount;
        return acc;
      }, {})
    )
    .sort((a, b) => a.order - b.order)
    .map(dataset => ({
      ...dataset,
      data: months.map(month => dataset.data[month] || 0)
    }))
  };

  const numMonths = months.length;
  
  // Calculer les totaux par catégorie et trier par montant
  const categoryTotals = categories.map(category => {
    const total = expenses
      .filter(e => e.category_id === category.id)
      .reduce((sum, e) => sum + e.amount, 0);
    return {
      category,
      total: numMonths > 0 ? total / numMonths : 0
    };
  }).sort((a, b) => b.total - a.total);

  const doughnutData = {
    labels: categoryTotals.map(ct => ct.category.name),
    datasets: [{
      data: categoryTotals.map(ct => ct.total),
      backgroundColor: categoryTotals.map(ct => ct.category.color)
    }]
  };

  // Données pour le graphique des catégories (top 5)
  const top5Categories = categoryTotals.slice(0, 5);
  const categoryData = {
    labels: top5Categories.map(ct => ct.category.name),
    datasets: [{
      label: 'Montant total',
      data: top5Categories.map(ct => ct.total),
      backgroundColor: top5Categories.map(ct => ct.category.color),
      borderWidth: 0
    }]
  };

  const MonthlyTable: React.FC = () => {
    const [orderedCategories, setOrderedCategories] = useState<Category[]>([]);
    const [draggedCategory, setDraggedCategory] = useState<Category | null>(null);
    const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);

    useEffect(() => {
      setOrderedCategories(categories);
    }, [categories]);

    const handleDragStart = (category: Category) => {
      setDraggedCategory(category);
    };

    const handleDragOver = (e: React.DragEvent, targetCategory: Category) => {
      e.preventDefault();
      if (!draggedCategory || draggedCategory.id === targetCategory.id) return;

      const currentCategories = [...orderedCategories];
      const draggedIndex = currentCategories.findIndex(c => c.id === draggedCategory.id);
      const targetIndex = currentCategories.findIndex(c => c.id === targetCategory.id);

      if (draggedIndex === -1 || targetIndex === -1) return;

      currentCategories.splice(draggedIndex, 1);
      currentCategories.splice(targetIndex, 0, draggedCategory);
      setOrderedCategories(currentCategories);
    };

    const handleDragEnd = () => {
      if (draggedCategory) {
        updateCategoriesOrder(orderedCategories);
      }
      setDraggedCategory(null);
    };

    const calculateMonthTotal = (month: string) => {
      return expenses
        .filter(e => e.month === month)
        .reduce((sum, e) => sum + e.amount, 0);
    };

    const calculatePersonMonthTotal = (month: string, personId: string) => {
      return expenses
        .filter(e => e.month === month && e.person_id === personId)
        .reduce((sum, e) => sum + e.amount, 0);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className={`bg-white ${
          isFullscreen ? 'w-full h-full rounded-none' : 'max-w-[95vw] w-full max-h-[90vh] rounded-lg'
        } overflow-hidden flex flex-col`}>
          <div className="flex justify-between items-center p-6 sticky top-0 bg-white z-10 border-b">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold">Récapitulatif mensuel</h2>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <User size={16} />
                <span>{persons.length} personnes</span>
                <span className="mx-2">•</span>
                <Calendar size={16} />
                <span>{months.length} mois</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleFullscreen}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
              >
                {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
              </button>
              <button
                onClick={handleCloseModal}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <div className="p-6">
              <div className="overflow-x-auto" ref={tableRef}>
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="sticky top-0 left-0 z-20 bg-white p-4 text-left border-b">
                        <div className="font-semibold text-gray-900">Catégories</div>
                      </th>
                      {months.map(month => {
                        const monthTotal = calculateMonthTotal(month);
                        const previousMonth = months[months.indexOf(month) - 1];
                        const previousTotal = previousMonth ? calculateMonthTotal(previousMonth) : 0;
                        const variation = getVariation(monthTotal, previousTotal);

                        return (
                          <th
                            key={month}
                            className={`sticky top-0 z-10 bg-white min-w-[300px] p-4 border-b
                              ${hoveredMonth === month ? 'bg-orange-50' : ''}`}
                            onMouseEnter={() => setHoveredMonth(month)}
                            onMouseLeave={() => setHoveredMonth(null)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-semibold text-gray-900">{month}</div>
                              <button
                                onClick={() => handleCopyMonth(month)}
                                className="p-1.5 text-orange-500 hover:text-orange-600 hover:bg-orange-100 rounded-lg transition-colors"
                                title="Copier ce mois"
                              >
                                <Copy size={16} />
                              </button>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <div className="font-medium text-gray-900">
                                {monthTotal.toFixed(2)} €
                              </div>
                              {variation !== 0 && (
                                <div className={`flex items-center gap-1 ${
                                  variation > 0 ? 'text-red-600' : 'text-green-600'
                                }`}>
                                  {variation > 0 ? (
                                    <ArrowUpRight size={14} />
                                  ) : (
                                    <ArrowDownRight size={14} />
                                  )}
                                  {Math.abs(variation).toFixed(1)}%
                                </div>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t">
                              {persons.map(person => {
                                const personTotal = calculatePersonMonthTotal(month, person.id);
                                return (
                                  <div key={person.id} className="text-sm">
                                    <div className="font-medium text-gray-700">{person.name}</div>
                                    {personTotal > 0 && (
                                      <div className="text-gray-500 mt-1">
                                        {personTotal.toFixed(2)} €
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {orderedCategories.map(category => (
                      <tr
                        key={category.id}
                        className={`group border-b hover:bg-gray-50 transition-colors ${
                          draggedCategory?.id === category.id ? 'opacity-50' : ''
                        }`}
                        draggable
                        onDragStart={() => handleDragStart(category)}
                        onDragOver={(e) => handleDragOver(e, category)}
                        onDragEnd={handleDragEnd}
                      >
                        <td className="sticky left-0 bg-white group-hover:bg-gray-50 z-10 p-4 transition-colors">
                          <div className="flex items-center gap-3">
                            <div
                              className="cursor-move text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded transition-colors"
                              title="Déplacer la catégorie"
                            >
                              <GripVertical size={16} />
                            </div>
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: category.color }}
                              />
                              <span className="font-medium text-gray-900 truncate">
                                {category.name}
                              </span>
                            </div>
                          </div>
                        </td>
                        {months.map(month => {
                          const monthExpenses = expenses.filter(
                            e => e.month === month && e.category_id === category.id
                          );
                          return (
                            <td
                              key={month}
                              className={`p-4 ${hoveredMonth === month ? 'bg-orange-50' : ''}`}
                            >
                              <div className="grid grid-cols-2 gap-4">
                                {persons.map(person => {
                                  const personExpenses = monthExpenses.filter(
                                    e => e.person_id === person.id
                                  );
                                  return (
                                    <div key={person.id} className="space-y-2">
                                      {personExpenses.map(expense => (
                                        <div
                                          key={expense.id}
                                          className="flex items-center justify-between p-2.5 bg-white border rounded-lg hover:border-orange-200 hover:shadow-sm transition-all group/expense"
                                        >
                                          <div className="flex items-center gap-2 min-w-0">
                                            <div className="font-medium text-gray-900">
                                              {expense.amount.toFixed(2)} €
                                            </div>
                                            {expense.comment && (
                                              <div className="text-sm text-gray-500 truncate" title={expense.comment}>
                                                {expense.comment}
                                              </div>
                                            )}
                                          </div>
                                          <div className="flex gap-1 opacity-0 group-hover/expense:opacity-100 transition-opacity">
                                            <button
                                              onClick={() => setEditingExpense(expense)}
                                              className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                                              title="Modifier"
                                            >
                                              <Edit2 size={14} />
                                            </button>
                                            <button
                                              onClick={() => {
                                                if (confirm('Supprimer cette dépense ?')) {
                                                  deleteExpense(expense.id);
                                                }
                                              }}
                                              className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                                              title="Supprimer"
                                            >
                                              <Trash2 size={14} />
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  );
                                })}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {editingExpense && (
          <AddExpenseModal
            isOpen={true}
            onClose={() => setEditingExpense(null)}
            editExpense={editingExpense}
            onEdit={(updatedExpense) => {
              updateExpense(updatedExpense);
              setEditingExpense(null);
            }}
          />
        )}
      </div>
    );
  };

  return (
    <section className="bg-white p-6 rounded-lg shadow-lg mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Graphique des dépenses</h2>
        <button
          onClick={() => setShowMonthlyTable(true)}
          className="flex items-center gap-2 text-orange-500 hover:text-orange-600"
        >
          <Table size={20} />
          Voir le récapitulatif
        </button>
      </div>
      
      <div className="mb-8">
        <div className="w-full max-w-md mx-auto mb-8">
          <Doughnut
            data={doughnutData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  display: false
                },
                tooltip: {
                  callbacks: {
                    label: (context) => {
                      const label = categoryTotals[context.dataIndex].category.name;
                      const value = context.raw as number;
                      return `${label}: ${value.toFixed(2)} €`;
                    }
                  }
                }
              }
            }}
          />
        </div>
        
        <Bar
          data={barData}
          options={{
            responsive: true,
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                callbacks: {
                  label: (context) => {
                    const value = context.raw as number;
                    return `${context.dataset.label}: ${value.toFixed(2)} €`;
                  }
                }
              }
            },
            scales: {
              x: { stacked: true },
              y: {
                stacked: true,
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Montant'
                }
              }
            },
            onClick: (_, elements) => {
              if (elements.length > 0) {
                const monthIndex = elements[0].index;
                setSelectedMonth(months[monthIndex]);
              }
            }
          }}
        />

        {selectedMonth && <SelectedMonthDetails month={selectedMonth} />}
      </div>

      {showMonthlyTable && <MonthlyTable />}

      {editingExpense && !showMonthlyTable && (
        <AddExpenseModal
          isOpen={true}
          onClose={() => setEditingExpense(null)}
          editExpense={editingExpense}
          onEdit={(updatedExpense) => {
            updateExpense(updatedExpense);
            setEditingExpense(null);
          }}
        />
      )}
    </section>
  );
};

export default ExpenseCharts;