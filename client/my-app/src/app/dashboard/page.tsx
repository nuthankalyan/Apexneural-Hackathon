'use client';

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  _id: string;
  email: string;
  username: string;
  role: string;
  createdAt: string;
  lastLogin?: string;
  profileData?: {
    company?: string;
    department?: string;
    jobTitle?: string;
  };
}

interface Workspace {
  _id: string;
  name: string;
  description: string;
  createdAt: string;
  owner: {
    _id: string;
    username: string;
    email: string;
  };
  memberCount: number;
  lastActivityAt: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [newWorkspace, setNewWorkspace] = useState({ name: '', description: '' });
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [workspaceError, setWorkspaceError] = useState('');
  // Add state for delete confirmation
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [workspaceToDelete, setWorkspaceToDelete] = useState<Workspace | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Fetch workspaces when user is authenticated
  useEffect(() => {
    if (user && activeTab === 'workspaces') {
      fetchWorkspaces();
    }
  }, [user, activeTab]);

  const fetchWorkspaces = async () => {
    setWorkspaceLoading(true);
    setWorkspaceError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/workspaces', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setWorkspaces(data.workspaces);
      } else {
        setWorkspaceError(data.message || 'Failed to fetch workspaces');
      }
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      setWorkspaceError('Network error. Please try again.');
    } finally {
      setWorkspaceLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newWorkspace.name.trim()) {
      return;
    }

    setCreateLoading(true);
    setWorkspaceError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/workspaces', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newWorkspace.name,
          description: newWorkspace.description || undefined
        })
      });

      const data = await response.json();

      if (data.success) {
        setWorkspaces([data.workspace, ...workspaces]);
        setNewWorkspace({ name: '', description: '' });
        setShowCreateWorkspace(false);
      } else {
        setWorkspaceError(data.message || 'Failed to create workspace');
      }
    } catch (error) {
      console.error('Error creating workspace:', error);
      setWorkspaceError('Network error. Please try again.');
    } finally {
      setCreateLoading(false);
    }
  };

  // Add delete workspace function
  const handleDeleteWorkspace = async () => {
    if (!workspaceToDelete) return;
    
    setDeleteLoading(true);
    setWorkspaceError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/workspaces/${workspaceToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        // Remove deleted workspace from state
        setWorkspaces(workspaces.filter(w => w._id !== workspaceToDelete._id));
        setShowDeleteConfirmation(false);
        setWorkspaceToDelete(null);
      } else {
        setWorkspaceError(data.message || 'Failed to delete workspace');
      }
    } catch (error) {
      console.error('Error deleting workspace:', error);
      setWorkspaceError('Network error. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleWorkspaceClick = (workspaceId: string) => {
    router.push(`/workspace/${workspaceId}`);
  };

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Navigation Bar */}
      <nav style={{
        background: 'white',
        padding: '1rem 2rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ position: 'relative', width: '40px', height: '40px' }}>
            <Image
              src="/logo-aura-ai.jpeg"
              alt="AURA AI Logo"
              width={40}
              height={40}
              priority
              style={{ objectFit: 'contain' }}
            />
          </div>
          <h1 style={{ fontSize: '1.5rem', margin: 0, color: '#1e40af' }}>AURA AI</h1>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: '#6b7280' }}>Welcome, {user.username}!</span>
          <button
            onClick={handleLogout}
            style={{
              padding: '0.5rem 1rem',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              transition: 'background 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#dc2626'}
            onMouseOut={(e) => e.currentTarget.style.background = '#ef4444'}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        padding: '1rem 2rem',
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        marginBottom: '2rem'
      }}>
        <button
          onClick={() => setActiveTab('dashboard')}
          style={{
            padding: '0.75rem 1.5rem',
            fontWeight: 'bold',
            color: activeTab === 'dashboard' ? '#3b82f6' : '#6b7280',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'dashboard' ? '3px solid #3b82f6' : '3px solid transparent',
            cursor: 'pointer'
          }}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('workspaces')}
          style={{
            padding: '0.75rem 1.5rem',
            fontWeight: 'bold',
            color: activeTab === 'workspaces' ? '#3b82f6' : '#6b7280',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'workspaces' ? '3px solid #3b82f6' : '3px solid transparent',
            cursor: 'pointer'
          }}
        >
          Workspaces
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          style={{
            padding: '0.75rem 1.5rem',
            fontWeight: 'bold',
            color: activeTab === 'profile' ? '#3b82f6' : '#6b7280',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'profile' ? '3px solid #3b82f6' : '3px solid transparent',
            cursor: 'pointer'
          }}
        >
          Profile
        </button>
      </div>

      {/* Main Content */}
      <main style={{ padding: '0 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Dashboard View */}
        {activeTab === 'dashboard' && (
          <>
            {/* Welcome Section */}
            <section style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '2rem',
              marginBottom: '2rem',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{ marginBottom: '1rem', color: '#1f2937' }}>Dashboard Overview</h2>
              <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                Welcome to your ProcureAgents dashboard. Manage your procurement processes with AI-powered automation.
              </p>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: '1rem' 
              }}>
                <div style={{
                  background: '#f0f7ff',
                  padding: '1.5rem',
                  borderRadius: '0.75rem',
                  border: '1px solid #dbeafe'
                }}>
                  <h3 style={{ color: '#1e40af', margin: '0 0 0.5rem' }}>Active RFPs</h3>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e40af', margin: 0 }}>3</p>
                </div>
                
                <div style={{
                  background: '#f0fdf4',
                  padding: '1.5rem',
                  borderRadius: '0.75rem',
                  border: '1px solid #bbf7d0'
                }}>
                  <h3 style={{ color: '#166534', margin: '0 0 0.5rem' }}>Active RFQs</h3>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#166534', margin: 0 }}>7</p>
                </div>
                
                <div style={{
                  background: '#fdf4ff',
                  padding: '1.5rem',
                  borderRadius: '0.75rem',
                  border: '1px solid #e9d5ff'
                }}>
                  <h3 style={{ color: '#7c3aed', margin: '0 0 0.5rem' }}>Proposals</h3>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#7c3aed', margin: 0 }}>12</p>
                </div>
                
                <div style={{
                  background: '#fff7ed',
                  padding: '1.5rem',
                  borderRadius: '0.75rem',
                  border: '1px solid #fed7aa'
                }}>
                  <h3 style={{ color: '#c2410c', margin: '0 0 0.5rem' }}>Generated Proposals</h3>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#c2410c', margin: 0 }}>5</p>
                </div>
              </div>
            </section>

            {/* Quick Actions Section */}
            
            {/* Recent Activity Section */}
            <section style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '2rem',
              marginBottom: '2rem',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ marginBottom: '1.5rem', color: '#1f2937' }}>Recent Activity</h3>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                {[
                  { time: '2 hours ago', action: 'Created new RFP for Enterprise Software', status: 'active' },
                  { time: '1 day ago', action: 'Received 3 proposals for Cloud Storage RFQ', status: 'completed' },
                  { time: '2 days ago', action: 'Agent evaluation completed for Office Equipment', status: 'completed' },
                  { time: '3 days ago', action: 'Vendor matching initiated for IT Consulting', status: 'pending' },
                ].map((activity, index) => (
                  <div key={index} style={{
                    padding: '1rem',
                    background: '#f9fafb',
                    borderRadius: '0.5rem',
                    borderLeft: `4px solid ${
                      activity.status === 'active' ? '#3b82f6' : 
                      activity.status === 'completed' ? '#10b981' : '#f59e0b'
                    }`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={{ margin: 0, color: '#1f2937' }}>{activity.action}</p>
                      <span style={{ 
                        color: '#6b7280', 
                        fontSize: '0.875rem',
                        fontWeight: 'bold'
                      }}>
                        {activity.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* Workspaces View */}
        {activeTab === 'workspaces' && (
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '2rem'
            }}>
              <h2 style={{ color: '#1f2937', margin: 0 }}>Your Workspaces</h2>
              <button 
                onClick={() => setShowCreateWorkspace(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.75rem 1.5rem',
                  background: '#4f46e5',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#4338ca'}
                onMouseOut={(e) => e.currentTarget.style.background = '#4f46e5'}
              >
                <span style={{ marginRight: '0.5rem', fontSize: '1.2rem' }}>+</span> Create Session
              </button>
            </div>

            {/* Error Message */}
            {workspaceError && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                marginBottom: '1.5rem',
                fontSize: '0.9rem'
              }}>
                {workspaceError}
              </div>
            )}

            {/* Loading State */}
            {workspaceLoading ? (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '200px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  border: '4px solid #f3f3f3',
                  borderTop: '4px solid #3b82f6',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
              </div>
            ) : (
              /* Workspace List */
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '2rem',
                marginBottom: '2rem'
              }}>
                {workspaces.length > 0 ? workspaces.map(workspace => (
                  <div 
                    key={workspace._id}
                    style={{
                      position: 'relative',
                      background: 'white',
                      borderRadius: '0.5rem',
                      padding: '1.5rem',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      border: '1px solid #e5e7eb',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                      // Show delete button on hover
                      const deleteButton = e.currentTarget.querySelector('.delete-button') as HTMLElement;
                      if (deleteButton) deleteButton.style.opacity = '1';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                      // Hide delete button when not hovering
                      const deleteButton = e.currentTarget.querySelector('.delete-button') as HTMLElement;
                      if (deleteButton) deleteButton.style.opacity = '0';
                    }}
                  >
                    {/* Delete Button */}
                    <div 
                      className="delete-button"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent card click
                        setWorkspaceToDelete(workspace);
                        setShowDeleteConfirmation(true);
                      }}
                      style={{
                        position: 'absolute',
                        top: '0.75rem',
                        right: '0.75rem',
                        background: '#fee2e2',
                        color: '#dc2626',
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        opacity: 0,
                        transition: 'opacity 0.2s ease',
                        zIndex: 2
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </div>

                    {/* Card content - wrap in div to handle click */}
                    <div onClick={() => handleWorkspaceClick(workspace._id)}>
                      <h3 style={{ margin: '0 0 0.5rem', color: '#111827' }}>{workspace.name}</h3>
                      <p style={{ margin: '0 0 1rem', color: '#6b7280', fontSize: '0.9rem' }}>{workspace.description}</p>
                      
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.875rem',
                        color: '#9ca3af'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.5rem' }}>
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                          </svg>
                          Created {new Date(workspace.createdAt).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.25rem' }}>
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                          </svg>
                          {workspace.memberCount} member{workspace.memberCount !== 1 ? 's' : ''}
                        </div>
                      </div>
                      
                      <div style={{ 
                        marginTop: '0.75rem',
                        fontSize: '0.8rem',
                        color: '#6b7280'
                      }}>
                        Owner: {workspace.owner.username}
                      </div>
                    </div>
                  </div>
                )) : (
                  <div style={{
                    gridColumn: '1 / -1',
                    textAlign: 'center',
                    padding: '3rem',
                    color: '#6b7280'
                  }}>
                    <h3>No workspaces found</h3>
                    <p>Create your first workspace to get started!</p>
                  </div>
                )}
              </div>
            )}

            {/* Create Workspace Modal */}
            {showCreateWorkspace && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
              }}>
                <div style={{
                  background: 'white',
                  padding: '2rem',
                  borderRadius: '0.75rem',
                  maxWidth: '500px',
                  width: '100%',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
                }}>
                  <div style={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.5rem'
                  }}>
                    <h3 style={{ margin: 0, color: '#1f2937' }}>Create New Workspace</h3>
                    <button
                      onClick={() => {
                        setShowCreateWorkspace(false);
                        setWorkspaceError('');
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        fontSize: '1.5rem',
                        cursor: 'pointer',
                        color: '#6b7280'
                      }}
                    >
                      &times;
                    </button>
                  </div>

                  {workspaceError && (
                    <div style={{
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      color: '#dc2626',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      marginBottom: '1.5rem',
                      fontSize: '0.9rem'
                    }}>
                      {workspaceError}
                    </div>
                  )}

                  <form onSubmit={handleCreateWorkspace}>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label 
                        htmlFor="name" 
                        style={{ 
                          display: 'block', 
                          marginBottom: '0.5rem', 
                          fontWeight: 'bold',
                          color: '#374151'
                        }}
                      >
                        Workspace Name
                      </label>
                      <input
                        id="name"
                        type="text"
                        value={newWorkspace.name}
                        onChange={(e) => setNewWorkspace({...newWorkspace, name: e.target.value})}
                        placeholder="Enter workspace name"
                        required
                        disabled={createLoading}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.5rem',
                          fontSize: '1rem',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                      <label 
                        htmlFor="description" 
                        style={{ 
                          display: 'block', 
                          marginBottom: '0.5rem', 
                          fontWeight: 'bold',
                          color: '#374151'
                        }}
                      >
                        Description (Optional)
                      </label>
                      <textarea
                        id="description"
                        value={newWorkspace.description}
                        onChange={(e) => setNewWorkspace({...newWorkspace, description: e.target.value})}
                        placeholder="Describe this workspace"
                        disabled={createLoading}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.5rem',
                          fontSize: '1rem',
                          minHeight: '100px',
                          resize: 'vertical',
                          boxSizing: 'border-box'
                        }}
                      ></textarea>
                    </div>

                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'flex-end',
                      gap: '1rem'
                    }}>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreateWorkspace(false);
                          setWorkspaceError('');
                        }}
                        disabled={createLoading}
                        style={{
                          padding: '0.75rem 1.5rem',
                          background: 'white',
                          color: '#6b7280',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.5rem',
                          fontSize: '1rem',
                          cursor: createLoading ? 'not-allowed' : 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={createLoading}
                        style={{
                          padding: '0.75rem 1.5rem',
                          background: createLoading ? '#9ca3af' : '#4f46e5',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.5rem',
                          fontSize: '1rem',
                          cursor: createLoading ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {createLoading ? 'Creating...' : 'Create Workspace'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirmation && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
              }}>
                <div style={{
                  background: 'white',
                  padding: '2rem',
                  borderRadius: '0.75rem',
                  maxWidth: '450px',
                  width: '100%',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
                }}>
                  <h3 style={{ margin: '0 0 1rem', color: '#1f2937' }}>Delete Workspace</h3>
                  
                  <p style={{ margin: '0 0 1.5rem', color: '#4b5563' }}>
                    Are you sure you want to delete <strong>{workspaceToDelete?.name}</strong>? This action cannot be undone and all associated data will be permanently removed.
                  </p>

                  {workspaceError && (
                    <div style={{
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      color: '#dc2626',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      marginBottom: '1.5rem',
                      fontSize: '0.9rem'
                    }}>
                      {workspaceError}
                    </div>
                  )}

                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'flex-end',
                    gap: '1rem'
                  }}>
                    <button
                      onClick={() => {
                        setShowDeleteConfirmation(false);
                        setWorkspaceToDelete(null);
                        setWorkspaceError('');
                      }}
                      disabled={deleteLoading}
                      style={{
                        padding: '0.75rem 1.5rem',
                        background: 'white',
                        color: '#6b7280',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '1rem',
                        cursor: deleteLoading ? 'not-allowed' : 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteWorkspace}
                      disabled={deleteLoading}
                      style={{
                        padding: '0.75rem 1.5rem',
                        background: deleteLoading ? '#9ca3af' : '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        fontSize: '1rem',
                        cursor: deleteLoading ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {deleteLoading ? 'Deleting...' : 'Delete Workspace'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Profile View */}
        {activeTab === 'profile' && (
          <section style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            marginBottom: '2rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ marginBottom: '1.5rem', color: '#1f2937' }}>Profile Information</h3>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: '2rem' 
            }}>
              <div>
                <h4 style={{ marginBottom: '1rem', color: '#374151' }}>Account Details</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <span style={{ fontWeight: 'bold', color: '#6b7280' }}>Email: </span>
                    <span style={{ color: '#1f2937' }}>{user.email}</span>
                  </div>
                  <div>
                    <span style={{ fontWeight: 'bold', color: '#6b7280' }}>Username: </span>
                    <span style={{ color: '#1f2937' }}>{user.username}</span>
                  </div>
                  <div>
                    <span style={{ fontWeight: 'bold', color: '#6b7280' }}>Role: </span>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.5rem',
                      background: user.role === 'admin' ? '#fef3c7' : '#dbeafe',
                      color: user.role === 'admin' ? '#92400e' : '#1e40af',
                      borderRadius: '0.25rem',
                      fontSize: '0.875rem',
                      fontWeight: 'bold'
                    }}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontWeight: 'bold', color: '#6b7280' }}>Member Since: </span>
                    <span style={{ color: '#1f2937' }}>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {user.lastLogin && (
                    <div>
                      <span style={{ fontWeight: 'bold', color: '#6b7280' }}>Last Login: </span>
                      <span style={{ color: '#1f2937' }}>
                        {new Date(user.lastLogin).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h4 style={{ marginBottom: '1rem', color: '#374151' }}>Company Information</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <span style={{ fontWeight: 'bold', color: '#6b7280' }}>Company: </span>
                    <span style={{ color: '#1f2937' }}>{user.profileData?.company || 'Not specified'}</span>
                  </div>
                  <div>
                    <span style={{ fontWeight: 'bold', color: '#6b7280' }}>Department: </span>
                    <span style={{ color: '#1f2937' }}>{user.profileData?.department || 'Not specified'}</span>
                  </div>
                  <div>
                    <span style={{ fontWeight: 'bold', color: '#6b7280' }}>Job Title: </span>
                    <span style={{ color: '#1f2937' }}>{user.profileData?.jobTitle || 'Not specified'}</span>
                  </div>
                  <div style={{ marginTop: '1rem' }}>
                    <button style={{
                      padding: '0.5rem 1rem',
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '0.9rem'
                    }}>
                      Edit Profile
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
