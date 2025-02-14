import React, { useState } from 'react';
import useAppStore from './store';
import { AuthPage } from './components/Auth/AuthPage';
import { TopNav } from './components/Layout/TopNav';
import ExpenseCharts from './components/Charts/ExpenseCharts';
import { AddExpenseModal } from './components/Expenses/AddExpenseModal';
import { ManagementSection } from './components/Management/ManagementSection';
import { CagnottesSection } from './components/Cagnottes/CagnottesSection';
import { ExpenseAnalysis } from './components/Analysis/ExpenseAnalysis';
import { BarChart, Users, PiggyBank, Plus, TrendingUp } from 'lucide-react';

function App() {
  const currentUser = useAppStore(state => state.currentUser);
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'management' | 'cagnottes' | 'analysis'>('dashboard');

  if (!currentUser) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <TopNav />
      <div className="p-4 max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-orange-100'
              }`}
            >
              <BarChart size={20} />
              Tableau de bord
            </button>
            <button
              onClick={() => setActiveTab('management')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'management'
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-orange-100'
              }`}
            >
              <Users size={20} />
              Gestion
            </button>
            <button
              onClick={() => setActiveTab('cagnottes')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'cagnottes'
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-orange-100'
              }`}
            >
              <PiggyBank size={20} />
              Cagnottes
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'analysis'
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-orange-100'
              }`}
            >
              <TrendingUp size={20} />
              Analyse
            </button>
          </div>
          <button
            onClick={() => setIsAddExpenseModalOpen(true)}
            className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
          >
            <Plus size={20} />
            Ajouter une dépense
          </button>
        </div>
        
        {activeTab === 'dashboard' && <ExpenseCharts />}
        {activeTab === 'management' && <ManagementSection />}
        {activeTab === 'cagnottes' && <CagnottesSection />}
        {activeTab === 'analysis' && <ExpenseAnalysis />}
        
        <AddExpenseModal
          isOpen={isAddExpenseModalOpen}
          onClose={() => setIsAddExpenseModalOpen(false)}
        />
      </div>
    </div>
  );
}

export default App;