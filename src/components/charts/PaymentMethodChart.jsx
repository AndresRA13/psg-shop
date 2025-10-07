import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const PaymentMethodChart = ({ data }) => {
  // Format data for the chart
  const formattedData = data.map(item => ({
    name: item.method,
    value: item.revenue,
    count: item.count
  }));

  // Colors for the chart
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'];

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
      <PieChart>
        <Pie
          data={formattedData}
          cx="50%"
          cy="50%"
          labelLine={true}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          nameKey="name"
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
        >
          {formattedData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value, name, props) => {
            if (name === 'value') {
              return [formatCurrency(value), 'Ingresos'];
            }
            return [value, 'Pedidos'];
          }}
          labelFormatter={(label) => `Método: ${label}`}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default PaymentMethodChart;