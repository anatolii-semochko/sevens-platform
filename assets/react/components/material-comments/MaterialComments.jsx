import React, { useState, useEffect } from 'react'
import { route } from '@js/router/routing-with-locale'

const MaterialComments = ({ materialToken, isLoggedIn = false }) => {
    const [comments, setComments] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState({ name: '', email: '', comment: '' })
    const [showAll, setShowAll] = useState(false)
    const [replyingTo, setReplyingTo] = useState(null)
    const [replyFormData, setReplyFormData] = useState({ name: '', email: '', comment: '' })

    useEffect(() => {
        fetchComments()
    }, [materialToken])

    const fetchComments = async () => {
        try {
            const url = route('api_material_comment_comments_list', { token: materialToken })
            const response = await fetch(url)
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
            const url = route('api_material_comment_comment_add', { token: materialToken })
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            })

            if (response.ok) {
                const data = await response.json()
                const newComment = { ...data.comment, replies: [] }
                setComments([newComment, ...comments])
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

    const handleReplySubmit = async (e, parentCommentId) => {
        e.preventDefault()
        if (isSubmitting) return

        setIsSubmitting(true)
        try {
            const url = route('api_material_comment_comment_add', { token: materialToken })
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ...replyFormData, parentCommentId })
            })

            if (response.ok) {
                const data = await response.json()
                // Update the comments array to add the reply to the parent comment
                setComments(comments.map(comment => {
                    if (comment.id === parentCommentId) {
                        return {
                            ...comment,
                            replies: [...comment.replies, data.comment]
                        }
                    }
                    return comment
                }))
                setReplyFormData({ name: '', email: '', comment: '' })
                setReplyingTo(null)
            } else {
                console.error('Reply submission failed')
            }
        } catch (error) {
            console.error('Error submitting reply:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleReplyChange = (e) => {
        setReplyFormData({ ...replyFormData, [e.target.name]: e.target.value })
    }

    const handleReplyClick = (commentId) => {
        setReplyingTo(commentId)
        setReplyFormData({ name: '', email: '', comment: '' })
    }

    const handleCancelReply = () => {
        setReplyingTo(null)
        setReplyFormData({ name: '', email: '', comment: '' })
    }

    const totalComments = comments.reduce((total, comment) => total + 1 + comment.replies.length, 0)

    if (isLoading) {
        return <div>Loading comments...</div>
    }

    return (
        <div className="mp-comments">
            <h4>Comments ({totalComments}):</h4>

            {(showAll ? comments : comments.slice(0, 2)).map((comment) => (
                <div key={comment.id} className="mp-comment-thread">
                    <div className="mp-comment">
                        <div className="mp-avatar" style={{background: '#f0f0f0', borderRadius: '50%', width: '38px', height: '38px'}}></div>
                        <div className="mp-bubble">
                            <span className="mp-name">{comment.name}</span>
                            <span className="mp-meta">{comment.createdAt}</span>
                            <div style={{marginTop: '.35rem'}}>
                                {comment.comment}
                            </div>
                            <div className="mp-child">
                                <span className="mp-reply" onClick={() => handleReplyClick(comment.id)}>
                                    <i className="bi bi-reply"></i> Reply
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Display replies */}
                    {comment.replies && comment.replies.length > 0 && (
                        <div className="mp-replies">
                            {comment.replies.map((reply) => (
                                <div key={reply.id} className="mp-comment mp-reply">
                                    <div className="mp-avatar" style={{background: '#e0e0e0', borderRadius: '50%', width: '32px', height: '32px'}}></div>
                                    <div className="mp-bubble">
                                        <span className="mp-name">{reply.name}</span>
                                        <span className="mp-meta">{reply.createdAt}</span>
                                        <div style={{marginTop: '.35rem'}}>
                                            {reply.comment}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Reply form */}
                    {replyingTo === comment.id && (
                        <div className="mp-reply-form">
                            <form onSubmit={(e) => handleReplySubmit(e, comment.id)}>
                                <div className="mp-comment-input">
                                    <input
                                        type="text"
                                        name="comment"
                                        placeholder="Write a reply..."
                                        value={replyFormData.comment}
                                        onChange={handleReplyChange}
                                        required
                                    />
                                    <button type="submit" title="Send" disabled={isSubmitting}>
                                        <i className="bi bi-send"></i>
                                    </button>
                                    <button type="button" onClick={handleCancelReply} title="Cancel" className="btn-cancel">
                                        <i className="bi bi-x"></i>
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
                                                value={replyFormData.name}
                                                onChange={handleReplyChange}
                                                required
                                            />
                                        </div>
                                        <div className="col-6">
                                            <input
                                                type="email"
                                                name="email"
                                                className="form-control form-control-sm"
                                                placeholder="Your email"
                                                value={replyFormData.email}
                                                onChange={handleReplyChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                )}
                            </form>
                        </div>
                    )}
                </div>
            ))}

            {comments.length > 2 && !showAll && (
                <div className="mp-see-more" onClick={() => setShowAll(true)}>
                    <span>see more</span>
                    <i className="bi bi-chevron-down"></i>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="mp-comment-input" style={{gridTemplateColumns: '1fr 44px'}}>
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