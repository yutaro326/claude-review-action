export async function reviewCode(anthropic, code, filename) {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Please review the following ${filename} code and provide feedback. Format your response as "Line X: Comment" for each issue you find. If no issues are found, respond with "No issues found."

Code:
\`\`\`
${code}
\`\`\``
      }]
    });

    const text = response.content[0].text;
    
    if (text.includes('No issues found')) {
      return [];
    }

    const lines = text.split('\n');
    const comments = [];
    
    for (const line of lines) {
      const match = line.match(/^Line (\d+): (.+)$/);
      if (match) {
        comments.push({
          line: parseInt(match[1]),
          comment: match[2]
        });
      }
    }
    
    return comments;
  } catch (error) {
    console.error('Error calling Claude API:', error);
    return [];
  }
}