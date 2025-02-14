import React, { useState } from 'react';
import useAppStore from '../../store';
import { Users, Tags, Plus, Edit2, Trash2 } from 'lucide-react';
import { AddCategoryModal } from './AddCategoryModal';
import { EditCategoryModal } from './EditCategoryModal';

export const ManagementSection: React.FC = () => {
  const { persons, categories, addPerson, deletePerson, updatePerson, deleteCategory } = useAppStore();
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<number | null>(null);
  const [editingPersonId, setEditingPersonId] = useState<number | null>(null);
  const [editingPersonName, setEditingPersonName] = useState('');

  const handleAddPerson = () => {
    const name = prompt('Nom de la nouvelle personne :');
    if (name?.trim()) {
      addPerson(name.trim());
    }
  };

  const handleEditPerson = (id: number, currentName: string) => {
    setEditingPersonId(id);
    setEditingPersonName(currentName);
  };

  const handleSavePersonEdit = () => {
    if (editingPersonId && editingPersonName.trim()) {
      updatePerson(editingPersonId, editingPersonName.trim());
      setEditingPersonId(null);
      setEditingPersonName('');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Section Personnes */}
      <section className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="text-orange-500" />
            <h2 className="text-xl font-bold">Personnes</h2>
          </div>
          <button
            onClick={handleAddPerson}
            className="flex items-center gap-2 bg-orange-500 text-white px-3 py-2 rounded-lg hover:bg-orange-600 transition-colors"
          >
            <Plus size={16} />
            Ajouter
          </button>
        </div>

        <div className="space-y-3">
          {persons.map(person => (
            <div
              key={person.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              {editingPersonId === person.id ? (
                <div className="flex items-center gap-2 flex-grow">
                  <input
                    type="text"
                    value={editingPersonName}
                    onChange={(e) => setEditingPersonName(e.target.value)}
                    className="flex-grow p-2 border rounded"
                    autoFocus
                  />
                  <button
                    onClick={handleSavePersonEdit}
                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    OK
                  </button>
                  <button
                    onClick={() => setEditingPersonId(null)}
                    className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <>
                  <span className="font-medium">{person.name}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditPerson(person.id, person.name)}
                      className="p-1 text-blue-600 hover:text-blue-800"
                      title="Modifier"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Êtes-vous sûr de vouloir supprimer cette personne ?')) {
                          deletePerson(person.id);
                        }
                      }}
                      className="p-1 text-red-600 hover:text-red-800"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Section Catégories */}
      <section className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Tags className="text-orange-500" />
            <h2 className="text-xl font-bold">Catégories</h2>
          </div>
          <button
            onClick={() => setIsAddCategoryModalOpen(true)}
            className="flex items-center gap-2 bg-orange-500 text-white px-3 py-2 rounded-lg hover:bg-orange-600 transition-colors"
          >
            <Plus size={16} />
            Ajouter
          </button>
        </div>

        <div className="space-y-3">
          {categories.map(category => (
            <div
              key={category.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <span className="font-medium">{category.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingCategory(category.id)}
                  className="p-1 text-blue-600 hover:text-blue-800"
                  title="Modifier"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => {
                    if (confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
                      deleteCategory(category.id);
                    }
                  }}
                  className="p-1 text-red-600 hover:text-red-800"
                  title="Supprimer"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <AddCategoryModal
        isOpen={isAddCategoryModalOpen}
        onClose={() => setIsAddCategoryModalOpen(false)}
      />

      <EditCategoryModal
        categoryId={editingCategory}
        onClose={() => setEditingCategory(null)}
      />
    </div>
  );
};