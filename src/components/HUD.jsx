import React from 'react';

export default function HUD({ level, score, coins }) {
    // Level progress calculations
    let scoreInLevel = score % 50;
    let percentProgress = (scoreInLevel / 50) * 100;

    return (
        <div className="score-board">
            <div className="level-text">Level <span id="levelVal">{level}</span></div>
            <div className="level-progress-container" title="Progress to next level">
                <div 
                    id="levelProgressBar" 
                    className="level-progress-bar" 
                    style={{ width: `${percentProgress}%` }}
                ></div>
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>
                Score: <span id="scoreVal" style={{ color: 'var(--neon-blue)' }}>{score}</span>
            </div>
            <div className="coin-text">🪙 <span id="coinVal">{coins}</span></div>
        </div>
    );
}
