"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface StatusData {
  name: string;
  value: number;
}

interface StatusPieChartProps {
  data: StatusData[];
  title?: string;
}

// Colors for different statuses
const COLORS = {
  "LIVRE": "#22c55e", // green
  "COMPLETED": "#22c55e",
  "ARRIVED_AWAITING_PAYMENT": "#3b82f6", // blue
  "ACCEPTED": "#eab308", // yellow
  "PENDING": "#eab308",
  "CANCELLED": "#ef4444", // red
  "OCCUPÉES": "#3b82f6", // blue for occupied
  "DISPONIBLES": "#4b5563", // gray for available
  "OTHER": "#8b5cf6" // purple
};

const getColorForStatus = (statusName: string) => {
  const upper = statusName.toUpperCase();
  return COLORS[upper as keyof typeof COLORS] || COLORS["OTHER"];
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a1a1a] border border-white/10 p-3 rounded-lg shadow-xl flex items-center gap-3">
        <div 
          className="w-3 h-3 rounded-full" 
          style={{ backgroundColor: payload[0].payload.fill }} 
        />
        <div>
          <p className="text-gray-400 text-xs mb-1">{payload[0].name}</p>
          <p className="text-white font-bold">{payload[0].value}</p>
        </div>
      </div>
    );
  }
  return null;
};

export default function StatusPieChart({ 
  data, 
  title = "Répartition" 
}: StatusPieChartProps) {
  
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-72 flex items-center justify-center bg-[#1a1a1a] rounded-2xl border border-white/5">
        <p className="text-gray-500 text-sm">Pas assez de données</p>
      </div>
    );
  }

  // Assign colors to data
  const dataWithColors = data.map(item => ({
    ...item,
    fill: getColorForStatus(item.name)
  }));

  return (
    <div className="w-full bg-[#1a1a1a] border border-white/5 rounded-2xl p-6 flex flex-col">
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <div className="flex-1 w-full min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={dataWithColors}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              animationDuration={1500}
            >
              {dataWithColors.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={36} 
              iconType="circle"
              wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
