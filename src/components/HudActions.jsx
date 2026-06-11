import React from 'react';

export default function HudActions({ onOpenShop, onOpenLeaderboard, onToggleVolume }) {
    return (
        <div className="hud-actions">
            <div id="shopIconBtn" className="hud-btn" title="Skins Shop" onClick={onOpenShop}>🛒</div>
            <div id="leaderboardIconBtn" className="hud-btn" title="Leaderboards" onClick={onOpenLeaderboard}>🏆</div>
            <div id="volumeIconBtn" className="hud-btn" title="Sound Control" onClick={onToggleVolume}>🔊</div>
        </div>
    );
}
