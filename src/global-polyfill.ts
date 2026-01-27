import React from 'react';
import ReactDOM from 'react-dom/client';

console.log('--- GLOBAL POLYFILL EXECUTING ---');

if (typeof window !== 'undefined') {
  (window as any).React = React;
  (window as any).ReactDOM = ReactDOM;
  (window as any).global = window;
  
  // Hooks Polyfill
  (window as any).useState = React.useState;
  (window as any).useEffect = React.useEffect;
  (window as any).useContext = React.useContext;
  (window as any).useReducer = React.useReducer;
  (window as any).useCallback = React.useCallback;
  (window as any).useMemo = React.useMemo;
  (window as any).useRef = React.useRef;
  (window as any).useImperativeHandle = React.useImperativeHandle;
  (window as any).useLayoutEffect = React.useLayoutEffect;
  (window as any).useDebugValue = React.useDebugValue;

  // Class Components
  (window as any).Component = React.Component;
  (window as any).PureComponent = React.PureComponent;

  console.log('React, ReactDOM, and Hooks attached to window');
}
