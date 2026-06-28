import React, { useState } from "react";

function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState([]);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");

  const handleScrape = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSummary([]);
    setTitle("");

    try {
      const response = await fetch("http://localhost:8000/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Something went wrong");
      }

      setTitle(data.title);
      setSummary(data.summary);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Resets the UI back to a clean state
  const handleClear = () => {
    setUrl("");
    setTitle("");
    setSummary([]);
    setError("");
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center p-6 transition-colors duration-300">
      {/* Header section */}
      <header className="max-w-2xl w-full text-center my-12">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          Smart Read Aggregator
        </h1>
        <p className="mt-3 text-lg text-slate-400">
          Paste any long article link below and let Gemini extract the core
          insights in seconds.
        </p>
      </header>

      {/* Input URL Bar */}
      <main className="max-w-2xl w-full bg-slate-800 p-6 rounded-2xl shadow-2xl border border-slate-700/60 backdrop-blur-sm">
        <form onSubmit={handleScrape} className="flex flex-col gap-4">
          {/* URL Input Bar - Full Width */}
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

          {/* Action Buttons Row */}
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 font-semibold py-3 rounded-xl shadow-lg shadow-cyan-500/20 active:scale-95 transition-all text-white disabled:opacity-50 disabled:scale-100 disabled:pointer-events-none"
            >
              {loading ? "Analyzing..." : "Summarize"}
            </button>

            {/* Dedicated Clear Button - Only shows when there's an active link or result */}
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

        {/* Error Handling UI */}
        {error && (
          <div className="mt-5 p-4 bg-red-950/40 border border-red-500/30 rounded-xl text-red-200 text-sm flex gap-2 items-center">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Animated Loading Skeleton */}
        {loading && (
          <div className="mt-8 border-t border-slate-700/60 pt-6 space-y-4 animate-pulse">
            <div className="h-6 bg-slate-700 rounded-md w-3/4 mb-6"></div>
            <div className="h-16 bg-slate-700/50 rounded-xl w-full"></div>
            <div className="h-16 bg-slate-700/50 rounded-xl w-full"></div>
            <div className="h-16 bg-slate-700/50 rounded-xl w-full"></div>
          </div>
        )}

        {/* AI Results Display */}
        {!loading && (title || summary.length > 0) && (
          <div className="mt-8 border-t border-slate-700/60 pt-6 transition-all duration-500 ease-out">
            <h2 className="text-xl font-bold text-slate-100 mb-5 leading-snug">
              {title}
            </h2>
            <ul className="space-y-4">
              {summary.map((bullet, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 text-slate-300 bg-slate-900/40 p-4 rounded-xl border border-slate-700/40 hover:border-slate-600/60 transition-colors duration-200"
                >
                  <span className="text-cyan-400 mt-1 select-none">✦</span>
                  <span className="leading-relaxed">{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Empty State */}
        {!loading && !title && !error && (
          <div className="mt-8 border-t border-slate-700/60 pt-6 text-center text-slate-500 text-sm">
            Your summaries will appear here.
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
