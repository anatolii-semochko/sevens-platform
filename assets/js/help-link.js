document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.help-link .toggle-help').forEach(function (link) {
        link.addEventListener('click', function (e) {
            e.preventDefault()
            const container = link.closest('.help-link')
            const icon = link.querySelector('i')
            const isActive = container.classList.toggle('active')
            if (isActive) {
                icon.classList.remove('bi-question-circle')
                icon.classList.add('bi-x-circle')
            } else {
                icon.classList.remove('bi-x-circle')
                icon.classList.add('bi-question-circle')
            }
        })
    })
    document.querySelectorAll('.help-link .read-more').forEach(function (readMoreLink) {
        readMoreLink.addEventListener('click', function (e) {
            e.preventDefault()
            const helpLink = readMoreLink.closest('.help-link')
            const fullUrl = helpLink.querySelector('.toggle-help').getAttribute('href')
            window.open(fullUrl, '_blank')
        })
    })
})
