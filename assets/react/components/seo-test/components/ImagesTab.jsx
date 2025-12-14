/**
 * Images Tab Component
 * Displays all page images with validation
 */
const ImagesTab = ({ images, errors, imageLoadErrors, loadingImages }) => {
    const getImageClass = (src) => {
        if (!src) return 'text-danger'
        if (src === '#') return 'text-danger'
        return ''
    }

    const getAltClass = (alt) => {
        return alt ? '' : 'text-danger'
    }

    const handleImageError = (e) => {
        e.target.style.display = 'none'
        e.target.parentElement.innerHTML = '<span class="text-danger fw-bold">Failed to load</span>'
    }

    return (
        <div>
            {loadingImages && (
                <div className="alert alert-info mb-3">
                    <strong>Loading...</strong> Checking images availability
                </div>
            )}

            {!loadingImages && errors.images > 0 && (
                <div className="alert alert-danger mb-3">
                    <strong>Errors:</strong> Found {errors.images} image error{errors.images !== 1 ? 's' : ''} (missing src/alt)
                </div>
            )}

            {!loadingImages && imageLoadErrors > 0 && (
                <div className="alert alert-danger mb-3">
                    <strong>Failed:</strong> {imageLoadErrors} image{imageLoadErrors !== 1 ? 's' : ''} failed to load
                </div>
            )}

            <table className="table table-sm table-hover">
                <thead className="table-light">
                    <tr>
                        <th style={{ width: '15%' }}>Image</th>
                        <th style={{ width: '25%' }}>Alt</th>
                        <th style={{ width: '45%' }}>Link</th>
                        <th style={{ width: '15%' }}>Title</th>
                    </tr>
                </thead>
                <tbody>
                    {images.map((img, index) => (
                        <tr key={index}>
                            <td>
                                {img.src ? (
                                    <img
                                        src={img.src}
                                        alt={img.alt || 'Image'}
                                        style={{ maxWidth: '80px', maxHeight: '60px', objectFit: 'contain' }}
                                        onError={handleImageError}
                                    />
                                ) : (
                                    <span className="text-danger fw-bold">No src</span>
                                )}
                            </td>
                            <td className={getAltClass(img.alt)}>
                                {img.alt || <span className="text-danger fw-bold">empty</span>}
                            </td>
                            <td className={`text-truncate ${getImageClass(img.src)}`} style={{ maxWidth: '400px' }}>
                                {img.src ? (
                                    <a href={img.src} target="_blank" rel="noopener noreferrer" title={img.src}>
                                        {img.src}
                                    </a>
                                ) : (
                                    <span className="text-danger">empty</span>
                                )}
                            </td>
                            <td className="text-truncate" style={{ maxWidth: '150px' }} title={img.title}>
                                {img.title || <span className="text-muted fst-italic">empty</span>}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default ImagesTab
