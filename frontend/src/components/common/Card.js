import React from 'react';
import PropTypes from 'prop-types';

const Card = ({
  children,
  className = '',
  elevation = 'md',
  hover = false,
  padding = 'md',
  border = false,
}) => {
  // Define elevation styles
  const elevationStyles = {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
    none: ''
  };

  // Define padding styles
  const paddingStyles = {
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8',
    none: ''
  };

  return (
    <div
      className={`
        bg-white 
        rounded-lg 
        ${elevationStyles[elevation]}
        ${paddingStyles[padding]}
        ${hover ? 'transition-shadow duration-300 hover:shadow-lg' : ''}
        ${border ? 'border border-gray-200' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

Card.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  elevation: PropTypes.oneOf(['none', 'sm', 'md', 'lg', 'xl']),
  hover: PropTypes.bool,
  padding: PropTypes.oneOf(['none', 'sm', 'md', 'lg']),
  border: PropTypes.bool,
};

export default Card;
