import React, { useState } from 'react';
import useAppStore from '../../store';

export const AuthPage: React.FC = () => {
  const [showRegister, setShowRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signUp, signIn, loadUserData } = useAppStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (showRegister) {
        if (password !== confirmPassword) {
          throw new Error('Les mots de passe ne correspondent pas.');
        }
        await signUp(email, password);
        await loadUserData();
      } else {
        await signIn(email, password);
        await loadUserData();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-orange-400 to-orange-600 text-white text-center">
      <form onSubmit={handleSubmit} className="w-full max-w-md p-8">
        <h1 className="text-3xl font-bold mb-8">
          {showRegister ? 'Créer un compte' : 'Connexion'}
        </h1>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Adresse email"
            className="w-full p-3 rounded bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
            value={email}
            onChange={(e) => setEmail(e.target.value.trim().toLowerCase())}
            required
          />

          <input
            type="password"
            placeholder="Mot de passe"
            className="w-full p-3 rounded bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {showRegister && (
            <input
              type="password"
              placeholder="Confirmer le mot de passe"
              className="w-full p-3 rounded bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded text-white">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="w-full mt-6 p-3 bg-white text-orange-500 rounded font-semibold hover:bg-white/90 transition-colors disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Chargement...
            </span>
          ) : showRegister ? (
            'Créer un compte'
          ) : (
            'Se connecter'
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setShowRegister(!showRegister);
            setError('');
          }}
          className="mt-4 text-white/80 hover:text-white underline"
        >
          {showRegister
            ? 'Déjà un compte ? Se connecter'
            : 'Pas encore de compte ? Créer un compte'}
        </button>
      </form>
    </div>
  );
};