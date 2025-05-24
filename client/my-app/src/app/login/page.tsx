'use client';

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setApiError('');
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        // Store token and user data in localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        setApiError(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setApiError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      {/* Back to Home Link */}
      <Link href="/" style={{
        position: 'absolute',
        top: '2rem',
        left: '2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        color: '#3b82f6',
        textDecoration: 'none',
        fontWeight: 'bold',
        transition: 'color 0.2s ease'
      }}>
        <span>←</span> Back to Home
      </Link>

      <div style={{
        background: 'white',
        borderRadius: '1rem',
        boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
        padding: '3rem 2rem',
        width: '100%',
        maxWidth: '400px'
      }}>
        {/* Logo and Title */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Image
            src="/next.svg"
            alt="ProcureAgents Logo"
            width={50}
            height={50}
            style={{ margin: '0 auto 1rem' }}
          />
          <h1 style={{ 
            fontSize: '1.8rem', 
            margin: '0 0 0.5rem',
            color: '#1f2937'
          }}>
            Welcome Back
          </h1>
          <p style={{ color: '#6b7280', margin: 0 }}>
            Sign in to your ProcureAgents account
          </p>
        </div>

        {/* API Error Message */}
        {apiError && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem',
            fontSize: '0.9rem'
          }}>
            {apiError}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: 'bold',
              color: '#374151'
            }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.875rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                transition: 'border-color 0.2s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.border = '1px solid #3b82f6'}
              onBlur={(e) => e.target.style.border = '1px solid #d1d5db'}
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: 'bold',
              color: '#374151'
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.875rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                transition: 'border-color 0.2s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.border = '1px solid #3b82f6'}
              onBlur={(e) => e.target.style.border = '1px solid #d1d5db'}
              placeholder="Enter your password"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" style={{ cursor: 'pointer' }} />
              <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>Remember me</span>
            </label>
            <Link href="#" style={{
              color: '#3b82f6',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: 'bold'
            }}>
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '0.875rem',
              background: isLoading ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              if (!isLoading) {
                e.currentTarget.style.background = '#2563eb';
              }
            }}
            onMouseOut={(e) => {
              if (!isLoading) {
                e.currentTarget.style.background = '#3b82f6';
              }
            }}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Sign Up Link */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: '2rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid #e5e7eb'
        }}>
          <p style={{ color: '#6b7280', margin: '0 0 0.5rem' }}>
            Don't have an account?
          </p>
          <Link href="/signup" style={{
            color: '#3b82f6',
            textDecoration: 'none',
            fontWeight: 'bold',
            fontSize: '1rem'
          }}>
            Create your account
          </Link>
        </div>
      </div>
    </div>
  );
}
