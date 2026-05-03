import React, { useState } from 'react';

const TruncatedText = ({ text, lineLimit = 3 }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const lineClampStyle = {
    display: '-webkit-box',
    WebkitLineClamp: lineLimit,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  };

  // A rough check to see if text will be clamped. 
  // This is not perfect but avoids showing the button for very short text.
  // A better solution might involve checking the element's scrollHeight vs clientHeight.
  const needsTruncation = text && text.split('\n').length > lineLimit || text.length > lineLimit * 50; // 50 is an arbitrary avg line length

  return (
    <div>
      <p style={isExpanded ? {} : lineClampStyle} className="whitespace-pre-wrap break-words">
        {text}
      </p>
      {needsTruncation && (
        <button 
          onClick={toggleExpanded}
          className="bg-transparent p-0 text-blue-600 dark:text-blue-400 hover:underline mt-2 text-sm font-medium"
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
};

export default TruncatedText; 