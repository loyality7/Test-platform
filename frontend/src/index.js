import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';

console.log('API URL:', process.env.REACT_APP_API_URL);

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
