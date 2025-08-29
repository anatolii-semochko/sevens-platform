document.addEventListener('DOMContentLoaded', function() {
    const carousel = document.querySelector('.mp-carousel img');
    const thumbs = document.querySelectorAll('.mp-thumb');
    
    if (!carousel || thumbs.length === 0) return;
    
    // Set first thumb as active
    thumbs[0].classList.add('active');
    
    // Add click handlers to thumbnails
    thumbs.forEach((thumb, index) => {
        thumb.addEventListener('click', function() {
            // Remove active class from all thumbs
            thumbs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked thumb
            this.classList.add('active');
            
            // Update main carousel image
            const img = this.querySelector('img');
            if (img) {
                carousel.src = img.src;
                carousel.alt = img.alt;
            }
        });
        
        // Add cursor pointer style
        thumb.style.cursor = 'pointer';
    });
    
    // Fullscreen modal functionality
    carousel.addEventListener('click', function() {
        openImageModal(this.src, this.alt);
    });
    carousel.style.cursor = 'pointer';
    
    function openImageModal(src, alt) {
        // Create modal overlay
        const modal = document.createElement('div');
        modal.className = 'mp-image-modal';
        modal.innerHTML = `
            <div class="mp-modal-backdrop">
                <div class="mp-modal-content">
                    <button class="mp-modal-close" aria-label="Close">&times;</button>
                    <img src="${src}" alt="${alt}" class="mp-modal-image">
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        // Close handlers
        const closeBtn = modal.querySelector('.mp-modal-close');
        const backdrop = modal.querySelector('.mp-modal-backdrop');
        
        const closeModal = () => {
            document.body.removeChild(modal);
            document.body.style.overflow = '';
        };
        
        closeBtn.addEventListener('click', closeModal);
        backdrop.addEventListener('click', function(e) {
            if (e.target === backdrop) closeModal();
        });
        
        // ESC key to close
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }
});