import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const MainConverter: React.FC = () => {
  const [amount, setAmount] = useState<string>('1000');
  const [from, setFrom] = useState('INR');
  const [to, setTo] = useState('USD');
  const [mode, setMode] = useState('earth');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const currencies = ['INR', 'USD', 'EUR', 'GBP', 'JPY'];
  const spaceLocations = ['mars', 'moon', 'titan', 'asteroid'];

  const handleConvert = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/convert`, {
        from,
        to,
        amount: parseFloat(amount),
        mode
      });
      setResult(response.data.data);
    } catch (error) {
      console.error('Conversion error:', error);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="cyber-card">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-cyber-cyan" />
          <span className="neon-text">Quantum Converter</span>
        </h2>

        <div className="flex gap-2 mb-6">
          {['earth', 'space', 'quantum'].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-4 py-2 rounded-lg font-medium capitalize transition-all ${
                mode === m
                  ? 'bg-gradient-to-r from-cyber-cyan to-cyber-purple text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {m === 'earth' ? '🌍 Earth' : m === 'space' ? '🚀 Space' : '⚛️ Quantum'}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Amount (₹ default)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white text-xl"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">From</label>
            <select
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white"
            >
              {currencies.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">To</label>
            <select
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white"
            >
              {mode === 'space' 
                ? spaceLocations.map((loc) => <option key={loc} value={loc}>{loc}</option>)
                : currencies.map((c) => <option key={c} value={c}>{c}</option>)
              }
            </select>
          </div>
        </div>

        <motion.button onClick={handleConvert} disabled={loading} className="cyber-button w-full" whileHover={{ scale: 1.02 }}>
          {loading ? 'Processing...' : '✨ Execute Conversion'}
        </motion.button>

        {result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 p-6 bg-gradient-to-r from-cyber-purple/20 to-cyber-cyan/20 rounded-xl">
            <div className="grid md:grid-cols-2 gap-6">
              <div><p className="text-gray-400 text-sm">Original</p><p className="text-2xl font-bold">{result.original.amount} {result.original.currency}</p></div>
              <div><p className="text-gray-400 text-sm">Converted</p><p className="text-2xl font-bold text-cyber-cyan">{result.converted.amount} {result.converted.currency}</p></div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MainConverter;
