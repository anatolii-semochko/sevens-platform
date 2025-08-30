import React, { useState } from 'react';

const MaterialVotes = ({ materialToken, initialLikes, initialDislikes, viewCount }) => {
    const [likeCount, setLikeCount] = useState(initialLikes);
    const [dislikeCount, setDislikeCount] = useState(initialDislikes);
    const [isLoading, setIsLoading] = useState(false);
    const [userVote, setUserVote] = useState(null); // 'like', 'dislike', or null

    const calculateRating = () => {
        const totalVotes = likeCount + dislikeCount;
        if (totalVotes === 0) return 0; // No votes = no rating
        return Math.round((likeCount / totalVotes) * 5);
    };

    const renderStars = () => {
        const rating = calculateRating();
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <i key={i} className={`bi ${i <= rating ? 'bi-star-fill' : 'bi-star'}`}></i>
            );
        }
        return stars;
    };

    const handleVote = async (voteType) => {
        if (isLoading) return;
        
        setIsLoading(true);
        
        try {
            const response = await fetch(`/en/api/material/${materialToken}/vote`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ type: voteType })
            });
            
            if (response.ok) {
                const data = await response.json();
                setLikeCount(data.likeCount);
                setDislikeCount(data.dislikeCount);
                
                // Toggle user vote state
                setUserVote(userVote === voteType ? null : voteType);
            } else {
                console.error('Vote failed:', response.statusText);
            }
        } catch (error) {
            console.error('Vote error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="mp-stats">
                <button 
                    className={`mp-chip mp-vote-btn ${userVote === 'like' ? 'mp-vote-active' : ''}`}
                    onClick={() => handleVote('like')}
                    disabled={isLoading}
                >
                    <i className="bi bi-hand-thumbs-up"></i> 
                    <span>{likeCount}</span>
                </button>
                <button 
                    className={`mp-chip mp-vote-btn ${userVote === 'dislike' ? 'mp-vote-active' : ''}`}
                    onClick={() => handleVote('dislike')}
                    disabled={isLoading}
                >
                    <i className="bi bi-hand-thumbs-down"></i> 
                    <span>{dislikeCount}</span>
                </button>
                <span className="mp-chip">
                    <i className="bi bi-eye"></i> {viewCount} views
                </span>
            </div>
            <div className="mp-rating">
                {renderStars()}
            </div>
        </>
    );
};

export default MaterialVotes;