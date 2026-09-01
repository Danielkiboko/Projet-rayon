"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";

interface RevenueData {
  name: string;
  total: number;
}

interface RevenueAreaChartProps {
  data: RevenueData[];
  title?: string;
  color?: string; // Hex color for the area
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a1a1a] border border-white/10 p-3 rounded-lg shadow-xl">
        <p className="text-gray-400 text-sm mb-1">{label}</p>
        <p className="text-white font-bold">${payload[0].value.toFixed(2)}</p>
      </div>
    );
  }
  return null;
};

export default function RevenueAreaChart({ 
  data, 
  title = "Évolution des revenus",
  color = "#3b82f6" // default blue-500
}: RevenueAreaChartProps) {
  
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-72 flex items-center justify-center bg-[#1a1a1a] rounded-2xl border border-white/5">
        <p className="text-gray-500 text-sm">Pas assez de données pour le graphique</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#1a1a1a] border border-white/5 rounded-2xl p-6">
      <h3 className="text-lg font-bold text-white mb-6">{title}</h3>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
            <XAxis 
              dataKey="name" 
              stroke="#6b7280" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false} 
              dy={10}
            />
            <YAxis 
              stroke="#6b7280" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false} 
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="total"
              stroke={color}
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorTotal)"
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
