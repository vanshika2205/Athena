import React from 'react';

export default function LeaderboardModal({ show, onClose, leaderboard }) {
    if (!show) return null;

    return (
        <div id="leaderboardOverlay" className="modal-overlay show">
            <div className="modal-content">
                <button className="modal-close-btn" onClick={onClose}>&times;</button>
                <h2 className="modal-title">Hall of Fame</h2>
                <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '15px' }}>
                    Your top five local high scores records:
                </p>
                <div id="leaderboardList" className="leaderboard-list">
                    {leaderboard.length === 0 ? (
                        <div className="leaderboard-row">No high scores yet!</div>
                    ) : (
                        leaderboard.map((row, i) => {
                            let rankClass = "";
                            if (i === 0) rankClass = "gold";
                            else if (i === 1) rankClass = "silver";
                            else if (i === 2) rankClass = "bronze";

                            return (
                                <div key={i} className={`leaderboard-row ${rankClass}`}>
                                    <span className="leaderboard-rank">#{i + 1}</span>
                                    <span className="leaderboard-name">{row.name}</span>
                                    <div className="leaderboard-score-details">
                                        <span className="leaderboard-score">{row.score} pts</span>
                                        <span className="leaderboard-level">Lvl {row.level} ({row.date})</span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
