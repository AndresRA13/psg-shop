import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const UserRegistrationChart = ({ data }) => {
  // Format data for the chart
  const formattedData = data.map(item => ({
    date: item.date,
    Registros: item.registrations
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={formattedData}
        margin={{
          top: 10,
          right: 30,
          left: 0,
          bottom: 0,
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
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip 
          labelFormatter={(label) => {
            const date = new Date(label);
            return date.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
          }}
        />
        <Legend />
        <Area 
          type="monotone" 
          dataKey="Registros" 
          stroke="#8b5cf6" 
          fill="#8b5cf6" 
          fillOpacity={0.3}
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default UserRegistrationChart;