import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: 'AIzaSyAHUFfOA4lildkHmB73fCov6fD-MKjdq3M' });

const AGENT_PROMPTS = {
  coordinator: {
    role: "Project Coordinator",
    prompt: `You are a Project Coordinator agent responsible for orchestrating RFP generation. 
    Analyze the user request and provide a high-level project breakdown including timeline, 
    key stakeholders, and coordination requirements.`
  },
  requirements: {
    role: "Requirements Analyst",
    prompt: `You are a Requirements Analyst agent. Break down the user's conversational request 
    into structured, detailed requirements. Include functional requirements, non-functional 
    requirements, success criteria, and deliverables. Be specific and comprehensive.`
  },
  security: {
    role: "Security Specialist",
    prompt: `You are a Security Specialist agent. Analyze the request and define comprehensive 
    security requirements including data protection, access controls, compliance standards 
    (GDPR, HIPAA, SOC2), encryption requirements, and security testing needs.`
  },
  scalability: {
    role: "Scalability Expert", 
    prompt: `You are a Scalability Expert agent. Focus on performance and scaling requirements.
    Define load capacity, performance benchmarks, scalability architecture, infrastructure 
    requirements, and monitoring needs based on the user's request.`
  },
  budget: {
    role: "Budget Analyst",
    prompt: `You are a Budget Analyst agent. Provide cost analysis and budget considerations.
    Include estimated cost ranges, cost breakdown structure, payment terms, and budget 
    constraints. Consider development, implementation, and ongoing operational costs.`
  },
  technical: {
    role: "Technical Architect",
    prompt: `You are a Technical Architect agent. Define detailed technical specifications,
    technology stack recommendations, integration requirements, API specifications, 
    database requirements, and technical constraints.`
  },
  compliance: {
    role: "Compliance Officer",
    prompt: `You are a Compliance Officer agent. Identify regulatory and legal compliance 
    requirements including industry standards, data protection laws, accessibility 
    requirements (ADA, WCAG), and audit requirements.`
  },
  document: {
    role: "Document Generator",
    prompt: `You are a Document Generator agent. Create the final structured RFP document 
    by synthesizing all agent analyses into a professional, comprehensive RFP format.`
  }
};

export async function POST(request: NextRequest) {
  try {
    const { agentType, userRequest, context } = await request.json();

    if (!agentType || !userRequest) {
      return NextResponse.json(
        { error: 'Agent type and user request are required' },
        { status: 400 }
      );
    }

    const agentConfig = AGENT_PROMPTS[agentType as keyof typeof AGENT_PROMPTS];
    if (!agentConfig) {
      return NextResponse.json(
        { error: 'Invalid agent type' },
        { status: 400 }
      );
    }

    let prompt = `${agentConfig.prompt}

USER REQUEST: "${userRequest}"`;

    if (context) {
      prompt += `

CONTEXT FROM PREVIOUS ANALYSIS: ${context}`;
    }

    prompt += `

Please provide a detailed analysis in your domain of expertise. Be specific, actionable, and comprehensive.
Format your response in clear sections with bullet points where appropriate.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    const text = response.text;

    return NextResponse.json({
      success: true,
      result: text,
      agentType,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in agent generation:', error);
    return NextResponse.json(
      { error: 'Failed to generate agent response' },
      { status: 500 }
    );
  }
}
