import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';

const OrderStatusChart = ({ data }) => {
  // Get status text in Spanish
  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'processing':
        return 'Procesando';
      case 'shipped':
        return 'Enviado';
      case 'delivered':
        return 'Entregado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  // Colors for different statuses
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#f59e0b';
      case 'processing':
        return '#3b82f6';
      case 'shipped':
        return '#8b5cf6';
      case 'delivered':
        return '#10b981';
      case 'cancelled':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  // Format data for the chart
  const formattedData = data.map(item => ({
    name: getStatusText(item.status),
    value: item.count
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={formattedData}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip 
          formatter={(value) => [value, 'Pedidos']}
          labelFormatter={(label) => `Estado: ${label}`}
        />
        <Legend />
        <Bar 
          dataKey="value" 
          name="Número de Pedidos"
        >
          {formattedData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={getStatusColor(data[index].status)} 
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default OrderStatusChart;