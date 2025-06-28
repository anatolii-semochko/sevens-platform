import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../app/styles/main.scss';
import React from 'react';
import { createRoot } from 'react-dom/client';
import CreateMaterial from "./js/create-material/CreateMaterial";
import CheckToken from "./js/check-token/CheckToken";

const createMaterial = document.getElementById('create-material');
if (createMaterial) {
    const root = createRoot(createMaterial);
    root.render(<CreateMaterial />);
}

const checkToken = document.getElementById('check-token');
if (checkToken) {
    const root = createRoot(checkToken);
    root.render(<CheckToken />);
}

console.log('Start sevenstime APP')
