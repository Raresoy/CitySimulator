import React, { useState } from 'react';

function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!username.trim() || !password.trim()) {
      setError('Te rog să completezi toate câmpurile.');
      return;
    }

    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'A apărut o eroare.');
      }

      if (isLogin) {
        onLogin(data.username, data.token);
      } else {
        setSuccess('Contul a fost creat cu succes! Te poți autentifica acum.');
        setIsLogin(true);
        setPassword('');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#060913',
      padding: '20px',
      position: 'relative'
    }}>
      {/* Background grids and shapes for high-fidelity styling */}
      <div style={{
        position: 'absolute',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,212,255,0.15) 0%, transparent 70%)',
        top: '10%',
        left: '20%',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,107,53,0.1) 0%, transparent 70%)',
        bottom: '10%',
        right: '15%',
        zIndex: 0
      }} />

      <div className="cyber-panel" style={{
        width: '100%',
        maxWidth: '400px',
        padding: '30px',
        zIndex: 1,
        boxShadow: '0 0 30px rgba(0, 212, 255, 0.15)',
        animation: 'pulse-accent 4s infinite'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 className="logo" style={{ fontSize: '28px', marginBottom: '8px' }}>
            CITY<span>SIM</span>
          </h2>
          <p style={{ color: '#64748b', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Smart City AI Platform
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'rgba(255, 59, 59, 0.1)',
            border: '1px solid var(--red)',
            color: 'var(--red)',
            borderRadius: '6px',
            padding: '10px 12px',
            fontSize: '13px',
            marginBottom: '16px',
            fontFamily: 'var(--font)'
          }}>
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div style={{
            backgroundColor: 'rgba(0, 255, 136, 0.1)',
            border: '1px solid var(--green)',
            color: 'var(--green)',
            borderRadius: '6px',
            padding: '10px 12px',
            fontSize: '13px',
            marginBottom: '16px',
            fontFamily: 'var(--font)'
          }}>
            ✓ {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Utilizator</label>
            <input
              type="text"
              id="username"
              className="form-control"
              placeholder="Ex: rares"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              autoComplete="username"
            />
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label htmlFor="password">Parolă</label>
            <input
              type="password"
              id="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
          </div>

          <button
            type="submit"
            className="btn primary"
            style={{ width: '100%', padding: '12px', marginBottom: '16px' }}
            disabled={loading}
          >
            {loading ? 'Se procesează...' : isLogin ? 'Autentificare' : 'Înregistrare'}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
          {isLogin ? (
            <span>
              Nu ai cont?{' '}
              <span
                style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: '500' }}
                onClick={() => {
                  setIsLogin(false);
                  setError('');
                }}
              >
                Creează cont
              </span>
            </span>
          ) : (
            <span>
              Ai deja un cont?{' '}
              <span
                style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: '500' }}
                onClick={() => {
                  setIsLogin(true);
                  setError('');
                }}
              >
                Autentifică-te
              </span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default Auth;
