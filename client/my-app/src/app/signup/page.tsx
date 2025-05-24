'use client';

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Signup() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [apiError, setApiError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setApiError('');
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          username: formData.username,
          password: formData.password,
          confirmPassword: formData.confirmPassword
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Store token in localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        setApiError(data.message || 'Signup failed');
      }
    } catch (error) {
      console.error('Signup error:', error);
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
        maxWidth: '450px'
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
            Create Account
          </h1>
          <p style={{ color: '#6b7280', margin: 0 }}>
            Join ProcureAgents and revolutionize your procurement process
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

        {/* Signup Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Email Field */}
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
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '0.875rem',
                border: `1px solid ${errors.email ? '#ef4444' : '#d1d5db'}`,
                borderRadius: '0.5rem',
                fontSize: '1rem',
                transition: 'border-color 0.2s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.border = `1px solid ${errors.email ? '#ef4444' : '#3b82f6'}`}
              onBlur={(e) => e.target.style.border = `1px solid ${errors.email ? '#ef4444' : '#d1d5db'}`}
              placeholder="Enter your email"
            />
            {errors.email && (
              <p style={{ color: '#ef4444', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
                {errors.email}
              </p>
            )}
          </div>

          {/* Username Field */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: 'bold',
              color: '#374151'
            }}>
              Username
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '0.875rem',
                border: `1px solid ${errors.username ? '#ef4444' : '#d1d5db'}`,
                borderRadius: '0.5rem',
                fontSize: '1rem',
                transition: 'border-color 0.2s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.border = `1px solid ${errors.username ? '#ef4444' : '#3b82f6'}`}
              onBlur={(e) => e.target.style.border = `1px solid ${errors.username ? '#ef4444' : '#d1d5db'}`}
              placeholder="Choose a username"
            />
            {errors.username && (
              <p style={{ color: '#ef4444', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
                {errors.username}
              </p>
            )}
          </div>

          {/* Password Field */}
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
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '0.875rem',
                border: `1px solid ${errors.password ? '#ef4444' : '#d1d5db'}`,
                borderRadius: '0.5rem',
                fontSize: '1rem',
                transition: 'border-color 0.2s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.border = `1px solid ${errors.password ? '#ef4444' : '#3b82f6'}`}
              onBlur={(e) => e.target.style.border = `1px solid ${errors.password ? '#ef4444' : '#d1d5db'}`}
              placeholder="Create a password"
            />
            {errors.password && (
              <p style={{ color: '#ef4444', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
                {errors.password}
              </p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: 'bold',
              color: '#374151'
            }}>
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '0.875rem',
                border: `1px solid ${errors.confirmPassword ? '#ef4444' : '#d1d5db'}`,
                borderRadius: '0.5rem',
                fontSize: '1rem',
                transition: 'border-color 0.2s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.border = `1px solid ${errors.confirmPassword ? '#ef4444' : '#3b82f6'}`}
              onBlur={(e) => e.target.style.border = `1px solid ${errors.confirmPassword ? '#ef4444' : '#d1d5db'}`}
              placeholder="Confirm your password"
            />
            {errors.confirmPassword && (
              <p style={{ color: '#ef4444', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Terms and Conditions */}
          <div style={{ margin: '0.5rem 0' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" required style={{ cursor: 'pointer', marginTop: '0.125rem' }} />
              <span style={{ color: '#6b7280', fontSize: '0.9rem', lineHeight: '1.4' }}>
                I agree to the{' '}
                <Link href="#" style={{ color: '#3b82f6', textDecoration: 'none' }}>
                  Terms of Service
                </Link>
                {' '}and{' '}
                <Link href="#" style={{ color: '#3b82f6', textDecoration: 'none' }}>
                  Privacy Policy
                </Link>
              </span>
            </label>
          </div>

          {/* Submit Button */}
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
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        {/* Login Link */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: '2rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid #e5e7eb'
        }}>
          <p style={{ color: '#6b7280', margin: '0 0 0.5rem' }}>
            Already have an account?
          </p>
          <Link href="/login" style={{
            color: '#3b82f6',
            textDecoration: 'none',
            fontWeight: 'bold',
            fontSize: '1rem'
          }}>
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
}
