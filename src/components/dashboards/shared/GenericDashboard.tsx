"use client";

import { motion } from "framer-motion";
import RevenueAreaChart from "@/components/charts/RevenueAreaChart";
import { ReactNode } from "react";

export interface KpiConfig {
  title: string;
  value: string | number;
  subtitle: string;
  subInfo: string;
  icon: any; // Lucide icon
  alertCondition?: boolean;
}

export interface ActionConfig {
  title: string;
  description: string;
  buttonText: string;
  onClick: () => void;
  isPrimary?: boolean;
}

interface GenericDashboardProps<T> {
  loading: boolean;
  moduleName: string;
  kpis: KpiConfig[];
  chartData: any[];
  chartTitle: string;
  chartColor: string;
  recentItemsTitle?: string;
  recentItemsHeaders?: string[];
  recentItemsData?: T[];
  renderRecentRow?: (item: T) => ReactNode;
  emptyStateMessage?: string;
  actionsTitle: string;
  actions: ActionConfig[];
  rightColumnExtra?: ReactNode;
  bottomExtra?: ReactNode;
}

export default function GenericDashboard<T>({
  loading,
  moduleName,
  kpis,
  chartData,
  chartTitle,
  chartColor,
  recentItemsTitle,
  recentItemsHeaders,
  recentItemsData,
  renderRecentRow,
  emptyStateMessage,
  actionsTitle,
  actions,
  rightColumnExtra,
  bottomExtra
}: GenericDashboardProps<T>) {

  if (loading) {
    return <div className="text-white animate-pulse">Chargement de votre {moduleName}...</div>;
  }

  return (
    <div className="space-y-6">
      
      {/* Top Row KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.4 }}
              className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-5 flex flex-col justify-between h-32 hover:border-emerald-500/10 transition-colors shadow-sm relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-emerald-500/10 transition-colors" />
              <div className="flex justify-between items-start relative z-10">
                <h3 className="text-sm font-semibold text-gray-300">{kpi.title}</h3>
                <Icon size={16} className={kpi.alertCondition ? "text-orange-500" : "text-emerald-500"} />
              </div>
              <div className="mt-2 relative z-10">
                <div className={`text-3xl font-bold ${kpi.alertCondition ? "text-orange-500" : "text-white"}`}>{kpi.value}</div>
                <div className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-wider">{kpi.subtitle}</div>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-xs text-gray-400 relative z-10">
                <span>{kpi.subInfo}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Charts) */}
        <div className="lg:col-span-2 space-y-6">
          <RevenueAreaChart data={chartData} title={chartTitle} color={chartColor} />
          
          {/* Recent Items Section */}
          {recentItemsTitle && recentItemsHeaders && recentItemsData && renderRecentRow && (
            <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-white mb-6">{recentItemsTitle}</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/5 text-xs uppercase tracking-wider text-gray-400 font-semibold">
                      {recentItemsHeaders.map((h, i) => (
                        <th key={h} className={`p-4 ${i === 0 ? 'rounded-tl-xl' : ''}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="text-sm text-gray-300">
                    {recentItemsData.length === 0 ? (
                      <tr>
                        <td colSpan={recentItemsHeaders.length} className="p-8 text-center text-gray-500 font-medium">
                          {emptyStateMessage}
                        </td>
                      </tr>
                    ) : (
                      recentItemsData.map(renderRecentRow)
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Column (Actions) */}
        <div className="space-y-6">
          {rightColumnExtra}
          
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6 shadow-sm relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-10 -mt-10" />
            <h2 className="text-base font-semibold text-white mb-4 text-center relative z-10">{actionsTitle}</h2>
            
            {actions.map((action, i) => (
              <div 
                key={i} 
                className={`relative z-10 bg-white/5 rounded-xl p-4 border border-white/5 hover:border-emerald-500/20 transition-colors cursor-pointer ${i !== actions.length - 1 ? 'mb-4' : ''}`}
                onClick={action.onClick}
              >
                <h3 className="text-sm font-semibold text-white mb-2">{action.title}</h3>
                <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                  {action.description}
                </p>
                <button className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  action.isPrimary 
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}>
                  {action.buttonText}
                </button>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
      
      {bottomExtra}
    </div>
  );
}
