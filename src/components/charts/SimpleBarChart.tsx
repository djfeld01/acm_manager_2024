"use client";

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface SimpleBarChartProps {
  data: Array<{ [key: string]: any }>;
  xKey: string;
  yKey: string;
  title?: string;
  color?: string;
}

export function SimpleBarChart({
  data,
  xKey,
  yKey,
  title,
  color = "#22c55e",
}: SimpleBarChartProps) {
  console.log("SimpleBarChart data:", data);
  console.log("SimpleBarChart keys:", { xKey, yKey });

  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <RechartsBarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Bar dataKey={yKey} fill={color} />
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
