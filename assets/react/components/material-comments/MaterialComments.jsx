import React, { useState, useEffect } from 'react'

const MaterialComments = ({ materialToken, isLoggedIn = false }) => {
    const [comments, setComments] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState({ name: '', email: '', comment: '' })
    const [showAll, setShowAll] = useState(false)

    useEffect(() => {
        fetchComments()
    }, [materialToken])

    const fetchComments = async () => {
        try {
            const response = await fetch(`/en/api/material/${materialToken}/comments`)
            if (response.ok) {
                const data = await response.json()
                setComments(data.comments)
            }
        } catch (error) {
            console.error('Error fetching comments:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (isSubmitting) return

        setIsSubmitting(true)
        try {
            const response = await fetch(`/en/api/material/${materialToken}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            })

            if (response.ok) {
                const data = await response.json()
                setComments([data.comment, ...comments])
                setFormData({ name: '', email: '', comment: '' })
            } else {
                console.error('Comment submission failed')
            }
        } catch (error) {
            console.error('Error submitting comment:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    if (isLoading) {
        return <div>Loading comments...</div>
    }

    return (
        <div className="mp-comments">
            <h4>Comments ({comments.length}):</h4>
            
            {(showAll ? comments : comments.slice(0, 2)).map((comment) => (
                <div key={comment.id} className="mp-comment">
                    <div className="mp-avatar" style={{background: '#f0f0f0', borderRadius: '50%', width: '38px', height: '38px'}}></div>
                    <div className="mp-bubble">
                        <span className="mp-name">{comment.name}</span>
                        <span className="mp-meta">{comment.createdAt}</span>
                        <div style={{marginTop: '.35rem'}}>
                            {comment.comment}
                        </div>
                        <div className="mp-child">
                            <span className="mp-reply"><i className="bi bi-reply"></i> Reply</span>
                        </div>
                    </div>
                </div>
            ))}

            {comments.length > 2 && !showAll && (
                <div className="mp-see-more" onClick={() => setShowAll(true)}>
                    <span>see more</span>
                    <i className="bi bi-chevron-down"></i>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="mp-comment-input">
                    <input 
                        type="text" 
                        name="comment"
                        placeholder="Add comment..."
                        value={formData.comment}
                        onChange={handleChange}
                        required
                    />
                    <button type="submit" title="Send" disabled={isSubmitting}>
                        <i className="bi bi-send"></i>
                    </button>
                </div>
                {!isLoggedIn && (
                    <div className="row g-2 mt-2">
                        <div className="col-6">
                            <input
                                type="text"
                                name="name"
                                className="form-control form-control-sm"
                                placeholder="Your name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="col-6">
                            <input
                                type="email"
                                name="email"
                                className="form-control form-control-sm"
                                placeholder="Your email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>
                )}
            </form>
        </div>
    )
}

export default MaterialComments