import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const SalesTrendChart = ({ data }) => {
  // Format data for the chart
  const formattedData = data.map(item => ({
    date: item.date,
    Ventas: item.totalSales,
    Pedidos: item.orderCount
  }));

  // Format currency for tooltip
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={formattedData}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => {
            const date = new Date(value);
            return date.toLocaleDateString('es-CO', { month: 'short', day: 'numeric' });
          }}
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => formatCurrency(value)}
        />
        <Tooltip 
          formatter={(value, name) => {
            if (name === 'Ventas') {
              return [formatCurrency(value), 'Ventas'];
            }
            return [value, 'Pedidos'];
          }}
          labelFormatter={(label) => {
            const date = new Date(label);
            return date.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
          }}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="Ventas" 
          stroke="#3b82f6" 
          activeDot={{ r: 8 }} 
          strokeWidth={2}
          name="Ventas"
        />
        <Line 
          type="monotone" 
          dataKey="Pedidos" 
          stroke="#10b981" 
          strokeWidth={2}
          name="Pedidos"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default SalesTrendChart;