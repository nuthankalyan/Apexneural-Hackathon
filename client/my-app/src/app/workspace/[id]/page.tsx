'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { generateRfpPdf, RfpDocument } from '@/utils/pdfGenerator';

interface Workspace {
  _id: string;
  name: string;
  description: string;
  owner: {
    _id: string;
    username: string;
    email: string;
  };
  memberCount: number;
  createdAt: string;
}

interface Agent {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  status: 'idle' | 'thinking' | 'working' | 'completed';
  progress?: number;
  result?: string;
}

interface RFPProject {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'generating' | 'completed';
  createdAt: string;
  agents: Agent[];
  finalDocument?: string;
  proposal?: {
    status: 'pending' | 'generating' | 'completed';
    document?: string;
    createdAt?: string;
  }
}

export default function WorkspacePage() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.id as string;
  
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  
  // RFP Generator state
  const [showRFPGenerator, setShowRFPGenerator] = useState(false);
  const [userRequest, setUserRequest] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [projects, setProjects] = useState<RFPProject[]>([]);
  const [currentProject, setCurrentProject] = useState<RFPProject | null>(null);

  // Proposal generation state
  const [isGeneratingProposal, setIsGeneratingProposal] = useState(false);
  const [showCompanyInfoForm, setShowCompanyInfoForm] = useState(false);
  const [companyInfo, setCompanyInfo] = useState({
    name: '',
    industry: '',
    experience: '',
    differentiators: ''
  });

  useEffect(() => {
    fetchWorkspace();
  }, [workspaceId]);

  const fetchWorkspace = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/login');
        return;
      }
      
      const response = await fetch(`http://localhost:5000/api/workspaces/${workspaceId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (response.status === 401 || response.status === 403) {
        // Token is invalid or expired, redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
        return;
      }
      
      if (data.success) {
        setWorkspace(data.workspace);
      } else {
        setError(data.message || 'Failed to fetch workspace');
      }
    } catch (error) {
      console.error('Error fetching workspace:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const initializeAgents = (): Agent[] => [
    {
      id: 'coordinator',
      name: 'Coordinator Agent',
      description: 'Orchestrates the RFP generation process',
      color: '#3b82f6',
      icon: '🎯',
      status: 'idle'
    },
    {
      id: 'requirements',
      name: 'Requirements Analyst',
      description: 'Breaks down user intent into structured requirements',
      color: '#10b981',
      icon: '📋',
      status: 'idle'
    },
    {
      id: 'security',
      name: 'Security Specialist',
      description: 'Defines security requirements and compliance needs',
      color: '#ef4444',
      icon: '🔒',
      status: 'idle'
    },
    {
      id: 'scalability',
      name: 'Scalability Expert',
      description: 'Addresses performance and scaling requirements',
      color: '#f59e0b',
      icon: '📈',
      status: 'idle'
    },
    {
      id: 'budget',
      name: 'Budget Analyst',
      description: 'Estimates costs and defines budget constraints',
      color: '#8b5cf6',
      icon: '💰',
      status: 'idle'
    },
    {
      id: 'technical',
      name: 'Technical Architect',
      description: 'Defines technical specifications and constraints',
      color: '#06b6d4',
      icon: '⚙️',
      status: 'idle'
    },
    {
      id: 'compliance',
      name: 'Compliance Officer',
      description: 'Ensures regulatory and legal compliance',
      color: '#84cc16',
      icon: '⚖️',
      status: 'idle'
    },
    {
      id: 'document',
      name: 'Document Generator',
      description: 'Compiles final RFP document',
      color: '#6366f1',
      icon: '📄',
      status: 'idle'
    }
  ];

  const handleGenerateRFP = async () => {
    if (!userRequest.trim()) return;

    setIsGenerating(true);
    const agents = initializeAgents();
    
    const newProject: RFPProject = {
      id: `rfp_${Date.now()}`,
      title: `RFP Project ${projects.length + 1}`,
      description: userRequest,
      status: 'generating',
      createdAt: new Date().toISOString(),
      agents
    };

    setProjects([newProject, ...projects]);
    setCurrentProject(newProject);
    setShowRFPGenerator(false);
    setUserRequest('');

    try {
      // Start the agent workflow
      await runAgentWorkflow(newProject);
    } catch (error) {
      console.error('Error generating RFP:', error);
      // Update project status to failed
      setProjects(prev => prev.map(p => 
        p.id === newProject.id 
          ? { ...p, status: 'draft' as const }
          : p
      ));
    } finally {
      setIsGenerating(false);
    }
  };

  const runAgentWorkflow = async (project: RFPProject) => {
    const updateAgent = (agentId: string, updates: Partial<Agent>) => {
      setProjects(prev => prev.map(p => 
        p.id === project.id 
          ? {
              ...p,
              agents: p.agents.map(a => 
                a.id === agentId ? { ...a, ...updates } : a
              )
            }
          : p
      ));
    };

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // Step 1: Coordinator starts
    updateAgent('coordinator', { status: 'working', progress: 10 });
    await delay(1000);

    // Step 2: Requirements Analyst
    updateAgent('requirements', { status: 'thinking' });
    await delay(500);
    updateAgent('requirements', { status: 'working', progress: 25 });
    
    const requirementsResult = await callGeminiAgent('requirements', project.description);
    updateAgent('requirements', { status: 'completed', progress: 100, result: requirementsResult });
    await delay(1000);

    // Step 3: Parallel agent execution
    const parallelAgents = ['security', 'scalability', 'technical'];
    
    for (const agentId of parallelAgents) {
      updateAgent(agentId, { status: 'thinking' });
      await delay(300);
    }

    const parallelResults = await Promise.all(
      parallelAgents.map(async (agentId) => {
        updateAgent(agentId, { status: 'working', progress: 50 });
        const result = await callGeminiAgent(agentId, project.description, requirementsResult);
        updateAgent(agentId, { status: 'completed', progress: 100, result });
        return { agentId, result };
      })
    );

    await delay(1000);

    // Step 4: Budget and Compliance
    updateAgent('budget', { status: 'working', progress: 75 });
    updateAgent('compliance', { status: 'working', progress: 75 });
    
    const [budgetResult, complianceResult] = await Promise.all([
      callGeminiAgent('budget', project.description, requirementsResult),
      callGeminiAgent('compliance', project.description, requirementsResult)
    ]);

    updateAgent('budget', { status: 'completed', progress: 100, result: budgetResult });
    updateAgent('compliance', { status: 'completed', progress: 100, result: complianceResult });
    await delay(1000);

    // Step 5: Document Generator
    updateAgent('document', { status: 'working', progress: 90 });
    
    const allResults = {
      requirements: requirementsResult,
      budget: budgetResult,
      compliance: complianceResult,
      ...Object.fromEntries(parallelResults.map(r => [r.agentId, r.result]))
    };

    const finalDocument = await generateFinalRFP(project.description, allResults);
    
    updateAgent('document', { status: 'completed', progress: 100, result: finalDocument });
    updateAgent('coordinator', { status: 'completed', progress: 100 });

    // Update project as completed
    setProjects(prev => prev.map(p => 
      p.id === project.id 
        ? { ...p, status: 'completed' as const, finalDocument }
        : p
    ));
  };

  const callGeminiAgent = async (agentType: string, userRequest: string, context?: string): Promise<string> => {
    try {
      const response = await fetch('/api/agents/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentType,
          userRequest,
          context
        }),
      });

      const data = await response.json();
      return data.result || `${agentType} analysis completed`;
    } catch (error) {
      console.error(`Error calling ${agentType} agent:`, error);
      return `${agentType} analysis completed with limited data`;
    }
  };

  const generateFinalRFP = async (userRequest: string, agentResults: Record<string, string>): Promise<string> => {
    try {
      const response = await fetch('/api/agents/generate-rfp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userRequest,
          agentResults
        }),
      });

      const data = await response.json();
      return data.document || 'RFP document generated successfully';
    } catch (error) {
      console.error('Error generating final RFP:', error);
      return 'RFP document generated with limited data';
    }
  };

  const formatTextForPdf = (text: string): string[] => {
    // Split text by sections (headers with numbers)
    const sections = text.split(/(\d+\.\s+[A-Z\s]+)/g).filter(Boolean);
    const formattedSections: string[] = [];
    
    for (let i = 0; i < sections.length; i += 2) {
      const header = sections[i].trim();
      const content = sections[i + 1]?.trim() || '';
      
      formattedSections.push(header);
      
      // Split content into paragraphs and bullet points
      const paragraphs = content.split(/\n\n|\r\n\r\n/).filter(Boolean);
      paragraphs.forEach(para => {
        // Handle bullet points
        if (para.includes('•') || para.includes('*') || para.includes('-')) {
          const bulletPoints = para.split(/\n/).filter(Boolean);
          bulletPoints.forEach(point => {
            formattedSections.push(`   ${point.trim()}`);
          });
        } else {
          formattedSections.push(para);
        }
      });
      
      formattedSections.push(''); // Add empty line between sections
    }
    
    return formattedSections;
  };

  const handleDownloadPdf = () => {
    if (!currentProject?.finalDocument || !workspace) return;
    
    try {
      // Improve the content formatting for better PDF structure
      const cleanContent = currentProject.finalDocument
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n') // Replace excessive newlines
        // Format section headers
        .replace(/^(\d+)\.\s+([A-Z][A-Z\s]+)$/gm, `### $1. $2`)
        // Format subsection headings
        .replace(/^(\d+\.\d+)\s+([A-Za-z][A-Za-z\s]+)$/gm, `$1 $2`) 
        // Add paragraph breaks between distinct sections
        .replace(/(\n[^\n]+:)\n([A-Z])/g, '$1\n\n$2')
        .trim();
      
      const rfpDocument: RfpDocument = {
        title: currentProject.title,
        description: currentProject.description,
        content: cleanContent,
        createdAt: currentProject.createdAt,
        createdBy: workspace.owner.username,
      };
      
      // Generate PDF
      const pdf = generateRfpPdf(rfpDocument, {
        title: 'REQUEST FOR PROPOSAL',
        subtitle: currentProject.title,
        author: workspace.owner.username,
        subject: 'RFP Document',
        keywords: 'procurement, rfp, proposal, requirements',
        pageSize: 'a4',
        orientation: 'portrait'
      });
      
      // Save the PDF
      const fileName = `RFP_${currentProject.title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('There was an error generating the PDF. Please try again.');
    }
  };

  const handleGenerateProposal = async (rfpProject: RFPProject) => {
    if (!rfpProject.finalDocument || isGeneratingProposal) return;
    
    try {
      setIsGeneratingProposal(true);
      
      // Update project status to show generating proposal
      const updatedProject: RFPProject = {
        ...rfpProject,
        proposal: {
          status: 'generating',
          createdAt: new Date().toISOString()
        }
      };
      
      setProjects(prev => prev.map(p => p.id === rfpProject.id ? updatedProject : p));
      setCurrentProject(updatedProject);
      
      // Hide company info form
      setShowCompanyInfoForm(false);
      
      // Call the proposal generator API
      const response = await fetch('/api/agents/generate-proposal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rfpDocument: rfpProject.finalDocument,
          companyInfo
        }),
      });

      const data = await response.json();
      
      if (data.success && data.proposal) {
        // Update the project with the generated proposal
        const completedProject: RFPProject = {
          ...updatedProject,
          proposal: {
            status: 'completed',
            document: data.proposal,
            createdAt: new Date().toISOString()
          }
        };
        
        setProjects(prev => prev.map(p => p.id === rfpProject.id ? completedProject : p));
        setCurrentProject(completedProject);
      } else {
        throw new Error(data.error || 'Failed to generate proposal');
      }
    } catch (error) {
      console.error('Error generating proposal:', error);
      alert('Failed to generate proposal. Please try again.');
      
      // Reset project proposal status
      const resetProject: RFPProject = {
        ...rfpProject,
        proposal: {
          status: 'pending'
        }
      };
      
      setProjects(prev => prev.map(p => p.id === rfpProject.id ? resetProject : p));
      setCurrentProject(resetProject);
    } finally {
      setIsGeneratingProposal(false);
    }
  };
  
  const handleDownloadProposal = () => {
    if (!currentProject?.proposal?.document || !workspace) return;
    
    try {
      // Clean up the content - normalize line endings
      const cleanContent = currentProject.proposal.document
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n') // Replace excessive newlines
        .trim();
      
      const rfpDocument: RfpDocument = {
        title: `Proposal for: ${currentProject.title}`,
        description: `Proposal in response to RFP: ${currentProject.description}`,
        content: cleanContent,
        createdAt: currentProject.proposal.createdAt || new Date().toISOString(),
        createdBy: workspace.owner.username,
      };
      
      // Generate PDF
      const pdf = generateRfpPdf(rfpDocument, {
        title: 'PROPOSAL DOCUMENT',
        subtitle: `Proposal for: ${currentProject.title}`,
        author: workspace.owner.username,
        subject: 'Proposal Document',
        keywords: 'procurement, proposal, response, quotation',
        pageSize: 'a4',
        orientation: 'portrait'
      });
      
      // Save the PDF
      const fileName = `Proposal_${currentProject.title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('There was an error generating the PDF. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div>Loading workspace...</div>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div>Error: {error || 'Workspace not found'}</div>
        <Link href="/dashboard">
          <button style={{
            padding: '0.5rem 1rem',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem'
          }}>
            Back to Dashboard
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Navigation */}
      <nav style={{
        background: 'white',
        padding: '1rem 2rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/dashboard" style={{ textDecoration: 'none', color: '#6b7280' }}>
            ← Back to Dashboard
          </Link>
          <div style={{ width: '1px', height: '20px', background: '#e5e7eb' }}></div>
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>{workspace.name}</h1>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>
            Owner: {workspace.owner.username}
          </span>
        </div>
      </nav>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        padding: '1rem 2rem',
        background: 'white',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <button
          onClick={() => setActiveTab('overview')}
          style={{
            padding: '0.75rem 1.5rem',
            fontWeight: 'bold',
            color: activeTab === 'overview' ? '#3b82f6' : '#6b7280',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'overview' ? '3px solid #3b82f6' : '3px solid transparent',
            cursor: 'pointer'
          }}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('rfp-generator')}
          style={{
            padding: '0.75rem 1.5rem',
            fontWeight: 'bold',
            color: activeTab === 'rfp-generator' ? '#3b82f6' : '#6b7280',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'rfp-generator' ? '3px solid #3b82f6' : '3px solid transparent',
            cursor: 'pointer'
          }}
        >
          RFP Generator
        </button>
      </div>

      {/* Main Content */}
      <main style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
        {activeTab === 'overview' && (
          <div>
            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '2rem',
              marginBottom: '2rem',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{ marginBottom: '1rem' }}>Workspace Overview</h2>
              <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                {workspace.description}
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                <div style={{
                  background: '#f0f7ff',
                  padding: '1.5rem',
                  borderRadius: '0.75rem',
                  border: '1px solid #dbeafe'
                }}>
                  <h3 style={{ color: '#1e40af', margin: '0 0 0.5rem' }}>RFP Projects</h3>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e40af', margin: 0 }}>
                    {projects.length}
                  </p>
                </div>
                
                <div style={{
                  background: '#f0fdf4',
                  padding: '1.5rem',
                  borderRadius: '0.75rem',
                  border: '1px solid #bbf7d0'
                }}>
                  <h3 style={{ color: '#166534', margin: '0 0 0.5rem' }}>Completed</h3>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#166534', margin: 0 }}>
                    {projects.filter(p => p.status === 'completed').length}
                  </p>
                </div>
              </div>
            </div>

            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '2rem',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ marginBottom: '1rem' }}>Quick Actions</h3>
              <button
                onClick={() => setActiveTab('rfp-generator')}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Generate New RFP
              </button>
            </div>
          </div>
        )}

        {activeTab === 'rfp-generator' && (
          <div>
            {/* Header */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '2rem'
            }}>
              <div>
                <h2 style={{ margin: '0 0 0.5rem' }}>RFP Generator</h2>
                <p style={{ color: '#6b7280', margin: 0 }}>
                  AI-powered RFP generation with specialized agents
                </p>
              </div>
              <button
                onClick={() => setShowRFPGenerator(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                <span>+</span> New RFP Request
              </button>
            </div>

            {/* Active Project Display */}
            {currentProject && (
              <div style={{
                background: 'white',
                borderRadius: '1rem',
                padding: '2rem',
                marginBottom: '2rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.5rem'
                }}>
                  <h3>{currentProject.title}</h3>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '1rem',
                    fontSize: '0.875rem',
                    fontWeight: 'bold',
                    background: currentProject.status === 'completed' ? '#dcfce7' : 
                               currentProject.status === 'generating' ? '#fef3c7' : '#f3f4f6',
                    color: currentProject.status === 'completed' ? '#166534' : 
                           currentProject.status === 'generating' ? '#92400e' : '#374151'
                  }}>
                    {currentProject.status.charAt(0).toUpperCase() + currentProject.status.slice(1)}
                  </span>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <h4 style={{ marginBottom: '0.5rem' }}>User Request:</h4>
                  <p style={{ 
                    background: '#f9fafb', 
                    padding: '1rem', 
                    borderRadius: '0.5rem',
                    color: '#374151',
                    fontStyle: 'italic'
                  }}>
                    "{currentProject.description}"
                  </p>
                </div>

                {/* Agent Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '1rem',
                  marginBottom: '2rem'
                }}>
                  {currentProject.agents.map(agent => (
                    <div
                      key={agent.id}
                      style={{
                        background: '#f9fafb',
                        border: `2px solid ${agent.color}20`,
                        borderRadius: '0.75rem',
                        padding: '1.5rem',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      {/* Progress bar */}
                      {agent.status === 'working' && (
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          height: '4px',
                          width: `${agent.progress || 0}%`,
                          background: agent.color,
                          transition: 'width 0.3s ease'
                        }}></div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: agent.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.2rem',
                          marginRight: '1rem'
                        }}>
                          {agent.icon}
                        </div>
                        <div>
                          <h4 style={{ margin: '0 0 0.25rem', fontSize: '1rem' }}>{agent.name}</h4>
                          <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
                            {agent.description}
                          </p>
                        </div>
                      </div>

                      <div style={{ marginBottom: '1rem' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '1rem',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          background: agent.status === 'completed' ? '#dcfce7' :
                                     agent.status === 'working' ? '#fef3c7' :
                                     agent.status === 'thinking' ? '#dbeafe' : '#f3f4f6',
                          color: agent.status === 'completed' ? '#166534' :
                                 agent.status === 'working' ? '#92400e' :
                                 agent.status === 'thinking' ? '#1e40af' : '#374151'
                        }}>
                          {agent.status === 'idle' ? 'Waiting' :
                           agent.status === 'thinking' ? 'Analyzing...' :
                           agent.status === 'working' ? `Working... ${agent.progress || 0}%` :
                           'Completed'}
                        </span>
                      </div>

                      {agent.result && (
                        <div style={{
                          background: 'white',
                          padding: '0.75rem',
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                          color: '#374151',
                          maxHeight: '100px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {agent.result.length > 100 ? 
                            `${agent.result.substring(0, 100)}...` : 
                            agent.result
                          }
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Final Document */}
                {currentProject.finalDocument && (
                  <div style={{
                    background: '#f0f9ff',
                    border: '2px solid #0ea5e9',
                    borderRadius: '0.75rem',
                    padding: '1.5rem'
                  }}>
                    <h4 style={{ marginBottom: '1rem', color: '#0c4a6e' }}>Generated RFP Document</h4>
                    <div style={{
                      background: 'white',
                      padding: '1rem',
                      borderRadius: '0.5rem',
                      maxHeight: '300px',
                      overflow: 'auto',
                      whiteSpace: 'pre-wrap',
                      fontSize: '0.9rem',
                      lineHeight: '1.6'
                    }}>
                      {currentProject.finalDocument}
                    </div>
                    <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                      <button 
                        onClick={handleDownloadPdf}
                        style={{
                          padding: '0.5rem 1rem',
                          background: '#0ea5e9',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="7 10 12 15 17 10"></polyline>
                          <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        Download PDF
                      </button>
                      
                      {!currentProject.proposal ? (
                        <button 
                          onClick={() => setShowCompanyInfoForm(true)}
                          style={{
                            padding: '0.5rem 1rem',
                            background: '#8b5cf6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                          </svg>
                          Generate Proposal
                        </button>
                      ) : (
                        <button style={{
                          padding: '0.5rem 1rem',
                          background: '#d1d5db',
                          color: '#6b7280',
                          border: 'none',
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                          cursor: 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                          </svg>
                          Proposal Generated
                        </button>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Proposal Document - Only show if proposal exists */}
                {currentProject.proposal?.document && (
                  <div style={{
                    background: '#f0fff4',
                    border: '2px solid #10b981',
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    marginTop: '2rem'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '1rem'
                    }}>
                      <h4 style={{ margin: 0, color: '#065f46' }}>Generated Proposal Document</h4>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '1rem',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        background: '#dcfce7',
                        color: '#166534'
                      }}>
                        Completed
                      </span>
                    </div>
                    <div style={{
                      background: 'white',
                      padding: '1rem',
                      borderRadius: '0.5rem',
                      maxHeight: '300px',
                      overflow: 'auto',
                      whiteSpace: 'pre-wrap',
                      fontSize: '0.9rem',
                      lineHeight: '1.6'
                    }}>
                      {currentProject.proposal.document}
                    </div>
                    <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                      <button 
                        onClick={handleDownloadProposal}
                        style={{
                          padding: '0.5rem 1rem',
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="7 10 12 15 17 10"></polyline>
                          <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        Download Proposal PDF
                      </button>
                      <button
                        style={{
                          padding: '0.5rem 1rem',
                          background: 'white',
                          color: '#10b981',
                          border: '1px solid #10b981',
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                          <polyline points="16 6 12 2 8 6"></polyline>
                          <line x1="12" y1="2" x2="12" y2="15"></line>
                        </svg>
                        Share Proposal
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Proposal Generation Loading State */}
                {currentProject.proposal?.status === 'generating' && (
                  <div style={{
                    background: '#fffbeb',
                    border: '2px solid #f59e0b',
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    marginTop: '2rem'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      marginBottom: '1rem',
                      gap: '0.75rem'
                    }}>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        border: '3px solid #fbbf24',
                        borderTop: '3px solid transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      <h4 style={{ margin: 0, color: '#92400e' }}>Generating Proposal Document...</h4>
                    </div>
                    <p style={{ color: '#92400e', margin: 0 }}>
                      Our AI agents are creating a detailed proposal document based on the RFP. This may take a minute or two.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Project History */}
            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '2rem',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ marginBottom: '1.5rem' }}>RFP Project History</h3>
              
              {projects.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '3rem',
                  color: '#6b7280'
                }}>
                  <h4>No RFP projects yet</h4>
                  <p>Create your first RFP request to get started!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {projects.map(project => (
                    <div
                      key={project.id}
                      onClick={() => setCurrentProject(project)}
                      style={{
                        padding: '1.5rem',
                        border: `2px solid ${currentProject?.id === project.id ? '#3b82f6' : '#e5e7eb'}`,
                        borderRadius: '0.75rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.5rem'
                      }}>
                        <h4 style={{ margin: 0 }}>{project.title}</h4>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '1rem',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          background: project.status === 'completed' ? '#dcfce7' : 
                                     project.status === 'generating' ? '#fef3c7' : '#f3f4f6',
                          color: project.status === 'completed' ? '#166534' : 
                                 project.status === 'generating' ? '#92400e' : '#374151'
                        }}>
                          {project.status}
                        </span>
                      </div>
                      <p style={{ 
                        color: '#6b7280', 
                        margin: '0 0 0.5rem',
                        fontSize: '0.9rem'
                      }}>
                        {project.description.length > 100 ? 
                          `${project.description.substring(0, 100)}...` : 
                          project.description
                        }
                      </p>
                      <div style={{ 
                        fontSize: '0.875rem',
                        color: '#9ca3af'
                      }}>
                        Created: {new Date(project.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* RFP Generator Modal */}
      {showRFPGenerator && (
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
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '1rem',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{ margin: 0 }}>Generate RFP with AI Agents</h3>
              <button
                onClick={() => setShowRFPGenerator(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
                Describe your procurement need in conversational language. Our AI agents will 
                analyze your request and generate a comprehensive RFP document.
              </p>
              
              <div style={{
                background: '#f0f7ff',
                padding: '1rem',
                borderRadius: '0.5rem',
                marginBottom: '1rem'
              }}>
                <p style={{ margin: '0 0 0.5rem', fontWeight: 'bold', color: '#1e40af' }}>
                  Example Request:
                </p>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#1e40af', fontStyle: 'italic' }}>
                  "We need a vendor to build a mobile app for logistics tracking, 
                  scalable to 100k users with real-time GPS tracking and secure data handling."
                </p>
              </div>
            </div>

            <textarea
              value={userRequest}
              onChange={(e) => setUserRequest(e.target.value)}
              placeholder="Describe your procurement requirement..."
              style={{
                width: '100%',
                minHeight: '120px',
                padding: '1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                resize: 'vertical',
                boxSizing: 'border-box',
                marginBottom: '1.5rem'
              }}
            />

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '1rem'
            }}>
              <button
                onClick={() => setShowRFPGenerator(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'white',
                  color: '#6b7280',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateRFP}
                disabled={!userRequest.trim() || isGenerating}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: !userRequest.trim() || isGenerating ? '#9ca3af' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: !userRequest.trim() || isGenerating ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {isGenerating ? 'Generating...' : 'Generate RFP'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Company Info Form Modal for Proposal Generation */}
      {showCompanyInfoForm && (
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
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '1rem',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{ margin: 0 }}>Company Information for Proposal</h3>
              <button
                onClick={() => setShowCompanyInfoForm(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
            </div>
            
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
              Please provide information about your company to generate a more personalized proposal.
            </p>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label 
                htmlFor="company-name" 
                style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: 'bold',
                  color: '#374151'
                }}
              >
                Company Name
              </label>
              <input
                id="company-name"
                type="text"
                value={companyInfo.name}
                onChange={(e) => setCompanyInfo({...companyInfo, name: e.target.value})}
                placeholder="Your Company Name"
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
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label 
                htmlFor="industry" 
                style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: 'bold',
                  color: '#374151'
                }}
              >
                Industry/Sector
              </label>
              <input
                id="industry"
                type="text"
                value={companyInfo.industry}
                onChange={(e) => setCompanyInfo({...companyInfo, industry: e.target.value})}
                placeholder="e.g. Technology, Manufacturing, Healthcare"
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
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label 
                htmlFor="experience" 
                style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: 'bold',
                  color: '#374151'
                }}
              >
                Years of Experience & Past Projects
              </label>
              <textarea
                id="experience"
                value={companyInfo.experience}
                onChange={(e) => setCompanyInfo({...companyInfo, experience: e.target.value})}
                placeholder="Briefly describe your company's experience and relevant past projects"
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
              />
            </div>
            
            <div style={{ marginBottom: '2rem' }}>
              <label 
                htmlFor="differentiators" 
                style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: 'bold',
                  color: '#374151'
                }}
              >
                Key Differentiators
              </label>
              <textarea
                id="differentiators"
                value={companyInfo.differentiators}
                onChange={(e) => setCompanyInfo({...companyInfo, differentiators: e.target.value})}
                placeholder="What makes your company unique? List competitive advantages."
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
              />
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '1rem'
            }}>
              <button
                onClick={() => setShowCompanyInfoForm(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'white',
                  color: '#6b7280',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleGenerateProposal(currentProject!)}
                disabled={isGeneratingProposal}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: isGeneratingProposal ? '#9ca3af' : '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: isGeneratingProposal ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {isGeneratingProposal ? 'Generating...' : 'Generate Proposal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
