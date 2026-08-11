import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  const [petals, setPetals] = useState([]);

  useEffect(() => {
    const newPetals = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100 + '%',
      animationDuration: (Math.random() * 5 + 4) + 's',
      animationDelay: (Math.random() * 3) + 's',
      width: (Math.random() * 12 + 8) + 'px',
      height: (Math.random() * 12 + 8) + 'px',
    }));
    setPetals(newPetals);
  }, []);

  return (
    <div className="auth-container" style={{
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh', 
        width: '100vw'
    }}>
      <div className="petals-container">
        {petals.map(petal => (
          <div key={petal.id} className="petal" style={{
            left: petal.left,
            animationDuration: petal.animationDuration,
            animationDelay: petal.animationDelay,
            width: petal.width,
            height: petal.height
          }} />
        ))}
      </div>

      <div className="auth-box glass-panel" style={{
          width: '100%', 
          maxWidth: '450px', 
          padding: '40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
      }}>
        <div className="brand" style={{ marginBottom: '24px', justifyContent: 'center' }}>
          <span className="torii-icon" style={{ fontSize: '48px' }}>⛩️</span>
          <h1 style={{ fontSize: '32px' }}>TaskSakura</h1>
        </div>
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
