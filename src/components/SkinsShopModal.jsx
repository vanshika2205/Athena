import React from 'react';

export default function SkinsShopModal({ show, onClose, characters, coins, ownedChars, selectedChar, onSelectChar }) {
    if (!show) return null;

    return (
        <div id="shopOverlay" className="modal-overlay show">
            <div className="modal-content">
                <button className="modal-close-btn" onClick={onClose}>&times;</button>
                <h2 className="modal-title">Skins Shop</h2>
                <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '10px' }}>
                    Spend collected GPA coins to buy characters with special boosts!
                </p>
                <div id="shopGrid" className="shop-grid">
                    {characters.map(char => {
                        const isOwned = ownedChars.includes(char.id);
                        const isSelected = selectedChar === char.id;
                        
                        let priceTag = isSelected ? "EQUIPPED" : (isOwned ? "SELECT" : `🪙 ${char.cost}`);
                        
                        return (
                            <div 
                                key={char.id}
                                className={`shop-card ${isSelected ? 'selected' : ''} ${isOwned ? 'owned' : ''}`}
                                onClick={() => onSelectChar(char)}
                            >
                                <div 
                                    className="shop-card-img" 
                                    style={{ backgroundImage: `url('${char.image}')` }}
                                ></div>
                                <div className="shop-card-name">{char.name}</div>
                                <div className="shop-card-desc">{char.desc}</div>
                                <div className="shop-card-desc" style={{ color: 'var(--neon-blue)', fontWeight: 'bold', marginTop: '2px' }}>
                                    {char.buff}
                                </div>
                                <div className="shop-card-price">{priceTag}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
