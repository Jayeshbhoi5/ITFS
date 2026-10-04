import React from 'react';
import ThemeLoader from './ThemeLoader';

const Spinner = ({ darkMode }) => (
  <ThemeLoader fullScreen={false} darkMode={darkMode} className="py-8" />
);

export default Spinner;
