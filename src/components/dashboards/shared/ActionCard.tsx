"use client";

import { motion } from "framer-motion";

export type ActionItem = {
  title: string;
  description: string;
  buttonText: string;
  href: string;
  buttonColor?: string; // e.g. "bg-amber-600 hover:bg-amber-700"
  hoverBorderColor?: string; // e.g. "hover:border-amber-500/20"
};

interface ActionCardProps {
  title: string;
  actions: ActionItem[];
  bgGradientColor?: string; // e.g. "bg-amber-500/5"
}

export default function ActionCard({ 
  title, 
  actions, 
  bgGradientColor = "bg-blue-500/5" 
}: ActionCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.4 }}
      className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6 shadow-sm relative overflow-hidden"
    >
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-10 -mt-10 ${bgGradientColor}`} />
      <h2 className="text-base font-semibold text-white mb-4 text-center relative z-10">{title}</h2>
      
      {actions.map((action, idx) => {
        const hoverBorderColor = action.hoverBorderColor || "hover:border-blue-500/20";
        const buttonColor = action.buttonColor || "bg-blue-600 hover:bg-blue-700";
        
        return (
          <div 
            key={idx}
            className={`relative z-10 bg-white/5 rounded-xl p-4 border border-white/5 transition-colors mb-4 cursor-pointer ${hoverBorderColor}`} 
            onClick={() => window.location.href = action.href}
          >
            <h3 className="text-sm font-semibold text-white mb-2">{action.title}</h3>
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              {action.description}
            </p>
            <button className={`${buttonColor} text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors w-full`}>
              {action.buttonText}
            </button>
          </div>
        );
      })}
    </motion.div>
  );
}
