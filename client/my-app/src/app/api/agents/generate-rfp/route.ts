import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: 'AIzaSyAHUFfOA4lildkHmB73fCov6fD-MKjdq3M' });

// Format the RFP document to ensure it's properly structured for PDF export
const formatRfpContent = (content: string) => {
  // First, normalize line endings
  let formattedContent = content.replace(/\r\n/g, '\n');
  
  // Format section headers (ensure proper spacing before and after)
  formattedContent = formattedContent.replace(
    /^(\d+)\.\s+([A-Z][A-Z\s]+)$/gm,
    (match, num, title) => {
      return `\n${num}. ${title}\n`;
    }
  );
  
  // Format subsection headers
  formattedContent = formattedContent.replace(
    /^(\d+\.\d+)\s+([A-Za-z][A-Za-z\s]+)$/gm,
    (match, num, title) => {
      return `\n${num} ${title}\n`;
    }
  );
  
  // Add emphasis to important field labels
  formattedContent = formattedContent.replace(
    /^([A-Z][A-Za-z\s]+):(\s*)$/gm,
    (match, label, space) => {
      return `**${label}:**${space}`;
    }
  );
  
  // Ensure proper bold formatting for important text (cleanup any inconsistent bold markers)
  formattedContent = formattedContent.replace(/\*\*\s+/g, '**');
  formattedContent = formattedContent.replace(/\s+\*\*/g, '**');
  
  // Format bullet points consistently
  formattedContent = formattedContent.replace(
    /^(\s*)[-•]\s+(.+)$/gm,
    (match, indent, content) => {
      return `${indent}• ${content}`;
    }
  );
  
  // Format tables - ensure proper markdown table format with consistent spacing
  formattedContent = formattedContent.replace(
    /^([\s]*)([\w\s]+[\w)])([\s]*)\|([\s\w\d\.,\-:;%\(\)]+\|)+$/gm,
    (match) => {
      // This looks like a table row but might be missing initial |
      if (!match.trim().startsWith('|')) {
        return '| ' + match.trim();
      }
      return match;
    }
  );
  
  // Ensure table rows are properly separated
  formattedContent = formattedContent.replace(
    /(\|\s*[\w\s\d\.,\-:;%\(\)]+\s*\|+\s*)\n(?!\s*\|)/g,
    '$1\n\n'
  );
  
  // Make sure header rows have divider rows
  formattedContent = formattedContent.replace(
    /(\|\s*[\w\s\d\.,\-:;%\(\)]+\s*\|+\s*)\n(?!\s*\|\s*[-:\s]+\s*\|+)/g,
    (match, headerRow) => {
      // Count cells in header row
      const cellCount = (headerRow.match(/\|/g) || []).length - 1;
      // Create a divider row with the same number of cells
      let dividerRow = '|';
      for (let i = 0; i < cellCount; i++) {
        dividerRow += ' --- |';
      }
      return headerRow + dividerRow + '\n';
    }
  );
  
  // Fix extra line breaks (no more than 2 consecutive line breaks)
  formattedContent = formattedContent.replace(/\n{3,}/g, '\n\n');
  
  return formattedContent;
};

export async function POST(request: NextRequest) {
  try {
    const { userRequest, agentResults, workspaceId, userId } = await request.json();

    if (!userRequest || !agentResults) {
      return NextResponse.json(
        { error: 'User request and agent results are required' },
        { status: 400 }
      );
    }

    const prompt = `You are a professional RFP Document Generator. Create a comprehensive, 
professional Request for Proposal (RFP) document based on the following user request and 
detailed analyses from specialized agents.

IMPORTANT FORMATTING REQUIREMENTS:
1. Format all section headers as "1. SECTION TITLE" in uppercase with proper numbering
2. Format all subsection headers as "1.1 Subsection Title" with proper capitalization
3. Use bold formatting (**text**) for important terms, company names, and key requirements
4. Format any lists as proper bullet points with "-" character
5. Ensure proper spacing between sections (use double line breaks)
6. Keep paragraphs well-structured with clear topic sentences

FOR TABLES:
- Format any tabular data using proper markdown table format
- Always include the | character at the beginning and end of each row
- Include header rows with a separator row beneath (using | --- | format)
- Example:
| Column 1 | Column 2 | Column 3 |
| --- | --- | --- |
| Data 1 | Data 2 | Data 3 |
| Data 4 | Data 5 | Data 6 |

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

FORMATTING EXAMPLES:
Section header:
"1. EXECUTIVE SUMMARY"

Subsection header:
"1.1 Project Goals"

Bold important text:
"The solution must be completed within **six (6) months** from contract signing."

Format the document professionally with clear sections, subsections, and bullet points.
Make it comprehensive and actionable for vendors to respond to.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    const text = response.text || '';
    const formattedDocument = formatRfpContent(text);

    let documentId = null;
    
    // Only save to database if workspaceId and userId are provided
    if (workspaceId && userId) {
      try {
        // Extract a title from the document
        let title = 'RFP Document';
        const titleMatch = formattedDocument.match(/^\s*(?:#+\s*)?(.*?RFP.*?)(?:\r?\n|$)/i);
        if (titleMatch && titleMatch[1]) {
          title = titleMatch[1].trim();
        } else {
          // Try to extract from first paragraph
          const firstParagraph = formattedDocument.split('\n')[0];
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
            type: 'rfp',
            content: formattedDocument,
            workspaceId,
            originalRequest: userRequest,
            metadata: {
              agentResults: Object.keys(agentResults).join(',')
            }
          })
        });
        
        const documentData = await documentResponse.json();
        if (documentData.success) {
          documentId = documentData.document._id;
        }
      } catch (error) {
        console.error('Error saving document to database:', error);
        // Continue even if database save fails
      }
    }

    return NextResponse.json({
      success: true,
      document: formattedDocument,
      documentId,
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
