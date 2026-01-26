import React from 'react';
import ReactDOM from 'react-dom/client';

console.log('--- GLOBAL POLYFILL EXECUTING ---');

if (typeof window !== 'undefined') {
  (window as any).React = React;
  (window as any).ReactDOM = ReactDOM;
  (window as any).global = window;
  console.log('React and ReactDOM attached to window');
}
