import React, { useState, useEffect } from 'react';

function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState([]);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  
  // State to hold all saved history items
  const [history, setHistory] = useState([]);

  // Load saved history from localStorage when the app boots up
  useEffect(() => {
    const savedHistory = localStorage.getItem('smart_read_history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  const handleScrape = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSummary([]);
    setTitle('');

    try {
      const response = await fetch('http://localhost:8000/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Something went wrong');
      }

      setTitle(data.title);
      setSummary(data.summary);

      // Add new result to the top of the history list
      const newItem = {
        id: Date.now(),
        title: data.title,
        url: url,
        summary: data.summary
      };
      
      const updatedHistory = [newItem, ...history];
      setHistory(updatedHistory);
      localStorage.setItem('smart_read_history', JSON.stringify(updatedHistory));

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Loads an old item back into active view
  const loadHistoryItem = (item) => {
    setUrl(item.url);
    setTitle(item.title);
    setSummary(item.summary);
    setError('');
  };

  // Clears a single item from the sidebar
  const deleteHistoryItem = (id, e) => {
    e.stopPropagation(); // Stop from clicking the main item container
    const updatedHistory = history.filter(item => item.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem('smart_read_history', JSON.stringify(updatedHistory));
  };

  const handleClear = () => {
    setUrl('');
    setTitle('');
    setSummary([]);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row">
      
      {/* LEFT COLUMN: History Sidebar */}
      <aside className="w-full md:w-80 bg-slate-950 border-b md:border-b-0 md:border-r border-slate-800 p-6 flex flex-col shrink-0">
        <h2 className="text-xl font-bold tracking-wide text-slate-200 mb-4 flex items-center gap-2">
          <span>⏳</span> Recent Summaries
        </h2>
        
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-64 md:max-h-[calc(100vh-120px)]">
          {history.length === 0 ? (
            <p className="text-sm text-slate-500 italic mt-4 text-center">No history cached yet.</p>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                onClick={() => loadHistoryItem(item)}
                className="group relative text-left w-full p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl cursor-pointer transition-all duration-200 flex justify-between items-start gap-2"
              >
                <div className="truncate flex-1">
                  <p className="text-sm font-semibold text-slate-300 group-hover:text-cyan-400 truncate">
                    {item.title}
                  </p>
                  <span className="text-xs text-slate-500 truncate block mt-0.5">
                    {item.url}
                  </span>
                </div>
                <button
                  onClick={(e) => deleteHistoryItem(item.id, e)}
                  className="text-slate-600 hover:text-red-400 text-xs px-1.5 py-0.5 rounded transition-colors duration-200 opacity-0 group-hover:opacity-100"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* RIGHT COLUMN: Main Aggregator Workspace */}
      <div className="flex-1 flex flex-col items-center p-6 lg:p-12 overflow-y-auto">
        <header className="max-w-2xl w-full text-center my-6 md:my-12">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Smart Read Aggregator
          </h1>
          <p className="mt-3 text-base md:text-lg text-slate-400">
            Paste any long article link below and let Gemini extract the core insights in seconds.
          </p>
        </header>

        <main className="max-w-2xl w-full bg-slate-800 p-6 rounded-2xl shadow-2xl border border-slate-700/60 backdrop-blur-sm">
          <form onSubmit={handleScrape} className="flex flex-col gap-4">
            <div className="w-full">
              <input
                type="url"
                required
                placeholder="https://example.com/article-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all shadow-inner"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 font-semibold py-3 rounded-xl shadow-lg shadow-cyan-500/20 active:scale-95 transition-all text-white disabled:opacity-50"
              >
                {loading ? 'Analyzing...' : 'Summarize'}
              </button>

              {(url || title || summary.length > 0) && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-200 font-medium px-5 py-3 rounded-xl active:scale-95 transition-all shadow-md"
                >
                  Clear Fields
                </button>
              )}
            </div>
          </form>

          {error && (
            <div className="mt-5 p-4 bg-red-950/40 border border-red-500/30 rounded-xl text-red-200 text-sm">
              ⚠️ {error}
            </div>
          )}

          {loading && (
            <div className="mt-8 border-t border-slate-700/60 pt-6 space-y-4 animate-pulse">
              <div className="h-6 bg-slate-700 rounded-md w-3/4 mb-6"></div>
              <div className="h-16 bg-slate-700/50 rounded-xl w-full"></div>
              <div className="h-16 bg-slate-700/50 rounded-xl w-full"></div>
              <div className="h-16 bg-slate-700/50 rounded-xl w-full"></div>
            </div>
          )}

          {!loading && (title || summary.length > 0) && (
            <div className="mt-8 border-t border-slate-700/60 pt-6">
              <h2 className="text-xl font-bold text-slate-100 mb-5 leading-snug">{title}</h2>
              <ul className="space-y-4">
                {summary.map((bullet, index) => (
                  <li key={index} className="flex items-start gap-3 text-slate-300 bg-slate-900/40 p-4 rounded-xl border border-slate-700/40">
                    <span className="text-cyan-400 mt-1 select-none">✦</span>
                    <span className="leading-relaxed">{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!loading && !title && !error && (
            <div className="mt-8 border-t border-slate-700/60 pt-6 text-center text-slate-500 text-sm">
              Your summaries will appear here.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;