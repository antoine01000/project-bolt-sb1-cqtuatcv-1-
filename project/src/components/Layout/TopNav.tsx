import React from 'react';
import useAppStore from '../../store';

export const TopNav: React.FC = () => {
  const setCurrentUser = useAppStore(state => state.setCurrentUser);

  const handleLogout = () => {
    setCurrentUser(null);
  };

  return (
    <div className="flex justify-between items-center bg-white border-b-2 border-orange-400 p-3">
      <h1 className="text-xl text-orange-500 font-bold">Application Budget</h1>
      <button
        onClick={handleLogout}
        className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 transition-colors"
      >
        Déconnexion
      </button>
    </div>
  );
};