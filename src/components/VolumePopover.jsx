import React from 'react';

export default function VolumePopover({ show, musicVolume, sfxVolume, onMusicVolumeChange, onSfxVolumeChange }) {
    return (
        <div id="volumePopover" className={`volume-popover ${show ? 'show' : ''}`}>
            <div>
                <label htmlFor="musicVolume">Music Volume</label>
                <input 
                    type="range" 
                    id="musicVolume" 
                    min="0" 
                    max="1" 
                    step="0.1" 
                    value={musicVolume} 
                    onChange={(e) => onMusicVolumeChange(parseFloat(e.target.value))}
                />
            </div>
            <div>
                <label htmlFor="sfxVolume">SFX Volume</label>
                <input 
                    type="range" 
                    id="sfxVolume" 
                    min="0" 
                    max="1" 
                    step="0.1" 
                    value={sfxVolume} 
                    onChange={(e) => onSfxVolumeChange(parseFloat(e.target.value))}
                />
            </div>
        </div>
    );
}
