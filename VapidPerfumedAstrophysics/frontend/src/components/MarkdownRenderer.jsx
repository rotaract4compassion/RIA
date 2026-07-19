import React from 'react';

export default function MarkdownRenderer({ content = '', className = '' }) {
  if (!content) return null;

  // Split by newlines to process blocks
  const blocks = content.split('\n');
  const elements = [];
  let inList = false;
  let listItems = [];

  const flushList = () => {
    if (inList && listItems.length > 0) {
      elements.push(<ul key={`ul-${elements.length}`} className="list-disc pl-5 my-2 space-y-1">{listItems}</ul>);
      listItems = [];
      inList = false;
    }
  };

  const parseInline = (text, blockIndex) => {
    // Basic inline markdown: **bold**, *italic*, [link](url)
    const parts = [];
    let remaining = text;
    let keyIdx = 0;

    while (remaining.length > 0) {
      const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);
      const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
      const italicMatch = remaining.match(/\*([^*]+)\*/);

      // Find the earliest match
      let match = null;
      let type = null;
      
      const matches = [
        { type: 'link', m: linkMatch },
        { type: 'bold', m: boldMatch },
        { type: 'italic', m: italicMatch }
      ].filter(x => x.m);

      if (matches.length > 0) {
        // Find the match that occurs first in the string
        match = matches.reduce((prev, curr) => (curr.m.index < prev.m.index ? curr : prev));
        type = match.type;
        
        const m = match.m;
        if (m.index > 0) {
          parts.push(<span key={`text-${blockIndex}-${keyIdx++}`}>{remaining.slice(0, m.index)}</span>);
        }
        
        if (type === 'link') {
          parts.push(<a key={`link-${blockIndex}-${keyIdx++}`} href={m[2]} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{m[1]}</a>);
        } else if (type === 'bold') {
          parts.push(<strong key={`bold-${blockIndex}-${keyIdx++}`} className="font-bold">{m[1]}</strong>);
        } else if (type === 'italic') {
          parts.push(<em key={`italic-${blockIndex}-${keyIdx++}`} className="italic">{m[1]}</em>);
        }
        
        remaining = remaining.slice(m.index + m[0].length);
      } else {
        parts.push(<span key={`text-${blockIndex}-${keyIdx++}`}>{remaining}</span>);
        break;
      }
    }
    return parts;
  };

  blocks.forEach((line, i) => {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      inList = true;
      const content = trimmed.substring(2);
      listItems.push(<li key={`li-${i}`}>{parseInline(content, i)}</li>);
    } else {
      flushList();
      if (trimmed === '') {
        elements.push(<div key={`br-${i}`} className="h-2"></div>);
      } else {
        elements.push(<p key={`p-${i}`} className="my-1 leading-relaxed">{parseInline(trimmed, i)}</p>);
      }
    }
  });
  flushList();

  return <div className={className}>{elements}</div>;
}
