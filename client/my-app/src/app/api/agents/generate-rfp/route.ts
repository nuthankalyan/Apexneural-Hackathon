import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: 'AIzaSyAHUFfOA4lildkHmB73fCov6fD-MKjdq3M' });

// Format the RFP document to ensure it's properly structured for PDF export
const formatRfpContent = (content: string) => {
  // First, normalize line endings
  let formattedContent = content.replace(/\r\n/g, '\n');
  
  // Format section headers
  formattedContent = formattedContent.replace(
    /^(\d+)\.\s+([A-Z][A-Z\s]+)$/gm,
    (match, num, title) => {
      return `### ${num}. ${title}`;
    }
  );
  
  // Format subsection headers
  formattedContent = formattedContent.replace(
    /^(\d+\.\d+)\s+([A-Za-z][A-Za-z\s]+)$/gm,
    (match, num, title) => {
      return `${num} ${title}`;
    }
  );
  
  // Add emphasis to important field labels
  formattedContent = formattedContent.replace(
    /^([A-Z][A-Za-z\s]+):(\s*)$/gm,
    (match, label, space) => {
      return `**${label}:**${space}`;
    }
  );
  
  // Format bullet points consistently but only for actual list items
  formattedContent = formattedContent.replace(
    /^(\s*)[-•]\s+(.+)$/gm,
    (match, indent, content) => {
      // Check if this looks like a list item (not a complete sentence)
      const isListItem = !content.endsWith('.') || content.length < 40;
      return isListItem ? `${indent}* ${content}` : `${indent}${content}`;
    }
  );
  
  return formattedContent;
};

export async function POST(request: NextRequest) {
  try {
    const { userRequest, agentResults } = await request.json();

    if (!userRequest || !agentResults) {
      return NextResponse.json(
        { error: 'User request and agent results are required' },
        { status: 400 }
      );
    }

    const prompt = `You are a professional RFP Document Generator. Create a comprehensive, 
professional Request for Proposal (RFP) document based on the following user request and 
detailed analyses from specialized agents.

ORIGINAL USER REQUEST: "${userRequest}"

AGENT ANALYSES:

REQUIREMENTS ANALYSIS:
${agentResults.requirements || 'Not provided'}

SECURITY ANALYSIS:
${agentResults.security || 'Not provided'}

SCALABILITY ANALYSIS:
${agentResults.scalability || 'Not provided'}

TECHNICAL ARCHITECTURE:
${agentResults.technical || 'Not provided'}

BUDGET ANALYSIS:
${agentResults.budget || 'Not provided'}

COMPLIANCE REQUIREMENTS:
${agentResults.compliance || 'Not provided'}

Please generate a professional RFP document with the following structure:

1. EXECUTIVE SUMMARY
2. PROJECT OVERVIEW
3. SCOPE OF WORK
4. TECHNICAL REQUIREMENTS
5. FUNCTIONAL REQUIREMENTS
6. NON-FUNCTIONAL REQUIREMENTS
7. SECURITY REQUIREMENTS
8. COMPLIANCE REQUIREMENTS
9. DELIVERABLES
10. TIMELINE AND MILESTONES
11. BUDGET AND PRICING STRUCTURE
12. VENDOR QUALIFICATIONS
13. PROPOSAL SUBMISSION REQUIREMENTS
14. EVALUATION CRITERIA
15. TERMS AND CONDITIONS

Format the document professionally with clear sections, subsections, and bullet points.
Make it comprehensive and actionable for vendors to respond to.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    const text = response.text || '';
    const formattedDocument = formatRfpContent(text);

    return NextResponse.json({
      success: true,
      document: formattedDocument,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating RFP document:', error);
    return NextResponse.json(
      { error: 'Failed to generate RFP document' },
      { status: 500 }
    );
  }
}
