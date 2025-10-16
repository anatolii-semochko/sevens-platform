import React, { useState } from 'react'
import { route } from '@js/router/routing-with-locale'

const CommentsManage = ({ initialComments = [] }) => {
    const [comments, setComments] = useState(initialComments)
    const [replyingTo, setReplyingTo] = useState(null)
    const [replyText, setReplyText] = useState({})
    const [submitting, setSubmitting] = useState({})
    const [successMessages, setSuccessMessages] = useState({})
    const [errorMessages, setErrorMessages] = useState({})

    const handleReplySubmit = async (e, commentId, materialToken) => {
        e.preventDefault()

        const text = replyText[commentId]?.trim()
        if (!text || submitting[commentId]) return

        setSubmitting({ ...submitting, [commentId]: true })
        setSuccessMessages({ ...successMessages, [commentId]: false })
        setErrorMessages({ ...errorMessages, [commentId]: false })

        try {
            const url = route('api_material_comment_comment_add', { token: materialToken })
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    comment: text,
                    parentCommentId: commentId
                })
            })

            if (response.ok) {
                const data = await response.json()

                // Update the comments state to add the new reply
                setComments(comments.map(item => {
                    if (item.comment.id === commentId) {
                        return {
                            ...item,
                            replies: [...item.replies, data.comment]
                        }
                    }
                    return item
                }))

                setSuccessMessages({ ...successMessages, [commentId]: true })
                setReplyText({ ...replyText, [commentId]: '' })

                // Hide success message after 3 seconds
                setTimeout(() => {
                    setSuccessMessages({ ...successMessages, [commentId]: false })
                    setReplyingTo(null)
                }, 3000)
            } else {
                setErrorMessages({ ...errorMessages, [commentId]: true })
            }
        } catch (error) {
            console.error('Error sending reply:', error)
            setErrorMessages({ ...errorMessages, [commentId]: true })
        } finally {
            setSubmitting({ ...submitting, [commentId]: false })
        }
    }

    const handleReplyChange = (commentId, value) => {
        setReplyText({ ...replyText, [commentId]: value })
    }

    const toggleReplyForm = (commentId) => {
        setReplyingTo(replyingTo === commentId ? null : commentId)
        setSuccessMessages({ ...successMessages, [commentId]: false })
        setErrorMessages({ ...errorMessages, [commentId]: false })
    }

    if (comments.length === 0) {
        return (
            <div className="alert alert-info" role="alert">
                <i className="bi bi-info-circle"></i> No comments on your materials yet.
            </div>
        )
    }

    return (
        <div>
            {comments.map((item) => (
                <div key={item.comment.id} className="card mb-3">
                    <div className="card-header bg-light d-flex justify-content-between align-items-center">
                        <div>
                            <strong>Material:</strong>{' '}
                            <a href={route('material_page', { token: item.material.token })} target="_blank" rel="noopener noreferrer">
                                {item.material.title}
                            </a>
                        </div>
                        <small className="text-muted">
                            <i className="bi bi-calendar"></i> {new Date(item.comment.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit'
                            })}
                        </small>
                    </div>
                    <div className="card-body">
                        <div className="row">
                            <div className="col-md-8">
                                <h6 className="card-subtitle mb-2 text-muted">
                                    {item.comment.user ? (
                                        <span className="badge bg-primary">Registered User</span>
                                    ) : (
                                        <span className="badge bg-secondary">Guest</span>
                                    )}
                                    {' '}{item.comment.name}
                                    {item.comment.email && (
                                        <small className="text-muted"> ({item.comment.email})</small>
                                    )}
                                </h6>
                                <p className="card-text mt-3">{item.comment.comment}</p>

                                {/* Display replies */}
                                {item.replies && item.replies.length > 0 && (
                                    <div className="mt-3 ps-4 border-start border-3 border-primary">
                                        <h6 className="text-muted mb-3">
                                            <i className="bi bi-chat-right-text"></i> Replies ({item.replies.length}):
                                        </h6>
                                        {item.replies.map((reply) => (
                                            <div key={reply.id} className="card mb-2 bg-light">
                                                <div className="card-body py-2">
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <div>
                                                            <strong>
                                                                {reply.user ? (
                                                                    <span className="badge bg-primary">Registered User</span>
                                                                ) : (
                                                                    <span className="badge bg-secondary">Guest</span>
                                                                )}
                                                                {' '}{reply.name}
                                                            </strong>
                                                            <p className="mb-0 mt-2">{reply.comment}</p>
                                                        </div>
                                                        <small className="text-muted">
                                                            {new Date(reply.createdAt).toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric',
                                                                hour: 'numeric',
                                                                minute: '2-digit'
                                                            })}
                                                        </small>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="col-md-4 text-end">
                                <button
                                    className="btn btn-outline-primary btn-sm mb-2"
                                    onClick={() => toggleReplyForm(item.comment.id)}
                                >
                                    <i className="bi bi-reply"></i> Reply
                                </button>
                                <a
                                    href={`${route('material_page', { token: item.material.token })}#comment-${item.comment.id}`}
                                    className="btn btn-outline-secondary btn-sm mb-2 ms-2"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <i className="bi bi-box-arrow-up-right"></i> View
                                </a>
                            </div>
                        </div>

                        {/* Reply form */}
                        {replyingTo === item.comment.id && (
                            <div className="mt-3">
                                <div className="card card-body bg-light">
                                    <form onSubmit={(e) => handleReplySubmit(e, item.comment.id, item.material.token)}>
                                        <div className="mb-3">
                                            <label htmlFor={`reply-${item.comment.id}`} className="form-label">
                                                Your Reply
                                            </label>
                                            <textarea
                                                className="form-control"
                                                id={`reply-${item.comment.id}`}
                                                rows="3"
                                                placeholder="Write your reply..."
                                                value={replyText[item.comment.id] || ''}
                                                onChange={(e) => handleReplyChange(item.comment.id, e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="d-flex justify-content-end">
                                            <button
                                                type="button"
                                                className="btn btn-secondary btn-sm me-2"
                                                onClick={() => toggleReplyForm(item.comment.id)}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="btn btn-primary btn-sm"
                                                disabled={submitting[item.comment.id]}
                                            >
                                                <i className="bi bi-send"></i> Send Reply
                                            </button>
                                        </div>
                                        {successMessages[item.comment.id] && (
                                            <div className="alert alert-success mt-2 mb-0">
                                                Reply sent successfully!
                                            </div>
                                        )}
                                        {errorMessages[item.comment.id] && (
                                            <div className="alert alert-danger mt-2 mb-0">
                                                Failed to send reply. Please try again.
                                            </div>
                                        )}
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ))}

            {/* Total count */}
            <div className="mt-3">
                <p className="text-muted text-center">
                    Total comments: <strong>{comments.length}</strong>
                </p>
            </div>
        </div>
    )
}

export default CommentsManage