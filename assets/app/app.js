import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import '@css/main.scss'
import React from 'react'
import { createRoot } from 'react-dom/client';
import CreateMaterial from '@components/create-material/CreateMaterial'
import CheckToken from '@components/check-token/CheckToken'

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



// TODO - move to separate file
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.help-link .toggle-help').forEach(function (link) {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const container = link.closest('.help-link');
            const icon = link.querySelector('i');

            // Перемикаємо стан
            const isActive = container.classList.toggle('active');

            // Змінюємо іконку
            if (isActive) {
                icon.classList.remove('bi-question-circle');
                icon.classList.add('bi-x-circle');
            } else {
                icon.classList.remove('bi-x-circle');
                icon.classList.add('bi-question-circle');
            }
        });
    });

    // Обробка Read More
    document.querySelectorAll('.help-link .read-more').forEach(function (readMoreLink) {
        readMoreLink.addEventListener('click', function (e) {
            e.preventDefault();
            const helpLink = readMoreLink.closest('.help-link');
            const fullUrl = helpLink.querySelector('.toggle-help').getAttribute('href');
            window.open(fullUrl, '_blank');
        });
    });
});



console.log('Start sevenstime APP')
