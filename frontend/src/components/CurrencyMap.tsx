import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Map, Globe2, DollarSign, Euro, PoundSterling, IndianRupee } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

interface Country {
  name: string;
  code: string;
  currency: string;
  flag: string;
  rate: number;
  x: number;
  y: number;
}

const countries: Country[] = [
  { name: 'United States', code: 'USD', currency: 'USD', flag: '🇺🇸', rate: 1, x: 15, y: 35 },
  { name: 'United Kingdom', code: 'GBP', currency: 'GBP', flag: '🇬🇧', rate: 0.79, x: 48, y: 25 },
  { name: 'Germany', code: 'EUR', currency: 'EUR', flag: '🇩🇪', rate: 0.92, x: 52, y: 28 },
  { name: 'Japan', code: 'JPY', currency: 'JPY', flag: '🇯🇵', rate: 149.5, x: 85, y: 32 },
  { name: 'India', code: 'INR', currency: 'INR', flag: '🇮🇳', rate: 83.5, x: 68, y: 45 },
  { name: 'Singapore', code: 'SGD', currency: 'SGD', flag: '🇸🇬', rate: 1.34, x: 78, y: 52 },
  { name: 'Australia', code: 'AUD', currency: 'AUD', flag: '🇦🇺', rate: 1.53, x: 88, y: 75 },
  { name: 'Canada', code: 'CAD', currency: 'CAD', flag: '🇨🇦', rate: 1.36, x: 18, y: 28 },
  { name: 'Brazil', code: 'BRL', currency: 'BRL', flag: '🇧🇷', rate: 5.0, x: 32, y: 65 },
  { name: 'South Africa', code: 'ZAR', currency: 'ZAR', flag: '🇿🇦', rate: 18.5, x: 52, y: 72 },
];

const CurrencyMap: React.FC = () => {
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [amount, setAmount] = useState<number>(100);
  const [fromCurrency] = useState('USD');
  const [convertedAmount, setConvertedAmount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const handleCountryClick = async (country: Country) => {
    setSelectedCountry(country);
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/convert`, {
        from: fromCurrency,
        to: country.currency,
        amount,
        mode: 'earth'
      });
      setConvertedAmount(response.data.data.converted.amount);
    } catch (error) {
      console.error('Conversion error:', error);
    }
    setLoading(false);
  };

  const getCurrencyIcon = (currency: string) => {
    switch (currency) {
      case 'USD': return <DollarSign className="w-4 h-4" />;
      case 'EUR': return <Euro className="w-4 h-4" />;
      case 'GBP': return <PoundSterling className="w-4 h-4" />;
      case 'JPY': return <DollarSign className="w-4 h-4" />;
      case 'INR': return <IndianRupee className="w-4 h-4" />;
      default: return <DollarSign className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="cyber-card p-6"
      >
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Globe2 className="w-6 h-6 text-cyber-cyan" />
          <span className="neon-text">Currency Map</span>
        </h2>

        <div className="mb-6">
          <label className="block text-sm text-gray-400 mb-2">Amount ({fromCurrency})</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white text-xl"
          />
        </div>

        {/* World Map */}
        <div className="relative bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-xl p-4 min-h-[400px] border border-white/10">
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <Map className="w-64 h-64 text-cyber-cyan" />
          </div>

          {countries.map((country) => (
            <motion.button
              key={country.code}
              onClick={() => handleCountryClick(country)}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 p-3 rounded-full transition-all ${
                selectedCountry?.code === country.code
                  ? 'bg-cyber-cyan text-black scale-125 shadow-lg shadow-cyber-cyan/50'
                  : 'bg-white/10 text-white hover:bg-white/20 hover:scale-110'
              }`}
              style={{ left: `${country.x}%`, top: `${country.y}%` }}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.95 }}
              title={country.name}
            >
              <span className="text-2xl">{country.flag}</span>
            </motion.button>
          ))}
        </div>

        <p className="text-center text-gray-400 mt-4 text-sm">
          Click on a country to convert currency
        </p>
      </motion.div>

      {selectedCountry && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="cyber-card p-6"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-cyber-cyan to-cyber-purple flex items-center justify-center text-4xl">
              {selectedCountry.flag}
            </div>
            <div>
              <h3 className="text-2xl font-bold">{selectedCountry.name}</h3>
              <p className="text-gray-400">{selectedCountry.currency}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="bg-black/30 p-4 rounded-lg">
              <p className="text-sm text-gray-400 mb-1">Original Amount</p>
              <p className="text-2xl font-bold flex items-center gap-2">
                {getCurrencyIcon(fromCurrency)}
                {amount} {fromCurrency}
              </p>
            </div>
            <div className="bg-gradient-to-r from-cyber-purple/20 to-cyber-cyan/20 p-4 rounded-lg">
              <p className="text-sm text-gray-400 mb-1">Converted Amount</p>
              <p className="text-2xl font-bold text-cyber-cyan flex items-center gap-2">
                {getCurrencyIcon(selectedCountry.currency)}
                {loading ? '...' : convertedAmount.toFixed(2)} {selectedCountry.currency}
              </p>
            </div>
          </div>

          <div className="bg-black/30 p-4 rounded-lg">
            <p className="text-sm text-gray-400 mb-2">Exchange Rate (1 {fromCurrency} = {selectedCountry.rate} {selectedCountry.currency})</p>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-cyber-cyan to-cyber-purple h-2 rounded-full transition-all"
                style={{ width: `${Math.min(selectedCountry.rate / 150 * 100, 100)}%` }}
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Country List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="cyber-card p-6"
      >
        <h3 className="text-xl font-bold mb-4">All Currencies</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {countries.map((country) => (
            <motion.button
              key={country.code}
              onClick={() => handleCountryClick(country)}
              className={`p-3 rounded-lg text-center transition-all ${
                selectedCountry?.code === country.code
                  ? 'bg-cyber-cyan text-black'
                  : 'bg-black/30 text-white hover:bg-white/10'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="text-2xl mb-1">{country.flag}</div>
              <div className="text-sm font-bold">{country.code}</div>
              <div className="text-xs text-gray-400">{country.currency}</div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default CurrencyMap;
