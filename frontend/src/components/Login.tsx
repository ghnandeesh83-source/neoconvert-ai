import React from 'react';
import { motion } from 'framer-motion';
import { LogIn, ArrowRight, ShieldCheck } from 'lucide-react';

interface LoginProps {
  onLogin: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const handleDemoLogin = () => {
    // Demo mode for testing without actual Google OAuth
    const demoUser = {
      id: 'demo-user-123',
      name: 'Demo User',
      email: 'demo@neoconvert.ai',
      picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo'
    };
    onLogin(demoUser);
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="cyber-card rounded-2xl p-8 max-w-md w-full mx-4 border border-cyan-500/30"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 mb-4">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold font-display neon-text mb-2">NeoConvert AI</h1>
          <p className="text-gray-400">Access 2035+ currency features</p>
        </div>

        <div className="space-y-4">
          <motion.button
            onClick={handleDemoLogin}
            className="w-full cyber-button py-4 rounded-xl font-bold flex items-center justify-center gap-2 text-lg"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ShieldCheck className="w-5 h-5 text-white" />
            Enter Demo Mode
            <ArrowRight className="w-5 h-5 text-white" />
          </motion.button>
        </div>

        <div className="mt-6 text-center text-xs text-gray-500">
          <div className="flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-green-400" />
            <span className="text-green-400">No authentication required</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
