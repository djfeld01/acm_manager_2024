"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { name: "A", value: 100 },
  { name: "B", value: 200 },
  { name: "C", value: 150 },
];

export default function SimpleChartTest() {
  console.log("Chart data:", data);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Simple Recharts Test</h1>

      {/* Most basic test */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Most Basic Test</h2>
        <div style={{ width: 400, height: 300, border: "1px solid red" }}>
          <BarChart width={400} height={300} data={data}>
            <Bar dataKey="value" fill="#22c55e" />
            <XAxis dataKey="name" />
            <YAxis />
          </BarChart>
        </div>
      </div>

      {/* Direct Recharts usage */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">With ResponsiveContainer</h2>
        <div style={{ width: "100%", height: 300, border: "1px solid blue" }}>
          <ResponsiveContainer>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Debug info */}
      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">Debug Info:</h3>
        <pre className="text-sm">{JSON.stringify(data, null, 2)}</pre>
        <p className="mt-2 text-sm">Check browser console for data log</p>
      </div>
    </div>
  );
}
