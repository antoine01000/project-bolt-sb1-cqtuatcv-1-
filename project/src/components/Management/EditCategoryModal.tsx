import React, { useState, useEffect } from 'react';
import useAppStore from '../../store';
import { colorPalette } from '../../utils/colors';

interface EditCategoryModalProps {
  categoryId: number | null;
  onClose: () => void;
}

export const EditCategoryModal: React.FC<EditCategoryModalProps> = ({ categoryId, onClose }) => {
  const { categories, updateCategory } = useAppStore();
  const [mainCategory, setMainCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [subSubCategory, setSubSubCategory] = useState('');
  const [color, setColor] = useState(colorPalette[0].hex);

  useEffect(() => {
    if (categoryId) {
      const category = categories.find(c => c.id === categoryId);
      if (category) {
        const parts = category.name.split(' > ');
        setMainCategory(parts[0] || '');
        setSubCategory(parts[1] || '');
        setSubSubCategory(parts[2] || '');
        setColor(category.color);
      }
    }
  }, [categoryId, categories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!categoryId || !mainCategory.trim()) {
      return;
    }

    const fullName = [
      mainCategory.trim(),
      subCategory.trim(),
      subSubCategory.trim()
    ].filter(Boolean).join(' > ');

    updateCategory(categoryId, fullName, color);
    onClose();
  };

  if (!categoryId) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Modifier la catégorie</h2>
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
              Catégorie principale
            </label>
            <input
              type="text"
              value={mainCategory}
              onChange={(e) => setMainCategory(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sous-catégorie (optionnel)
            </label>
            <input
              type="text"
              value={subCategory}
              onChange={(e) => setSubCategory(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sous-sous-catégorie (optionnel)
            </label>
            <input
              type="text"
              value={subSubCategory}
              onChange={(e) => setSubSubCategory(e.target.value)}
              className="w-full p-2 border rounded"
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
              Mettre à jour
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};