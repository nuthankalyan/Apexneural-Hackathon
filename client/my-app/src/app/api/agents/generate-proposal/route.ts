import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: 'AIzaSyAHUFfOA4lildkHmB73fCov6fD-MKjdq3M' });

// Define specialized agent prompts for proposal generation
const PROPOSAL_AGENT_PROMPTS = {
  techLead: `You are a Technical Lead Agent responsible for crafting the technical response section of a proposal.
    Review the RFP requirements and create a detailed technical approach including:
    - Technology stack recommendations
    - Architecture overview
    - Implementation methodology
    - Technical differentiators and innovation
    - How your approach meets or exceeds the requirements
    
    Format your response in clear sections with bullet points where appropriate.`,
    
  legal: `You are a Legal Compliance Agent responsible for reviewing RFP requirements and creating the compliance section of a proposal.
    Address:
    - Legal compliance with all stated requirements
    - Terms and conditions responses
    - Risk management approaches
    - Contract modifications or exceptions (if needed)
    - Relevant certifications and compliance history
    
    Format your response professionally with reference to specific RFP sections.`,
    
  estimation: `You are a Budget Estimation Agent responsible for creating the cost proposal section.
    Based on the RFP requirements, generate:
    - Detailed cost breakdown structure
    - Pricing models and options
    - Payment schedule recommendations
    - Cost justifications and value propositions
    - Any assumptions made in pricing
    
    Present costs clearly in an organized format with justifications.`,
    
  timeline: `You are a Project Timeline Agent responsible for creating the implementation schedule section of a proposal.
    Based on the RFP requirements, generate:
    - Comprehensive project timeline
    - Key milestones and deliverables
    - Resource allocation plan
    - Critical path identification
    - Risk management approach for timeline adherence
    
    Present the timeline in phases with clear dependencies and durations.`
};

export async function POST(request: NextRequest) {
  try {
    const { rfpDocument, companyInfo, workspaceId, userId, rfpDocumentId } = await request.json();

    if (!rfpDocument) {
      return NextResponse.json(
        { error: 'RFP document is required' },
        { status: 400 }
      );
    }

    // Process through all specialized agents
    const agentResults = await runSpecializedAgents(rfpDocument, companyInfo || {});
    
    // Generate the final proposal document
    const finalProposal = await generateFinalProposal(rfpDocument, agentResults, companyInfo || {});

    let documentId = null;
    
    // Only save to database if workspaceId and userId are provided
    if (workspaceId && userId) {
      try {
        // Extract a title from the document
        let title = 'Proposal Document';
        const titleMatch = finalProposal.match(/^\s*(?:#+\s*)?(.*?Proposal.*?)(?:\r?\n|$)/i);
        if (titleMatch && titleMatch[1]) {
          title = titleMatch[1].trim();
        } else {
          // Try to extract from first paragraph
          const firstParagraph = finalProposal.split('\n')[0];
          if (firstParagraph && firstParagraph.length < 100) {
            title = firstParagraph.trim();
          }
        }
        
        // Save to database
        const token = request.headers.get('authorization')?.split(' ')[1];
        const documentResponse = await fetch(`${process.env.API_BASE_URL || 'http://localhost:5000'}/api/documents`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            title,
            type: 'proposal',
            content: finalProposal,
            workspaceId,
            originalRequest: companyInfo?.name ? `Proposal for ${companyInfo.name}` : 'Proposal',
            relatedDocumentId: rfpDocumentId || undefined,
            metadata: {
              companyInfo: companyInfo || {},
              agentResults: Object.keys(agentResults).join(',')
            }
          })
        });
        
        const documentData = await documentResponse.json();
        if (documentData.success) {
          documentId = documentData.document._id;
        }
      } catch (error) {
        console.error('Error saving proposal document to database:', error);
        // Continue even if database save fails
      }
    }

    return NextResponse.json({
      success: true,
      proposal: finalProposal,
      documentId,
      agentResults,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating proposal:', error);
    return NextResponse.json(
      { error: 'Failed to generate proposal document' },
      { status: 500 }
    );
  }
}

/**
 * Run all specialized agents to analyze the RFP and generate their parts of the proposal
 */
async function runSpecializedAgents(rfpDocument: string, companyInfo: any) {
  const results: Record<string, string> = {};
  
  // Run agents in parallel for better performance
  const agentPromises = Object.entries(PROPOSAL_AGENT_PROMPTS).map(
    async ([agentType, prompt]) => {
      const result = await callAgentWithContext(agentType, prompt, rfpDocument, companyInfo);
      return { agentType, result };
    }
  );

  const agentResponses = await Promise.all(agentPromises);
  
  // Combine all results
  agentResponses.forEach(({ agentType, result }) => {
    results[agentType] = result;
  });

  return results;
}

/**
 * Call individual agent with the RFP context
 */
async function callAgentWithContext(agentType: string, agentPrompt: string, rfpDocument: string, companyInfo: any) {
  try {
    // Fix: Use the correct method to access the model
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{
        role: "user",
        parts: [{ text: `${agentPrompt}

${companyInfo ? `
COMPANY INFORMATION:
Company Name: ${companyInfo.name || 'Your Company'}
Industry: ${companyInfo.industry || 'Not specified'}
Experience: ${companyInfo.experience || 'Not specified'}
Differentiators: ${companyInfo.differentiators || 'Not specified'}
` : ''}

RFP DOCUMENT TO RESPOND TO:
${rfpDocument.substring(0, 7000)}  // Limit size for token considerations

Based on the above RFP, generate your specialized response. Be professional, thorough, and specific.`}]
      }]
    });

    return response.text || '';
  } catch (error) {
    console.error(`Error with ${agentType} agent:`, error);
    return `Error generating ${agentType} section: Technical difficulties encountered.`;
  }
}

/**
 * Generate the final complete proposal document
 */
async function generateFinalProposal(rfpDocument: string, agentResults: Record<string, string>, companyInfo: any) {
  try {
    // Extract the title and some key points from the RFP
    const rfpSnippet = rfpDocument.substring(0, 1500); // Just use beginning for context
    
    // Create prompt for final proposal with clear instructions for proper formatting
    const promptText = `You are an expert Proposal Writer. Create a complete, professional proposal document in response to an RFP.
Incorporate the specialized sections provided below into a cohesive, well-structured proposal document.

IMPORTANT FORMATTING REQUIREMENTS:
1. Format all section headers as "1. SECTION TITLE" in uppercase with numbering
2. Format all subsection headers as "1.1 Subsection Title" with proper capitalization
3. Use bold formatting (**text**) for important terms, names, and key points
4. Format any lists as proper bullet points with "-" character
5. Ensure proper spacing between sections (use double line breaks)
6. Keep paragraphs well-structured with clear topic sentences
7. DO NOT use placeholder text like "[See SECTION above]"
8. VERY IMPORTANT: Include substantial content under each numbered section, don't leave any section empty

FOR TABLES (such as pricing, timelines, or comparisons):
- Format any tabular data using proper markdown table format
- Always include the | character at the beginning and end of each row
- Include header rows with a separator row beneath (using | --- | format)
- Example:
| Item | Description | Price |
| --- | --- | --- |
| Service A | Core development | $10,000 |
| Service B | Quality assurance | $5,000 |

${companyInfo ? `
COMPANY INFORMATION:
Company Name: ${companyInfo.name || 'Your Company'}
Industry: ${companyInfo.industry || 'Not specified'}
Experience: ${companyInfo.experience || 'Not specified'}
Differentiators: ${companyInfo.differentiators || 'Not specified'}
` : ''}

RFP SUMMARY:
${rfpSnippet}

TECHNICAL APPROACH INPUT:
${agentResults.techLead}

LEGAL & COMPLIANCE INPUT:
${agentResults.legal}

COST PROPOSAL INPUT:
${agentResults.estimation}

PROJECT TIMELINE INPUT:
${agentResults.timeline}

Format the proposal with the following structure:
1. EXECUTIVE SUMMARY
2. COMPANY BACKGROUND
3. UNDERSTANDING OF REQUIREMENTS
4. TECHNICAL APPROACH - Include detailed technical approach here, not just a reference
5. IMPLEMENTATION METHODOLOGY
6. PROJECT TIMELINE & MILESTONES
7. TEAM & RESOURCES
8. COST PROPOSAL - Include detailed cost information here, not just a reference
9. LEGAL & COMPLIANCE STATEMENT - Include detailed compliance information here, not just a reference
10. TERMS & CONDITIONS
11. CONCLUSION

FORMATTING EXAMPLES:
Section header:
"1. EXECUTIVE SUMMARY"

Subsection header:
"1.1 Project Goals"

Bold important text:
"The proposed solution will be completed within **eight (8) months** from contract signing."

Create a professional, compelling proposal that highlights strengths and differentiators. 
VERY IMPORTANT: For sections 4, 8, and 9, fully incorporate the relevant content from the specialized agent inputs, and ensure proper formatting of all sections.`;

    // Fix: Use the correct method to generate content
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash", 
      contents: [{
        role: "user",
        parts: [{ text: promptText }]
      }]
    });

    return response.text || 'Error generating complete proposal document.';
  } catch (error) {
    console.error('Error generating final proposal:', error);
    return 'Error generating complete proposal document. Please try again later.';
  }
}
