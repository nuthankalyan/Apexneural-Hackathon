'use client';

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./page.module.css";

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<string[]>([]);
  const [currentAgent, setCurrentAgent] = useState('coordinator');
  const [showDemo, setShowDemo] = useState(false);
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleChatSubmit = () => {
    if (chatInput.trim()) {
      const userMessage = `User: ${chatInput}`;
      const aiResponse = `${currentAgent.charAt(0).toUpperCase() + currentAgent.slice(1)} Agent: Processing your request for "${chatInput}"...`; 
      setChatHistory([...chatHistory, userMessage, aiResponse]);
      setChatInput('');
    }
  };

  const agentTypes = [
    { id: 'coordinator', name: 'Coordinator', color: '#3b82f6', description: 'Orchestrates the entire B2B procurement workflow between agents' },
    { id: 'rfp-generator', name: 'RFP Creator', color: '#10b981', description: 'Drafts comprehensive RFP/RFQ documents based on requirements' },
    { id: 'vendor-matcher', name: 'Vendor Finder', color: '#f59e0b', description: 'Identifies qualified vendors for your specific needs' },
    { id: 'proposal-creator', name: 'Proposal Writer', color: '#8b5cf6', description: 'Generates detailed vendor proposals in response to RFPs' },
    { id: 'evaluator', name: 'Evaluator', color: '#ef4444', description: 'Analyzes proposals against requirements and provides rankings' }
  ];

  const benefits = [
    {
      title: "Time Savings",
      description: "Reduce RFP creation time by 80% and proposal generation by 70%",
      icon: "⏱️"
    },
    {
      title: "Cross-Department Collaboration",
      description: "Connect procurement, finance, and technical teams through a unified platform",
      icon: "🤝"
    },
    {
      title: "Vendor Diversity",
      description: "Discover new qualified vendors you might have overlooked",
      icon: "🌐"
    },
    {
      title: "Compliance Assurance",
      description: "Maintain regulatory compliance in all documentation",
      icon: "✓"
    }
  ];

  return (
    <div className={styles.page} suppressHydrationWarning>
      {/* Navigation Bar */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: 'white',
        padding: '1rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Image
            src="/next.svg"
            alt="Logo"
            width={40}
            height={40}
            priority
          />
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>ProcureAgents</h1>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/login" style={{ textDecoration: 'none' }}>
            <button style={{
              padding: '0.6rem 1.2rem',
              border: '1px solid #3b82f6',
              borderRadius: '0.5rem',
              background: 'transparent',
              color: '#3b82f6',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#f0f7ff'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
              Sign In
            </button>
          </Link>
          <Link href="/signup" style={{ textDecoration: 'none' }}>
            <button style={{
              padding: '0.6rem 1.2rem',
              border: 'none',
              borderRadius: '0.5rem',
              background: '#3b82f6',
              color: 'white',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#2563eb'}
            onMouseOut={(e) => e.currentTarget.style.background = '#3b82f6'}>
              Get Started
            </button>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className={styles.main} style={{ marginTop: '80px' }}>
        {/* Hero Section */}
        <section style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%)',
          borderRadius: '1rem',
          marginBottom: '2rem'
        }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
            AI-Powered B2B Procurement Automation
          </h1>
          <p style={{ fontSize: '1.2rem', color: '#666', maxWidth: '800px', margin: '0 auto 2rem' }}>
            Our collaborative AI agents handle the entire procurement cycle - from RFP/RFQ creation to proposal 
            generation and evaluation - saving your team valuable time and resources.
          </p>
          <div className={styles.ctas}>
            <button 
              style={{ 
                padding: '1rem 2rem', 
                fontSize: '1.1rem',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 6px rgba(59, 130, 246, 0.25)',
                transition: 'all 0.2s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 8px rgba(59, 130, 246, 0.35)';
                e.currentTarget.style.background = '#2563eb';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(59, 130, 246, 0.25)';
                e.currentTarget.style.background = '#3b82f6';
              }}
              onClick={() => setShowDemo(true)}
            >
              View Demo Dashboard
            </button>
            <button 
              style={{ 
                padding: '1rem 2rem', 
                fontSize: '1.1rem',
                background: 'transparent',
                color: '#3b82f6',
                border: '2px solid #3b82f6',
                borderRadius: '0.5rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                marginLeft: '1rem',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#f0f7ff';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              onClick={() => document.getElementById('agents-section')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Meet Our Agents
            </button>
          </div>
          
          <div style={{ marginTop: '3rem', background: 'rgba(255,255,255,0.7)', borderRadius: '0.75rem', padding: '1rem' }}>
            <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Trusted by procurement teams at:</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
              {["Company A", "Company B", "Company C", "Company D"].map((company, i) => (
                <div key={i} style={{ opacity: 0.7, fontSize: '1.1rem', fontWeight: 'bold' }}>{company}</div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section style={{
          padding: '3rem 1rem',
          marginBottom: '2rem',
          background: 'white',
          borderRadius: '1rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}>
          <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Why Choose Our AI Procurement Solution?</h2>
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            justifyContent: 'center',
            gap: '2rem'
          }}>
            {benefits.map((benefit, index) => (
              <div key={index} style={{
                width: '260px',
                padding: '1.5rem',
                borderRadius: '0.75rem',
                background: '#f8fafc',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                transition: 'transform 0.2s ease',
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem', textAlign: 'center' }}>{benefit.icon}</div>
                <h3 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>{benefit.title}</h3>
                <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>{benefit.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Agent Showcase Section */}
        <section id="agents-section" style={{
          padding: '3rem 1rem',
          marginBottom: '2rem',
        }}>
          <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>Our Multi-Agent Ecosystem</h2>
          <p style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto 2rem', color: '#64748b' }}>
            Our AI agents work collaboratively, communicating with each other to handle both sides of the procurement process - 
            from creating RFPs to responding with proposals.
          </p>
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            justifyContent: 'center',
            gap: '2rem'
          }}>
            {agentTypes.map(agent => (
              <div 
                key={agent.id} 
                style={{
                  background: 'white',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  boxShadow: hoveredAgent === agent.id || currentAgent === agent.id 
                    ? `0 8px 16px rgba(0,0,0,0.15), 0 0 0 2px ${agent.color}` 
                    : '0 4px 6px rgba(0,0,0,0.1)',
                  width: '280px',
                  border: `2px solid ${currentAgent === agent.id ? agent.color : 'transparent'}`,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease-in-out',
                  transform: currentAgent === agent.id ? 'scale(1.05)' : 'scale(1)',
                }}
                onClick={() => setCurrentAgent(agent.id)}
                onMouseEnter={() => setHoveredAgent(agent.id)}
                onMouseLeave={() => setHoveredAgent(null)}
              >
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: agent.color,
                  margin: '0 auto 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  transition: 'transform 0.3s ease',
                  transform: hoveredAgent === agent.id ? 'scale(1.1) rotate(5deg)' : 'scale(1)',
                }}>
                  {agent.name.charAt(0)}
                </div>
                <h3 style={{ textAlign: 'center', margin: '0 0 0.5rem' }}>{agent.name}</h3>
                <p style={{ textAlign: 'center', color: '#666', fontSize: '0.9rem' }}>{agent.description}</p>
                {(hoveredAgent === agent.id || currentAgent === agent.id) && (
                  <div style={{
                    textAlign: 'center',
                    marginTop: '1rem',
                  }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.3rem 0.8rem',
                      background: agent.color,
                      color: 'white',
                      borderRadius: '1rem',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      transition: 'all 0.2s ease',
                    }}>
                      {currentAgent === agent.id ? 'Currently Selected' : 'Select Agent'}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Process Visualization */}
        <section style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '1rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '2rem'
        }}>
          <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Two-Sided Procurement Automation</h2>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '2rem',
            position: 'relative'
          }}>
            <div style={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)',
              zIndex: 1,
              background: '#3b82f6',
              color: 'white',
              borderRadius: '50%',
              width: '60px',
              height: '60px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '1.2rem'
            }}>
              AI
            </div>
            
            <div style={{ 
              flex: '1 1 300px', 
              maxWidth: '500px',
              border: '2px solid #3b82f6',
              borderRadius: '0.75rem',
              padding: '1.5rem'
            }}>
              <h3 style={{ textAlign: 'center', marginBottom: '1rem', color: '#3b82f6' }}>RFP/RFQ Creation Side</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  { step: 1, title: 'Requirements Gathering', desc: 'AI collects and refines procurement needs' },
                  { step: 2, title: 'Document Generation', desc: 'Complete RFP/RFQ documents created automatically' },
                  { step: 3, title: 'Vendor Matching', desc: 'System identifies ideal vendors for your needs' },
                ].map((item) => (
                  <div key={item.step} style={{
                    padding: '1rem',
                    background: '#f0f7ff',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}>
                    <div style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      background: '#3b82f6',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold'
                    }}>
                      {item.step}
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 0.25rem', fontSize: '1rem' }}>{item.title}</h4>
                      <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div style={{ 
              flex: '1 1 300px', 
              maxWidth: '500px',
              border: '2px solid #8b5cf6',
              borderRadius: '0.75rem',
              padding: '1.5rem'
            }}>
              <h3 style={{ textAlign: 'center', marginBottom: '1rem', color: '#8b5cf6' }}>Proposal Response Side</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  { step: 1, title: 'RFP/RFQ Analysis', desc: 'AI comprehends requirements and scoring criteria' },
                  { step: 2, title: 'Proposal Creation', desc: 'Vendor-specific responses drafted automatically' },
                  { step: 3, title: 'Review & Optimization', desc: 'AI evaluates proposals for maximum impact' },
                ].map((item) => (
                  <div key={item.step} style={{
                    padding: '1rem',
                    background: '#f5f3ff',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}>
                    <div style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      background: '#8b5cf6',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold'
                    }}>
                      {item.step}
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 0.25rem', fontSize: '1rem' }}>{item.title}</h4>
                      <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Chat Section */}
        <section style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '1rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '2rem'
        }}>
          <h2 style={{ marginBottom: '1rem', textAlign: 'center' }}>
            Chat with {currentAgent.charAt(0).toUpperCase() + currentAgent.slice(1).replace('-', ' ')} Agent
          </h2>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '0.5rem',
              marginBottom: '1rem',
              flexWrap: 'wrap'
            }}>
              {agentTypes.map(agent => (
                <button 
                  key={agent.id}
                  onClick={() => setCurrentAgent(agent.id)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '2rem',
                    border: 'none',
                    background: currentAgent === agent.id ? agent.color : '#f1f5f9',
                    color: currentAgent === agent.id ? 'white' : '#64748b',
                    cursor: 'pointer',
                    margin: '0.25rem',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseOver={(e) => {
                    if (currentAgent !== agent.id) {
                      e.currentTarget.style.background = '#e2e8f0';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (currentAgent !== agent.id) {
                      e.currentTarget.style.background = '#f1f5f9';
                    }
                  }}
                >
                  {agent.name}
                </button>
              ))}
            </div>
            
            <div style={{
              background: '#f9f9f9',
              padding: '1rem',
              borderRadius: '0.5rem',
              height: '300px',
              overflowY: 'auto',
              border: '1px solid #ddd'
            }}>
              {chatHistory.length > 0 ? (
                chatHistory.map((message, index) => (
                  <p key={index} style={{ 
                    margin: '0.5rem 0',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    background: message.startsWith('User:') ? '#e2e8f0' : '#f0f9ff',
                    alignSelf: message.startsWith('User:') ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                    display: 'inline-block',
                    width: 'auto'
                  }}>{message}</p>
                ))
              ) : (
                <div style={{ 
                  color: '#666', 
                  textAlign: 'center', 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  <p>Start a conversation with the {currentAgent.replace('-', ' ')} agent...</p>
                  <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
                    {currentAgent === 'coordinator' && 'Ask about managing your entire procurement workflow'}
                    {currentAgent === 'rfp-generator' && 'Ask about creating professional RFP/RFQ documents'}
                    {currentAgent === 'vendor-matcher' && 'Ask about finding the best vendors for your requirements'}
                    {currentAgent === 'proposal-creator' && 'Ask about generating competitive vendor proposals'}
                    {currentAgent === 'evaluator' && 'Ask about analyzing and scoring vendor submissions'}
                  </div>
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={`Ask the ${currentAgent.replace('-', ' ')} agent...`}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #ddd',
                  transition: 'border 0.2s ease',
                }}
                onFocus={(e) => e.target.style.border = '1px solid #3b82f6'}
                onBlur={(e) => e.target.style.border = '1px solid #ddd'}
                onKeyPress={(e) => e.key === 'Enter' && handleChatSubmit()}
              />
              <button
                onClick={handleChatSubmit}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease',
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#1d4ed8'}
                onMouseOut={(e) => e.currentTarget.style.background = '#2563eb'}
              >
                Send
              </button>
            </div>
          </div>
        </section>

        {/* Dashboard Preview */}
        {showDemo && (
          <section style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '1rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginBottom: '2rem'
          }}>
            <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>B2B Procurement Dashboard</h2>
            <div style={{
              border: '1px solid #ddd',
              borderRadius: '0.5rem',
              padding: '1rem',
              background: '#f8fafc'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '1rem',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div>
                  <h3 style={{ margin: '0 0 0.5rem' }}>Active Projects</h3>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ 
                      background: '#3b82f6',
                      color: 'white',
                      padding: '0.5rem 1rem',
                      borderRadius: '0.25rem',
                      fontWeight: 'bold'
                    }}>RFPs: 4</div>
                    <div style={{ 
                      background: '#10b981',
                      color: 'white',
                      padding: '0.5rem 1rem',
                      borderRadius: '0.25rem',
                      fontWeight: 'bold'
                    }}>RFQs: 7</div>
                    <div style={{ 
                      background: '#8b5cf6',
                      color: 'white',
                      padding: '0.5rem 1rem',
                      borderRadius: '0.25rem',
                      fontWeight: 'bold'
                    }}>Proposals: 12</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button style={{
                    background: '#2563eb',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.25rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <span>+</span> New RFP
                  </button>
                  <button style={{
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.25rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <span>+</span> New Proposal
                  </button>
                </div>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ marginBottom: '0.5rem' }}>Active Procurement Activities</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9' }}>
                      <th style={{ textAlign: 'left', padding: '0.5rem' }}>Project</th>
                      <th style={{ textAlign: 'left', padding: '0.5rem' }}>Type</th>
                      <th style={{ textAlign: 'left', padding: '0.5rem' }}>Status</th>
                      <th style={{ textAlign: 'left', padding: '0.5rem' }}>Agents</th>
                      <th style={{ textAlign: 'left', padding: '0.5rem' }}>Timeline</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { project: 'Enterprise Software', type: 'RFP', status: 'Drafting', agent: 'RFP Creator + Coordinator', days: '2' },
                      { project: 'Cloud Storage', type: 'Proposal', status: 'Response', agent: 'Proposal Writer', days: '5' },
                      { project: 'Office Equipment', type: 'RFQ', status: 'Vendor Selection', agent: 'Vendor Finder', days: '1' },
                      { project: 'Consulting Services', type: 'RFP', status: 'Evaluation', agent: 'Evaluator + Coordinator', days: '3' },
                    ].map((item, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>{item.project}</td>
                        <td style={{ padding: '0.5rem' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '1rem',
                            fontSize: '0.75rem',
                            background: item.type === 'RFP' ? '#dbeafe' :
                                      item.type === 'RFQ' ? '#dcfce7' : '#f3e8ff',
                            color: item.type === 'RFP' ? '#1e40af' :
                                  item.type === 'RFQ' ? '#166534' : '#6b21a8',
                          }}>
                            {item.type}
                          </span>
                        </td>
                        <td style={{ padding: '0.5rem' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '1rem',
                            fontSize: '0.75rem',
                            background: item.status === 'Evaluation' ? '#fef3c7' :
                                      item.status === 'Drafting' ? '#dcfce7' : 
                                      item.status === 'Response' ? '#f3e8ff' : '#dbeafe',
                            color: item.status === 'Evaluation' ? '#854d0e' :
                                  item.status === 'Drafting' ? '#166534' : 
                                  item.status === 'Response' ? '#6b21a8' : '#1e40af',
                          }}>
                            {item.status}
                          </span>
                        </td>
                        <td style={{ padding: '0.5rem', fontSize: '0.9rem' }}>{item.agent}</td>
                        <td style={{ padding: '0.5rem' }}>{item.days} days left</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ flex: '1 1 300px', minWidth: '300px' }}>
                  <h4 style={{ marginBottom: '0.5rem' }}>Agent Activity</h4>
                  <div style={{ 
                    background: '#f1f5f9', 
                    padding: '0.75rem', 
                    borderRadius: '0.5rem',
                    maxHeight: '150px',
                    overflow: 'auto'
                  }}>
                    {[
                      '10:25 AM - Coordinator assigned new RFP to RFP Creator agent',
                      '10:22 AM - Vendor Finder identified 5 potential vendors for Office Equipment RFQ',
                      '10:15 AM - Proposal Writer completed draft for Cloud Storage project',
                      '09:55 AM - Evaluator ranked 3 proposals for Consulting Services RFP'
                    ].map((log, i) => (
                      <div key={i} style={{ 
                        padding: '0.5rem',
                        borderBottom: i < 3 ? '1px solid #e2e8f0' : 'none',
                        fontSize: '0.85rem'
                      }}>
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div style={{ flex: '1 1 300px', minWidth: '300px' }}>
                  <h4 style={{ marginBottom: '0.5rem' }}>Procurement Analytics</h4>
                  <div style={{ 
                    display: 'flex',
                    justifyContent: 'space-around',
                    background: '#f1f5f9',
                    padding: '1rem',
                    borderRadius: '0.5rem'
                  }}>
                    {[
                      { label: 'Time Saved', value: '58 hrs', color: '#3b82f6' },
                      { label: 'Cost Reduced', value: '22%', color: '#10b981' },
                      { label: 'Vendors Found', value: '34', color: '#f59e0b' },
                    ].map((stat, i) => (
                      <div key={i} style={{ textAlign: 'center' }}>
                        <div style={{ 
                          fontSize: '1.5rem', 
                          fontWeight: 'bold',
                          color: stat.color
                        }}>{stat.value}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <button 
                  onClick={() => setShowDemo(false)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'transparent',
                    border: '1px solid #cbd5e1',
                    borderRadius: '0.25rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#f1f5f9';
                    e.currentTarget.style.border = '1px solid #94a3b8';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.border = '1px solid #cbd5e1';
                  }}
                >
                  Close Dashboard Preview
                </button>
              </div>
            </div>
          </section>
        )}
        
        {/* Testimonials/CTA Section */}
        <section style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          padding: '3rem 2rem',
          borderRadius: '1rem',
          color: 'white',
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          <h2 style={{ marginBottom: '1.5rem' }}>Ready to Transform Your Procurement Process?</h2>
          <p style={{ maxWidth: '700px', margin: '0 auto 2rem', fontSize: '1.1rem', opacity: 0.9 }}>
            Join the companies saving thousands of hours and dramatically improving their procurement 
            outcomes with our collaborative AI agent ecosystem.
          </p>
          <button style={{
            padding: '1rem 2.5rem',
            fontSize: '1.2rem',
            background: 'white',
            color: '#2563eb',
            border: 'none',
            borderRadius: '0.5rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 8px rgba(0, 0, 0, 0.2)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
          }}>
            Get Started Now
          </button>
          
          <p style={{ fontSize: '0.9rem', marginTop: '1rem', opacity: 0.8 }}>No credit card required. Free trial available.</p>
        </section>
      </main>
    </div>
  );
}