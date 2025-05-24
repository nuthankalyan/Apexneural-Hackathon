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
  documentId?: string; // Add this field to store the document ID
  proposal?: {
    status: 'pending' | 'generating' | 'completed';
    document?: string;
    createdAt?: string;
    documentId?: string; // Add this field to store the proposal document ID
  }
}

interface Document {
  _id: string;
  title: string;
  type: 'rfp' | 'proposal';
  content: string;
  createdAt: string;
  originalRequest?: string;
  metadata?: any;
  relatedDocuments?: string[];
  createdBy: {
    _id: string;
    username: string;
    email: string;
  };
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

  // History tab state
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [documentFilter, setDocumentFilter] = useState<'all' | 'rfp' | 'proposal'>('all');
  const [documentError, setDocumentError] = useState('');

  useEffect(() => {
    fetchWorkspace();
  }, [workspaceId]);

  useEffect(() => {
    if (activeTab === 'history' && workspace) {
      fetchDocuments();
    }
  }, [activeTab, workspace, documentFilter]);

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

  const fetchDocuments = async () => {
    setIsLoadingDocuments(true);
    setDocumentError('');

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/login');
        return;
      }

      let url = `http://localhost:5000/api/documents/workspace/${workspaceId}`;
      if (documentFilter !== 'all') {
        url += `?type=${documentFilter}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setDocuments(data.documents);
        // Select the first document by default if none is currently selected
        if (!selectedDocument && data.documents.length > 0) {
          setSelectedDocument(data.documents[0]);
        }
      } else {
        setDocumentError(data.message || 'Failed to fetch documents');
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      setDocumentError('Network error. Please try again.');
    } finally {
      setIsLoadingDocuments(false);
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

    // When generating final RFP, pass the workspace and user info for storage
    const finalDocument = await generateFinalRFP(
      project.description, 
      allResults, 
      workspaceId,
      localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!)._id : undefined
    );
    
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

  const generateFinalRFP = async (
    userRequest: string, 
    agentResults: Record<string, string>,
    workspaceId?: string,
    userId?: string
  ): Promise<string> => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/agents/generate-rfp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userRequest,
          agentResults,
          workspaceId,
          userId
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

  // Add these functions to format and display document content with tables
  const formatDocumentContent = (content: string): React.ReactNode => {
    if (!content) return null;
    
    // Split content by possible table sections (text containing |)
    const parts = content.split(/(\n(?:\|.+\|\n)+)/g);
    
    return parts.map((part, index) => {
      // Check if this part looks like a table
      if (part.trim().startsWith('|') && part.includes('|\n')) {
        return (
          <div key={`table-section-${index}`} style={{ overflowX: 'auto', margin: '1rem 0' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse', 
              border: '1px solid #ddd'
            }}>
              {renderMarkdownTable(part)}
            </table>
          </div>
        );
      }
      
      // Format regular text - handle bold formatting with markdown style
      return (
        <div key={`text-section-${index}`} style={{ marginBottom: '0.5rem' }}>
          {formatTextWithMarkdown(part)}
        </div>
      );
    });
  };

  // Format regular text with markdown features (bold, etc.)
  const formatTextWithMarkdown = (text: string): React.ReactNode => {
    // Split by bold markers
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    
    return (
      <div style={{ whiteSpace: 'pre-wrap' }}>
        {parts.map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            // Bold text
            return <strong key={i}>{part.slice(2, -2)}</strong>;
          } else {
            // Regular text
            return <span key={i}>{part}</span>;
          }
        })}
      </div>
    );
  };

  // Helper function to render markdown tables as HTML
  const renderMarkdownTable = (tableContent: string) => {
    const rows = tableContent.trim().split('\n');
    
    // Process each row
    return rows.map((row, rowIndex) => {
      // Skip the separator row (contains only |, -, and :)
      if (row.match(/^\|[\s\-:|]+\|$/)) {
        return null;
      }
      
      // Clean up the row and split into cells
      const cells = row.split('|')
        .filter((cell, i, arr) => i !== 0 && i !== arr.length - 1) // Remove empty first/last if row starts/ends with |
        .map(cell => cell.trim());
      
      // Determine if this is a header row (usually the first row)
      const isHeader = rowIndex === 0;
      
      return (
        <tr key={`row-${rowIndex}`}>
          {cells.map((cell, cellIndex) => {
            const CellTag = isHeader ? 'th' : 'td';
            return (
              <CellTag 
                key={`cell-${rowIndex}-${cellIndex}`}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  textAlign: isHeader ? 'center' : 'left',
                  background: isHeader ? '#f0f9ff' : (rowIndex % 2 === 0 ? '#fff' : '#f9fafb')
                }}
              >
                {cell}
              </CellTag>
            );
          })}
        </tr>
      );
    });
  };

  // Function to prepare content for PDF generation
  const prepareContentForPdf = (content: string): string => {
    if (!content) return '';
    
    // Normalize line endings
    let formattedContent = content.replace(/\r\n/g, '\n');
    
    // Add spacing after section headers to ensure they're properly detected
    formattedContent = formattedContent.replace(
      /^(\d+\.\s+[A-Z][A-Z\s]+)$/gm, 
      '$1\n\nSection content.'
    );
    
    // Ensure each section has at least some content
    const sections = formattedContent.match(/^(\d+\.\s+[A-Z][A-Z\s]+)$/gm) || [];
    for (const section of sections) {
      const sectionIndex = formattedContent.indexOf(section);
      const nextSectionIndex = formattedContent.indexOf('\n\d+\.\s+[A-Z][A-Z\s]+', sectionIndex + section.length);
      
      // If there's no content between this section and the next (or end), add placeholder
      const hasContent = nextSectionIndex > -1 ? 
        formattedContent.substring(sectionIndex + section.length, nextSectionIndex).trim().length > 0 :
        formattedContent.substring(sectionIndex + section.length).trim().length > 0;
        
      if (!hasContent) {
        formattedContent = formattedContent.replace(
          section,
          `${section}\n\nThis section contains information related to ${section.replace(/^\d+\.\s+/, '')}.`
        );
      }
    }
    
    // Ensure tables have proper structure
    formattedContent = formattedContent.replace(/\|\s*\n(?!\s*\|)/g, '|\n\n');
    
    // Fix headers without separator rows
    const tableRegex = /\|(.*)\|\n(?!\s*\|[\s-:|]+\|)/g;
    formattedContent = formattedContent.replace(tableRegex, (match, headerRow) => {
      const columnCount = headerRow.split('|').length;
      let separatorRow = '|';
      for (let i = 0; i < columnCount; i++) {
        separatorRow += ' --- |';
      }
      return match + separatorRow + '\n';
    });
    
    return formattedContent;
  };

  const handleDownloadPdf = () => {
    if (!currentProject?.finalDocument || !workspace) return;
    
    try {
      // Get proposal content and ensure each section has content
      const content = currentProject.finalDocument;
      
      // Improve the content formatting for better PDF structure
      const cleanContent = prepareContentForPdf(content)
        .replace(/\n{3,}/g, '\n\n') // Replace excessive newlines
        .trim();
      
      const rfpDocument: RfpDocument = {
        title: currentProject.title,
        description: currentProject.description || "This document contains details about the project requirements.",
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
      const token = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('user') || '{}');

      const response = await fetch('/api/agents/generate-proposal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          rfpDocument: rfpProject.finalDocument,
          companyInfo,
          workspaceId,
          userId: userData._id,
          rfpDocumentId: rfpProject.documentId // If we have saved the RFP document ID
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
            createdAt: new Date().toISOString(),
            documentId: data.documentId // Store the document ID for reference
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
      // Ensure proposal content is properly formatted
      const content = currentProject.proposal.document;
      
      // Clean up the content
      const cleanContent = prepareContentForPdf(content)
        .replace(/\n{3,}/g, '\n\n') // Replace excessive newlines
        .trim();
      
      const rfpDocument: RfpDocument = {
        title: `Proposal for: ${currentProject.title}`,
        description: `Proposal in response to RFP: ${currentProject.description || "project requirements"}`,
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

  const handleDownloadDocument = (document: Document) => {
    try {
      // Format content for PDF
      const cleanContent = prepareContentForPdf(document.content);
      
      const rfpDocument: RfpDocument = {
        title: document.title,
        description: document.originalRequest || document.title,
        content: cleanContent,
        createdAt: document.createdAt,
        createdBy: document.createdBy.username,
      };
      
      // Generate PDF
      const pdf = generateRfpPdf(rfpDocument, {
        title: document.type === 'rfp' ? 'REQUEST FOR PROPOSAL' : 'PROPOSAL DOCUMENT',
        subtitle: document.title,
        author: document.createdBy.username,
        subject: document.type === 'rfp' ? 'RFP Document' : 'Proposal Document',
        keywords: document.type === 'rfp' ? 'procurement, rfp, proposal, requirements' :
                 'procurement, proposal, response, quotation',
        pageSize: 'a4',
        orientation: 'portrait'
      });
      
      // Save the PDF
      const fileName = `${document.type === 'rfp' ? 'RFP' : 'Proposal'}_${document.title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
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
        <button
          onClick={() => setActiveTab('history')}
          style={{
            padding: '0.75rem 1.5rem',
            fontWeight: 'bold',
            color: activeTab === 'history' ? '#3b82f6' : '#6b7280',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'history' ? '3px solid #3b82f6' : '3px solid transparent',
            cursor: 'pointer'
          }}
        >
          Document History
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
              
              {/* Stats Container */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
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
                      fontSize: '0.9rem',
                      lineHeight: '1.6'
                    }}>
                      {currentProject.finalDocument && formatDocumentContent(currentProject.finalDocument)}
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
                      fontSize: '0.9rem',
                      lineHeight: '1.6'
                    }}>
                      {currentProject.proposal?.document && formatDocumentContent(currentProject.proposal.document)}
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

        {activeTab === 'history' && (
          <div>
            {/* Document History Header */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '2rem'
            }}>
              <div>
                <h2 style={{ margin: '0 0 0.5rem' }}>Document History</h2>
                <p style={{ color: '#6b7280', margin: 0 }}>
                  View and manage your generated RFPs and proposals
                </p>
              </div>
              <div>
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  background: '#f1f5f9',
                  padding: '0.25rem',
                  borderRadius: '0.5rem'
                }}>
                  <button
                    onClick={() => setDocumentFilter('all')}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '0.25rem',
                      border: 'none',
                      background: documentFilter === 'all' ? '#3b82f6' : 'transparent',
                      color: documentFilter === 'all' ? 'white' : '#64748b',
                      fontSize: '0.875rem',
                      fontWeight: 'medium',
                      cursor: 'pointer'
                    }}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setDocumentFilter('rfp')}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '0.25rem',
                      border: 'none',
                      background: documentFilter === 'rfp' ? '#3b82f6' : 'transparent',
                      color: documentFilter === 'rfp' ? 'white' : '#64748b',
                      fontSize: '0.875rem',
                      fontWeight: 'medium',
                      cursor: 'pointer'
                    }}
                  >
                    RFPs
                  </button>
                  <button
                    onClick={() => setDocumentFilter('proposal')}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '0.25rem',
                      border: 'none',
                      background: documentFilter === 'proposal' ? '#3b82f6' : 'transparent',
                      color: documentFilter === 'proposal' ? 'white' : '#64748b',
                      fontSize: '0.875rem',
                      fontWeight: 'medium',
                      cursor: 'pointer'
                    }}
                  >
                    Proposals
                  </button>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {documentError && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                marginBottom: '1.5rem'
              }}>
                {documentError}
              </div>
            )}

            {/* Document View */}
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: '350px 1fr',
              gap: '2rem',
              height: 'calc(100vh - 250px)',
              minHeight: '500px'
            }}>
              {/* Document List */}
              <div style={{
                background: 'white',
                borderRadius: '0.75rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{
                  padding: '1rem',
                  borderBottom: '1px solid #e5e7eb',
                  fontWeight: 'bold',
                  color: '#374151'
                }}>
                  Documents ({documents.length})
                </div>
                
                {isLoadingDocuments ? (
                  <div style={{
                    padding: '2rem',
                    textAlign: 'center',
                    color: '#6b7280'
                  }}>
                    <div style={{
                      width: '30px',
                      height: '30px',
                      border: '3px solid #f3f3f3',
                      borderTop: '3px solid #3b82f6',
                      borderRadius: '50%',
                      margin: '0 auto 1rem',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    <p style={{ margin: 0 }}>Loading documents...</p>
                    <style jsx>{`
                      @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                      }
                    `}</style>
                  </div>
                ) : documents.length === 0 ? (
                  <div style={{
                    padding: '2rem',
                    textAlign: 'center',
                    color: '#6b7280'
                  }}>
                    <p>No documents found.</p>
                    <button
                      onClick={() => setActiveTab('rfp-generator')}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.25rem',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                      }}
                    >
                      Generate an RFP
                    </button>
                  </div>
                ) : (
                  <div style={{ 
                    overflowY: 'auto',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    {documents.map(doc => (
                      <div
                        key={doc._id}
                        onClick={() => setSelectedDocument(doc)}
                        style={{
                          padding: '1rem',
                          borderBottom: '1px solid #f3f4f6',
                          cursor: 'pointer',
                          background: selectedDocument?._id === doc._id ? '#f0f9ff' : 'white',
                          borderLeft: selectedDocument?._id === doc._id ? '4px solid #3b82f6' : '4px solid transparent'
                        }}
                      >
                        <div style={{ 
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '0.5rem'
                        }}>
                          <h3 style={{
                            margin: 0,
                            fontSize: '1rem',
                            color: '#111827'
                          }}>
                            {doc.title.length > 40 ? `${doc.title.substring(0, 40)}...` : doc.title}
                          </h3>
                          <span style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            background: doc.type === 'rfp' ? '#dbeafe' : '#f3e8ff',
                            color: doc.type === 'rfp' ? '#1e40af' : '#7e22ce',
                            fontWeight: 'bold'
                          }}>
                            {doc.type === 'rfp' ? 'RFP' : 'Proposal'}
                          </span>
                        </div>
                        <div style={{ 
                          fontSize: '0.875rem',
                          color: '#6b7280',
                          marginBottom: '0.5rem'
                        }}>
                          {doc.originalRequest && doc.originalRequest.length > 50 
                            ? `${doc.originalRequest.substring(0, 50)}...` 
                            : doc.originalRequest || 'No description'}
                        </div>
                        <div style={{ 
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.75rem',
                          color: '#9ca3af'
                        }}>
                          <span>
                            By: {doc.createdBy.username}
                          </span>
                          <span>
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Document Viewer */}
              <div style={{
                background: 'white',
                borderRadius: '0.75rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}>
                {selectedDocument ? (
                  <>
                    <div style={{
                      padding: '1rem',
                      borderBottom: '1px solid #e5e7eb',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <h3 style={{ margin: '0 0 0.25rem', color: '#111827' }}>
                          {selectedDocument.title}
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
                          Created {new Date(selectedDocument.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDownloadDocument(selectedDocument)}
                        style={{
                          padding: '0.5rem 1rem',
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.25rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontSize: '0.875rem',
                          fontWeight: 'medium'
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="7 10 12 15 17 10"></polyline>
                          <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        Download PDF
                      </button>
                    </div>
                    <div style={{
                      flex: 1,
                      padding: '1rem',
                      overflowY: 'auto'
                    }}>
                      <div style={{
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        fontSize: '0.9rem',
                        lineHeight: '1.6'
                      }}>
                        {selectedDocument && formatDocumentContent(selectedDocument.content)}
                      </div>
                    </div>
                    {selectedDocument.type === 'rfp' && (
                      <div style={{
                        padding: '1rem',
                        borderTop: '1px solid #e5e7eb',
                        background: '#f9fafb'
                      }}>
                        <button
                          onClick={() => {
                            // Create a project from this RFP document
                            const project: RFPProject = {
                              id: `existing_${selectedDocument._id}`,
                              title: selectedDocument.title,
                              description: selectedDocument.originalRequest || 'RFP Project',
                              status: 'completed',
                              createdAt: selectedDocument.createdAt,
                              agents: [],
                              finalDocument: selectedDocument.content,
                              documentId: selectedDocument._id
                            };
                            
                            setProjects([project, ...projects]);
                            setCurrentProject(project);
                            setActiveTab('rfp-generator');
                          }}
                          style={{
                            padding: '0.5rem 1rem',
                            background: '#8b5cf6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.25rem',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: 'medium'
                          }}
                        >
                          Generate Proposal from this RFP
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: '#6b7280'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1rem', opacity: 0.5 }}>
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    <p>Select a document to view</p>
                  </div>
                )}
              </div>
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
