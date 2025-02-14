import React, { useState } from 'react';
import useAppStore from '../../store';
import {
  Plus,
  History,
  Trash2,
  Calculator,
  Divide,
  ChevronDown,
  ChevronUp,
  Edit2,
  Target,
  Info,
  Euro,
  Minus,
  StickyNote
} from 'lucide-react';
import { Operation, SubCagnotte, Cagnotte } from '../../types';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  cagnotte: Cagnotte;
  onSave: (content: string) => void;
  onDelete: () => void;
}

const NoteModal: React.FC<NoteModalProps> = ({ isOpen, onClose, cagnotte, onSave, onDelete }) => {
  const [content, setContent] = useState(cagnotte.note?.content || '');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Note pour {cagnotte.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-48 p-4 border rounded-lg mb-4 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          placeholder="Écrivez votre note ici..."
        />

        <div className="flex justify-between">
          {cagnotte.note && (
            <button
              onClick={() => {
                if (confirm('Supprimer cette note ?')) {
                  onDelete();
                  onClose();
                }
              }}
              className="px-4 py-2 text-red-600 hover:text-red-800"
            >
              Supprimer
            </button>
          )}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Annuler
            </button>
            <button
              onClick={() => {
                onSave(content);
                onClose();
              }}
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CagnottesSection: React.FC = () => {
  const { cagnottes, addCagnotte, updateCagnotte, deleteCagnotte, addSubCagnotte, updateSubCagnotteAmount, deleteSubCagnotte, addOrUpdateNote, deleteNote } = useAppStore();
  const [expandedCagnotte, setExpandedCagnotte] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState<'Cagnotte' | 'Dette'>('Cagnotte');
  const [editingAmount, setEditingAmount] = useState<{ id: string; amount: string } | null>(null);
  const [activeNoteModal, setActiveNoteModal] = useState<string | null>(null);

  // Filtrer les cagnottes et les dettes
  const cagnottesItems = cagnottes.filter(item => item.type === 'Cagnotte');
  const dettesItems = cagnottes.filter(item => item.type === 'Dette');

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    addCagnotte(newItemName.trim(), newItemType);
    setNewItemName('');
  };

  const handleAddSubItem = (cagnotteId: string, name: string) => {
    if (!name.trim()) return;
    addSubCagnotte(cagnotteId, name.trim());
  };

  const handleAmountEdit = (item: Cagnotte) => {
    setEditingAmount({ id: item.id, amount: item.amount.toString() });
  };

  const handleAmountSave = async () => {
    if (!editingAmount) return;

    const amount = parseFloat(editingAmount.amount);
    if (isNaN(amount)) {
      alert('Montant invalide');
      return;
    }

    try {
      await updateCagnotte(editingAmount.id, { amount });
      setEditingAmount(null);
    } catch (error) {
      alert('Erreur lors de la mise à jour du montant');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderOperationHistory = (subcagnotte: SubCagnotte) => {
    if (!subcagnotte.operations?.length) {
      return (
        <div className="text-sm text-gray-500 text-center py-2">
          Aucune opération
        </div>
      );
    }

    return (
      <div className="mt-2 space-y-1 text-sm">
        {subcagnotte.operations.map((op, index) => (
          <div
            key={op.id}
            className="flex items-center justify-between p-2 bg-gray-50 rounded text-gray-600"
          >
            <span>{formatDate(op.created_at)}</span>
            <div className="flex items-center gap-2">
              <span className="font-medium text-orange-600">{op.operation}</span>
              <span>
                ({op.previous_amount.toFixed(2)} € → {op.new_amount.toFixed(2)} €)
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderOperationButtons = (subcagnotte: SubCagnotte) => (
    <div className="flex items-center gap-1">
      <button
        onClick={() => handleOperation(subcagnotte, '+')}
        className="p-1.5 text-green-600 hover:bg-green-50 rounded"
        title="Ajouter"
      >
        <Plus size={14} />
      </button>
      <button
        onClick={() => handleOperation(subcagnotte, '-')}
        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
        title="Soustraire"
      >
        <Minus size={14} />
      </button>
      <button
        onClick={() => handleOperation(subcagnotte, '×')}
        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
        title="Multiplier"
      >
        <Calculator size={14} />
      </button>
      <button
        onClick={() => handleOperation(subcagnotte, '÷')}
        className="p-1.5 text-purple-600 hover:bg-purple-50 rounded"
        title="Diviser"
      >
        <Divide size={14} />
      </button>
      <button
        onClick={() => setShowHistory(showHistory === subcagnotte.id ? null : subcagnotte.id)}
        className={`p-1.5 hover:bg-gray-50 rounded ${
          showHistory === subcagnotte.id ? 'text-orange-600' : 'text-gray-600'
        }`}
        title="Historique"
      >
        <History size={14} />
      </button>
      <button
        onClick={() => {
          if (confirm('Supprimer cette sous-cagnotte ?')) {
            deleteSubCagnotte(subcagnotte.id);
          }
        }}
        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
        title="Supprimer"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );

  const handleOperation = (subcagnotte: SubCagnotte, operation: string) => {
    const input = prompt(`Entrez la valeur pour l'opération ${operation} :`);
    if (!input) return;

    const value = parseFloat(input);
    if (isNaN(value)) {
      alert('Valeur invalide');
      return;
    }

    if (operation === '÷' && value === 0) {
      alert('Division par zéro impossible');
      return;
    }

    updateSubCagnotteAmount(subcagnotte.id, operation, value);
  };

  const renderCagnotteItem = (item: Cagnotte) => (
    <div key={item.id} className="border rounded-lg bg-white shadow-sm">
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium">{item.name}</span>
          <span className={`px-2 py-0.5 text-xs rounded ${
            item.type === 'Cagnotte' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {item.type}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {editingAmount?.id === item.id ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.01"
                value={editingAmount.amount}
                onChange={(e) => setEditingAmount({ ...editingAmount, amount: e.target.value })}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAmountSave();
                  }
                }}
                className="w-24 px-2 py-1 border rounded text-right"
                autoFocus
              />
              <button
                onClick={handleAmountSave}
                className="p-1 text-green-600 hover:text-green-800"
              >
                ✓
              </button>
              <button
                onClick={() => setEditingAmount(null)}
                className="p-1 text-red-600 hover:text-red-800"
              >
                ×
              </button>
            </div>
          ) : (
            <>
              <span className="font-medium">{item.amount.toFixed(2)} €</span>
              <button
                onClick={() => handleAmountEdit(item)}
                className="p-1 text-blue-600 hover:text-blue-800"
                title="Modifier le montant"
              >
                <Edit2 size={16} />
              </button>
            </>
          )}
          <button
            onClick={() => setActiveNoteModal(item.id)}
            className={`p-1 ${item.note ? 'text-yellow-500' : 'text-gray-400'} hover:text-yellow-600`}
            title="Note"
          >
            <StickyNote size={16} />
          </button>
          <button
            onClick={() => setExpandedCagnotte(expandedCagnotte === item.id ? null : item.id)}
            className="p-1 text-gray-500 hover:text-gray-700"
          >
            {expandedCagnotte === item.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          <button
            onClick={() => {
              if (confirm('Supprimer cette ' + item.type.toLowerCase() + ' ?')) {
                deleteCagnotte(item.id);
              }
            }}
            className="p-1 text-red-600 hover:text-red-800"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {expandedCagnotte === item.id && (
        <div className="border-t p-3">
          <div className="space-y-2">
            {item.subcagnottes?.map(sub => (
              <div key={sub.id}>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <span className="text-sm font-medium">{sub.name}</span>
                    <span className="ml-2 text-sm text-gray-600">{sub.amount.toFixed(2)} €</span>
                  </div>
                  {renderOperationButtons(sub)}
                </div>
                {showHistory === sub.id && renderOperationHistory(sub)}
              </div>
            ))}
          </div>

          <div className="mt-3 flex gap-2">
            <input
              type="text"
              placeholder={`Nouvelle sous-${item.type.toLowerCase()}`}
              className="flex-1 px-3 py-1.5 text-sm border rounded"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const input = e.currentTarget;
                  handleAddSubItem(item.id, input.value);
                  input.value = '';
                }
              }}
            />
            <button
              onClick={(e) => {
                const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                handleAddSubItem(item.id, input.value);
                input.value = '';
              }}
              className="px-3 py-1.5 bg-orange-500 text-white text-sm rounded hover:bg-orange-600"
            >
              Ajouter
            </button>
          </div>
        </div>
      )}

      {activeNoteModal === item.id && (
        <NoteModal
          isOpen={true}
          onClose={() => setActiveNoteModal(null)}
          cagnotte={item}
          onSave={(content) => addOrUpdateNote(item.id, content)}
          onDelete={() => item.note && deleteNote(item.note.id)}
        />
      )}
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Gestion des Cagnottes et Dettes</h2>

      <form onSubmit={handleAddItem} className="flex gap-2 mb-8">
        <input
          type="text"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          placeholder="Nom de la cagnotte/dette"
          className="flex-1 px-4 py-2 border rounded"
        />
        <select
          value={newItemType}
          onChange={(e) => setNewItemType(e.target.value as 'Cagnotte' | 'Dette')}
          className="px-4 py-2 border rounded bg-gray-50"
        >
          <option value="Cagnotte">Cagnotte</option>
          <option value="Dette">Dette</option>
        </select>
        <button
          type="submit"
          className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 flex items-center gap-2"
        >
          <Plus size={20} />
          Créer
        </button>
      </form>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-green-700 mb-4">Cagnottes</h3>
          <div className="space-y-4">
            {cagnottesItems.map(renderCagnotteItem)}
            {cagnottesItems.length === 0 && (
              <div className="text-center py-8 text-gray-500 bg-white rounded-lg border">
                <Info size={24} className="mx-auto mb-2" />
                <p>Aucune cagnotte créée</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-red-700 mb-4">Dettes</h3>
          <div className="space-y-4">
            {dettesItems.map(renderCagnotteItem)}
            {dettesItems.length === 0 && (
              <div className="text-center py-8 text-gray-500 bg-white rounded-lg border">
                <Info size={24} className="mx-auto mb-2" />
                <p>Aucune dette créée</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};