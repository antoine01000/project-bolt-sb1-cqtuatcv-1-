import React, { useState, useMemo } from 'react';
import useAppStore from '../../store';
import { colorPalette } from '../../utils/colors';

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type CategoryLevel = 'main' | 'sub' | 'subsub';

export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({ isOpen, onClose }) => {
  const { categories, addCategory } = useAppStore();
  const [categoryLevel, setCategoryLevel] = useState<CategoryLevel>('main');
  const [selectedMainId, setSelectedMainId] = useState('');
  const [selectedSubId, setSelectedSubId] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [color, setColor] = useState(colorPalette[0].hex);

  // Organiser les catégories par niveaux
  const categoriesHierarchy = useMemo(() => {
    const mainCategories: { id: string; name: string }[] = [];
    const subCategories = new Map<string, { id: string; name: string }[]>();
    const subSubCategories = new Map<string, { id: string; name: string }[]>();
    
    categories.forEach(category => {
      const parts = category.name.split(' > ');
      if (parts.length === 1) {
        mainCategories.push({ id: category.id, name: category.name });
      } else if (parts.length === 2) {
        const mainName = parts[0];
        if (!subCategories.has(mainName)) {
          subCategories.set(mainName, []);
        }
        subCategories.get(mainName)?.push({ id: category.id, name: parts[1] });
      } else if (parts.length === 3) {
        const mainSubName = parts.slice(0, 2).join(' > ');
        if (!subSubCategories.has(mainSubName)) {
          subSubCategories.set(mainSubName, []);
        }
        subSubCategories.get(mainSubName)?.push({ id: category.id, name: parts[2] });
      }
    });
    
    return { mainCategories, subCategories, subSubCategories };
  }, [categories]);

  const getSelectedMainCategory = () => {
    return categories.find(c => c.id === selectedMainId);
  };

  const getSelectedSubCategory = () => {
    return categories.find(c => c.id === selectedSubId);
  };

  const getAvailableSubCategories = () => {
    const mainCategory = getSelectedMainCategory();
    if (!mainCategory) return [];

    return categories
      .filter(c => c.name.startsWith(mainCategory.name + ' > ') && c.name.split(' > ').length === 2)
      .map(c => ({
        id: c.id,
        name: c.name.split(' > ')[1]
      }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCategoryName.trim()) {
      alert('Le nom de la catégorie est requis');
      return;
    }

    let fullName = newCategoryName.trim();

    if (categoryLevel === 'sub') {
      const mainCategory = getSelectedMainCategory();
      if (!mainCategory) {
        alert('Veuillez sélectionner une catégorie principale');
        return;
      }
      fullName = `${mainCategory.name} > ${newCategoryName.trim()}`;
    } else if (categoryLevel === 'subsub') {
      const mainCategory = getSelectedMainCategory();
      const subCategory = getSelectedSubCategory();
      if (!mainCategory || !subCategory) {
        alert('Veuillez sélectionner une catégorie principale et une sous-catégorie');
        return;
      }
      fullName = `${mainCategory.name} > ${subCategory.name.split(' > ')[1]} > ${newCategoryName.trim()}`;
    }

    addCategory(fullName, color);
    
    // Reset form
    setCategoryLevel('main');
    setSelectedMainId('');
    setSelectedSubId('');
    setNewCategoryName('');
    setColor(colorPalette[0].hex);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Ajouter une catégorie</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Niveau de catégorie
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={categoryLevel === 'main'}
                  onChange={() => {
                    setCategoryLevel('main');
                    setSelectedMainId('');
                    setSelectedSubId('');
                  }}
                  className="mr-2"
                />
                Catégorie principale
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={categoryLevel === 'sub'}
                  onChange={() => {
                    setCategoryLevel('sub');
                    setSelectedSubId('');
                  }}
                  className="mr-2"
                />
                Sous-catégorie
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={categoryLevel === 'subsub'}
                  onChange={() => setCategoryLevel('subsub')}
                  className="mr-2"
                />
                Sous-sous-catégorie
              </label>
            </div>
          </div>

          {(categoryLevel === 'sub' || categoryLevel === 'subsub') && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Catégorie principale
              </label>
              <select
                value={selectedMainId}
                onChange={(e) => {
                  setSelectedMainId(e.target.value);
                  setSelectedSubId('');
                }}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Sélectionner une catégorie principale</option>
                {categoriesHierarchy.mainCategories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {categoryLevel === 'subsub' && selectedMainId && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sous-catégorie
              </label>
              <select
                value={selectedSubId}
                onChange={(e) => setSelectedSubId(e.target.value)}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Sélectionner une sous-catégorie</option>
                {getAvailableSubCategories().map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {categoryLevel === 'main' ? 'Nom de la catégorie' : 
               categoryLevel === 'sub' ? 'Nom de la sous-catégorie' : 
               'Nom de la sous-sous-catégorie'}
            </label>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Couleur
            </label>
            <select
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full p-2 border rounded"
              style={{ backgroundColor: color }}
            >
              {colorPalette.map(color => (
                <option
                  key={color.hex}
                  value={color.hex}
                  style={{ backgroundColor: color.hex }}
                >
                  {color.pms} ({color.hex})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              Ajouter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};