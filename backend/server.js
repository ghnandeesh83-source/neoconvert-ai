const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const OpenAI = require('openai');
const tf = require('@tensorflow/tfjs');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const cookieParser = require('cookie-parser');

dotenv.config();

const app = express();
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Currency API Integration
const EXCHANGE_RATE_API_KEY = process.env.EXCHANGE_RATE_API_KEY || 'demo';
const CURRENCY_API_URL = `https://v6.exchangerate-api.com/v6/${EXCHANGE_RATE_API_KEY}`;

// Cache for exchange rates (5 minute TTL)
const exchangeRateCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getExchangeRates(fromCurrency) {
  const cacheKey = fromCurrency;
  const cached = exchangeRateCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  try {
    const response = await axios.get(`${CURRENCY_API_URL}/latest/${fromCurrency}`);
    const data = response.data;
    
    if (data.result === 'success') {
      exchangeRateCache.set(cacheKey, {
        data: data.conversion_rates,
        timestamp: Date.now()
      });
      return data.conversion_rates;
    }
  } catch (error) {
    console.error('Currency API error:', error.message);
  }
  
  // Fallback to mock rates if API fails
  return {
    USD: 1,
    EUR: 0.85,
    GBP: 0.73,
    INR: 83.5,
    JPY: 110.0
  };
}

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'neoconvert-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, 
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax'
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// ======== GOOGLE OAUTH CONFIGURATION ========
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID || 'demo-client-id',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'demo-client-secret',
  callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/auth/google/callback'
},
(accessToken, refreshToken, profile, done) => {
  // Create or find user
  const user = {
    id: profile.id,
    name: profile.displayName,
    email: profile.emails?.[0]?.value,
    picture: profile.photos?.[0]?.value,
    provider: 'google',
    createdAt: new Date()
  };
  users.set(profile.id, user);
  return done(null, user);
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  const user = users.get(id);
  done(null, user);
});

// Initialize OpenAI (use mock if no key)
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

// In-memory storage (replace with MongoDB in production)
const users = new Map();
const twins = new Map();
const conversions = [];

// ======== ML MODELS ========
// Simple TensorFlow model for stress detection
let stressModel;
async function initStressModel() {
  stressModel = tf.sequential({
    layers: [
      tf.layers.dense({ inputShape: [3], units: 8, activation: 'relu' }),
      tf.layers.dense({ units: 4, activation: 'relu' }),
      tf.layers.dense({ units: 1, activation: 'sigmoid' })
    ]
  });
  stressModel.compile({ optimizer: 'adam', loss: 'binaryCrossentropy' });
  console.log('✅ Stress detection ML model initialized');
}
initStressModel();

// ======== REAL EXCHANGE RATES ========
const realRates = {
  INR: { USD: 0.012, EUR: 0.011, GBP: 0.0095, JPY: 1.77 },
  USD: { INR: 83.12, EUR: 0.92, GBP: 0.79, JPY: 148.5 },
  EUR: { INR: 90.35, USD: 1.09, GBP: 0.86, JPY: 161.4 },
  GBP: { INR: 105.1, USD: 1.27, EUR: 1.16, JPY: 187.3 }
};

// ======== SPACE ECONOMY RATES ========
const spaceRates = {
  earth: { USD: 1, INR: 83.12, EUR: 0.92 },
  mars: { USD: 2.5, INR: 207.8, EUR: 2.3 }, // 2.5x Earth (scarcity)
  moon: { USD: 1.8, INR: 149.6, EUR: 1.66 }, // 1.8x Earth
  titan: { USD: 4.0, INR: 332.5, EUR: 3.68 }, // 4x Earth
  asteroid: { USD: 3.2, INR: 266, EUR: 2.94 }
};

// ======== INDIA PPP DATA (UNIVERSAL VALUE INDEX) ========
const indiaPPPData = {
  bengaluru: { hourlyWage: 85, costOfLiving: 25000, category: 'IT Hub' },
  mumbai: { hourlyWage: 75, costOfLiving: 35000, category: 'Financial' },
  delhi: { hourlyWage: 70, costOfLiving: 30000, category: 'Capital' },
  chennai: { hourlyWage: 65, costOfLiving: 22000, category: 'Manufacturing' },
  hyderabad: { hourlyWage: 68, costOfLiving: 20000, category: 'Tech' },
  pune: { hourlyWage: 62, costOfLiving: 18000, category: 'Auto' },
  kolkata: { hourlyWage: 50, costOfLiving: 15000, category: 'Metro' },
  rural_bihar: { hourlyWage: 25, costOfLiving: 8000, category: 'Agricultural' },
  rural_up: { hourlyWage: 30, costOfLiving: 9000, category: 'Mixed' },
  rural_maharashtra: { hourlyWage: 40, costOfLiving: 12000, category: 'Mixed' }
};

// ======== REALITY SIMULATION DATA ========
const realityData = {
  usa: { rent: 1500, food: 400, transport: 100, utilities: 150, taxRate: 0.24, lifestyle: 'High' },
  uk: { rent: 1200, food: 350, transport: 90, utilities: 120, taxRate: 0.20, lifestyle: 'High' },
  germany: { rent: 900, food: 300, transport: 80, utilities: 100, taxRate: 0.26, lifestyle: 'Medium-High' },
  japan: { rent: 800, food: 350, transport: 100, utilities: 110, taxRate: 0.23, lifestyle: 'High' },
  singapore: { rent: 1400, food: 320, transport: 70, utilities: 90, taxRate: 0.22, lifestyle: 'High' },
  india_bengaluru: { rent: 300, food: 150, transport: 30, utilities: 40, taxRate: 0.30, lifestyle: 'Medium' }
};

// ======== API ROUTES ========

// 1. CONVERT API
app.post('/api/convert', async (req, res) => {
  try {
    const { from, to, amount, mode = 'earth' } = req.body;
    
    let rate, convertedAmount, metadata = {};
    
    switch(mode) {
      case 'earth':
        rate = realRates[from]?.[to] || 1;
        convertedAmount = amount * rate;
        metadata = { type: 'fiat', rate, mode };
        break;
        
      case 'space':
        const earthToUSD = realRates[from]?.USD || 1;
        const usdAmount = amount * earthToUSD;
        const spaceRate = spaceRates[to.toLowerCase()]?.USD || 1;
        convertedAmount = usdAmount / spaceRate;
        rate = 1 / spaceRate;
        metadata = { 
          type: 'space', 
          rate, 
          spaceLocation: to,
          resourceBased: true
        };
        break;
        
      case 'quantum':
        const uncertainty = (Math.random() - 0.5) * 0.1;
        rate = (Math.random() * 2) + uncertainty;
        convertedAmount = amount * rate;
        metadata = { 
          type: 'quantum', 
          rate, 
          uncertainty: uncertainty.toFixed(4),
          quantumEffect: true
        };
        break;
        
      default:
        rate = 1;
        convertedAmount = amount;
        metadata = { type: 'unknown', rate: 1 };
    }
    
    result = {
      original: { amount, currency: from },
      converted: { amount: convertedAmount, currency: to },
      rate: rate.toFixed(4),
      timestamp: new Date().toISOString(),
      metadata
    };

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Conversion error:', error);
    res.status(500).json({ success: false, error: 'Conversion failed' });
  }
});

// 2. AI FINANCIAL TWIN API
app.post('/api/twin', async (req, res) => {
  try {
    const { userData, query, context } = req.body;
    const userId = userData.id || uuidv4();
    
    // Create or update twin
    if (!twins.has(userId)) {
      twins.set(userId, {
        id: userId,
        created: new Date(),
        profile: userData,
        memories: [],
        decisions: []
      });
    }
    
    const twin = twins.get(userId);
    
    // Generate AI response (mock or real)
    let aiResponse;
    if (openai) {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a financial AI twin for a user with these characteristics: ${JSON.stringify(userData)}. Give personalized financial advice in a conversational, thoughtful manner.`
          },
          { role: "user", content: query }
        ]
      });
      aiResponse = completion.choices[0].message.content;
    } else {
      // Mock AI twin response
      aiResponse = generateMockTwinResponse(userData, query, context);
    }
    
    // Store decision memory
    twin.memories.push({
      query,
      response: aiResponse,
      context,
      timestamp: new Date()
    });
    
    // Limit memories to last 50
    if (twin.memories.length > 50) twin.memories.shift();
    
    res.json({
      success: true,
      data: {
        twinId: userId,
        response: aiResponse,
        confidence: Math.floor(Math.random() * 20 + 75), // 75-95%
        alternatives: generateAlternatives(context),
        timestamp: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. UNIVERSAL VALUE INDEX API
app.get('/api/universal/:amount/:location?', (req, res) => {
  try {
    const { amount, location = 'bengaluru' } = req.params;
    const amt = parseFloat(amount);
    
    const locationData = indiaPPPData[location.toLowerCase()] || indiaPPPData.bengaluru;
    const hoursRequired = amt / locationData.hourlyWage;
    
    // Calculate for all locations
    const allLocations = Object.entries(indiaPPPData).map(([city, data]) => ({
      city: city.replace('_', ' ').toUpperCase(),
      hours: (amt / data.hourlyWage).toFixed(1),
      hourlyWage: data.hourlyWage,
      category: data.category,
      costOfLiving: data.costOfLiving
    }));
    
    // Compare with global
    const globalComparison = [
      { country: 'USA', hours: (amt / 1500).toFixed(1), wage: 1500 },
      { country: 'UK', hours: (amt / 1200).toFixed(1), wage: 1200 },
      { country: 'Germany', hours: (amt / 1100).toFixed(1), wage: 1100 },
      { country: 'Japan', hours: (amt / 1000).toFixed(1), wage: 1000 }
    ];
    
    res.json({
      success: true,
      data: {
        amount: amt,
        currency: 'INR',
        selectedLocation: {
          name: location.replace('_', ' ').toUpperCase(),
          hoursRequired: hoursRequired.toFixed(1),
          hourlyWage: locationData.hourlyWage,
          category: locationData.category
        },
        allLocations,
        globalComparison,
        insight: `₹${amt} requires ${hoursRequired.toFixed(1)} hours of work in ${location}, but only ${(amt / 1500).toFixed(1)} hours in USA`
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. REALITY SIMULATION API
app.post('/api/simulate', (req, res) => {
  try {
    const { amount, fromCountry = 'india', toCountry = 'usa', duration = 1 } = req.body;
    const amt = parseFloat(amount);
    
    const reality = realityData[toCountry.toLowerCase()];
    if (!reality) {
      return res.status(400).json({ success: false, error: 'Country not supported' });
    }
    
    const monthlyCosts = reality.rent + reality.food + reality.transport + reality.utilities;
    const taxAmount = amt * reality.taxRate;
    const disposableIncome = amt - taxAmount;
    const monthsSupported = Math.floor(disposableIncome / monthlyCosts);
    
    const lifestyle = {
      rent: { percent: ((reality.rent / monthlyCosts) * 100).toFixed(1), amount: reality.rent },
      food: { percent: ((reality.food / monthlyCosts) * 100).toFixed(1), amount: reality.food },
      transport: { percent: ((reality.transport / monthlyCosts) * 100).toFixed(1), amount: reality.transport },
      utilities: { percent: ((reality.utilities / monthlyCosts) * 100).toFixed(1), amount: reality.utilities }
    };
    
    res.json({
      success: true,
      data: {
        original: { amount: amt, country: fromCountry },
        simulated: {
          country: toCountry.toUpperCase(),
          afterTax: disposableIncome.toFixed(2),
          taxPaid: taxAmount.toFixed(2),
          taxRate: (reality.taxRate * 100).toFixed(0) + '%',
          monthlyCosts,
          monthsSupported,
          lifestyleBreakdown: lifestyle,
          lifestyleCategory: reality.lifestyle,
          verdict: monthsSupported >= duration ? 'Comfortable' : monthsSupported >= duration * 0.5 ? 'Moderate' : 'Struggle'
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. AUTONOMOUS AGENT API
app.post('/api/agent/decide', (req, res) => {
  try {
    const { userId, conditions, proposedAction } = req.body;
    
    // Evaluate conditions
    let shouldExecute = true;
    const reasonLog = [];
    
    if (conditions.minRate && realRates[proposedAction.from]?.[proposedAction.to] < conditions.minRate) {
      shouldExecute = false;
      reasonLog.push(`Rate ${realRates[proposedAction.from][proposedAction.to]} below minimum ${conditions.minRate}`);
    }
    
    if (conditions.maxAmount && proposedAction.amount > conditions.maxAmount) {
      shouldExecute = false;
      reasonLog.push(`Amount exceeds maximum ${conditions.maxAmount}`);
    }
    
    if (conditions.timeWindow) {
      const now = new Date().getHours();
      if (now < conditions.timeWindow.start || now > conditions.timeWindow.end) {
        shouldExecute = false;
        reasonLog.push(`Outside time window ${conditions.timeWindow.start}:00-${conditions.timeWindow.end}:00`);
      }
    }
    
    const decision = {
      id: uuidv4(),
      timestamp: new Date(),
      shouldExecute,
      action: proposedAction,
      confidence: shouldExecute ? Math.floor(Math.random() * 15 + 80) : Math.floor(Math.random() * 20 + 50),
      reasons: reasonLog.length > 0 ? reasonLog : ['All conditions met'],
      requiresApproval: !shouldExecute || proposedAction.amount > 100000
    };
    
    res.json({
      success: true,
      data: decision
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. BIO-ADAPTIVE STRESS API
app.post('/api/stress', async (req, res) => {
  try {
    const { heartRate, hrv, sleepQuality, userId } = req.body;
    
    // Use ML model if available, otherwise use heuristic
    let riskScore;
    
    if (stressModel && heartRate && hrv) {
      const input = tf.tensor2d([[heartRate / 100, hrv / 50, sleepQuality / 8]]);
      const prediction = stressModel.predict(input);
      riskScore = (await prediction.data())[0];
      input.dispose();
      prediction.dispose();
    } else {
      // Heuristic fallback
      riskScore = calculateStressHeuristic(heartRate, hrv, sleepQuality);
    }
    
    const riskLevel = riskScore > 0.7 ? 'HIGH' : riskScore > 0.4 ? 'MODERATE' : 'LOW';
    const maxTransaction = riskScore > 0.7 ? 1000 : riskScore > 0.4 ? 10000 : 100000;
    
    res.json({
      success: true,
      data: {
        riskScore: (riskScore * 100).toFixed(1),
        riskLevel,
        recommendation: riskLevel === 'HIGH' ? 'BLOCK_LARGE_TRANSACTIONS' : riskLevel === 'MODERATE' ? 'LIMIT_RISK' : 'NORMAL',
        maxTransactionAllowed: maxTransaction,
        warningMessage: riskLevel === 'HIGH' ? '⚠️ High stress detected. Large transactions restricted.' : null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 7. QUANTUM PREDICTION API
app.post('/api/quantum', (req, res) => {
  try {
    const { from, to, amount, timeHorizon = 7 } = req.body;
    
    const baseRate = realRates[from]?.[to] || 1;
    const scenarios = [];
    
    // Generate 1000 quantum branches
    for (let i = 0; i < 1000; i++) {
      const randomFactor = 1 + (Math.random() - 0.5) * 0.1; // ±5% volatility
      scenarios.push(amount * baseRate * randomFactor);
    }
    
    scenarios.sort((a, b) => a - b);
    
    res.json({
      success: true,
      data: {
        baseRate,
        timeHorizon: `${timeHorizon} days`,
        superposition: {
          best: { value: scenarios[990].toFixed(2), percentile: '99th' },
          expected: { value: scenarios[500].toFixed(2), percentile: '50th' },
          worst: { value: scenarios[10].toFixed(2), percentile: '1st' },
          confidenceInterval: {
            lower: scenarios[250].toFixed(2),
            upper: scenarios[750].toFixed(2)
          }
        },
        recommendation: scenarios[500] > amount * baseRate ? 'WAIT' : 'CONVERT_NOW',
        quantumState: 'SUPERPOSITION'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 8. ETHICAL ANALYSIS API
app.post('/api/ethical', (req, res) => {
  try {
    const { currency, amount } = req.body;
    
    const ethicalScores = {
      INR: { stability: 85, inclusivity: 70, sustainability: 60, transparency: 75, fairness: 65, overall: 71 },
      USD: { stability: 90, inclusivity: 65, sustainability: 55, transparency: 80, fairness: 60, overall: 70 },
      EUR: { stability: 88, inclusivity: 80, sustainability: 75, transparency: 85, fairness: 78, overall: 81 },
      GBP: { stability: 85, inclusivity: 75, sustainability: 70, transparency: 82, fairness: 72, overall: 77 }
    };
    
    const scores = ethicalScores[currency] || ethicalScores.INR;
    
    res.json({
      success: true,
      data: {
        currency,
        scores,
        grade: scores.overall >= 80 ? 'A' : scores.overall >= 70 ? 'B' : scores.overall >= 60 ? 'C' : 'D',
        impact: scores.overall >= 80 ? 'POSITIVE' : scores.overall >= 60 ? 'NEUTRAL' : 'NEGATIVE',
        recommendation: scores.sustainability < 60 ? 'Consider more sustainable alternatives' : 'Ethical choice'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ======== AUTHENTICATION ROUTES ========

// Google OAuth login
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google OAuth callback
app.get('/auth/google/callback',
  passport.authenticate('google', { 
    failureRedirect: 'http://localhost:3000?error=auth_failed',
    session: true
  }),
  (req, res) => {
    // Successful authentication - save user to session
    if (req.user) {
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.redirect('http://localhost:3000?error=session_failed');
        }
        res.redirect('http://localhost:3000?auth=success');
      });
    } else {
      res.redirect('http://localhost:3000?error=no_user');
    }
  }
);

// Get current user
app.get('/api/user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ success: true, user: req.user });
  } else {
    res.json({ success: false, user: null });
  }
});

// Logout
app.post('/api/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date(), version: '1.0.0' });
});

// Helper functions
function generateMockTwinResponse(userData, query, context) {
  const responses = [
    `As your financial twin, I see you have ${userData.riskTolerance || 'moderate'} risk tolerance. Based on your past patterns, I'd suggest waiting for a better rate. Your confidence score is 78%.`,
    `Analyzing your profile: income ₹${userData.income || '50000'}, goals: ${userData.goals?.join(', ') || 'savings'}. My simulation shows 3 outcomes: Best (+5%), Expected (current), Worst (-3%).`,
    `I've learned from your 50+ past decisions. For this conversion, I recommend: ${context?.amount > 50000 ? 'proceed with caution' : 'execute now'}. Trust score: 85%.`
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

function generateAlternatives(context) {
  return [
    { action: 'CONVERT_NOW', confidence: 75, expectedOutcome: 'Current rate' },
    { action: 'WAIT_24H', confidence: 65, expectedOutcome: '+2% potential' },
    { action: 'SPLIT_AMOUNT', confidence: 80, expectedOutcome: 'Risk distribution' }
  ];
}

function calculateStressHeuristic(heartRate, hrv, sleepQuality) {
  let score = 0.3; // baseline
  if (heartRate > 100) score += 0.3;
  if (hrv < 30) score += 0.2;
  if (sleepQuality < 5) score += 0.2;
  return Math.min(score, 1.0);
}

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 NeoConvert AI Backend running on port ${PORT}`);
  console.log(`📡 API endpoints ready:`);
  console.log(`   POST /api/convert - Currency conversion`);
  console.log(`   POST /api/twin - AI Financial Twin`);
  console.log(`   GET /api/universal/:amount - Universal Value Index`);
  console.log(`   POST /api/simulate - Reality Simulation`);
  console.log(`   POST /api/agent/decide - Autonomous Agent`);
  console.log(`   POST /api/stress - Bio-adaptive stress detection`);
  console.log(`   POST /api/quantum - Quantum predictions`);
  console.log(`   POST /api/ethical - Ethical analysis`);
});
