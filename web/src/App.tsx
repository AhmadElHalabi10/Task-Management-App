import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import Board from './components/Board';

const queryClient = new QueryClient();

function App() {
  const [username, setUsername] = useState<string>('');
  const [inputValue, setInputValue] = useState<string>('demo');

  useEffect(() => {
    const stored = localStorage.getItem('username');
    if (stored) {
      setUsername(stored);
    } else {
      // Default to demo user for easier testing
      localStorage.setItem('username', 'demo');
      setUsername('demo');
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      localStorage.setItem('username', inputValue.trim());
      setUsername(inputValue.trim());
    }
  };

  if (!username) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 to-blue-700">
        <div className="bg-white rounded-lg shadow-xl p-8 w-96">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Welcome to Task Board
          </h1>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Enter your username
              </label>
              <input
                type="text"
                id="username"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="John Doe"
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Continue
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" richColors />
      <div className="min-h-screen">
        <Board />
      </div>
    </QueryClientProvider>
  );
}

export default App;
