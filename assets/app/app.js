import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../app/styles/main.scss';
import React from 'react';
import { createRoot } from 'react-dom/client';
import MyComponent from '../react/components/MyComponent'; // твій компонент

const rootEl = document.getElementById('root');
if (rootEl) {
    const root = createRoot(rootEl);
    root.render(<MyComponent />);
}

console.log('Start sevenstime APP')
