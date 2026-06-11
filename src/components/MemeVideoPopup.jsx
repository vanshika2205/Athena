import React, { useEffect, useRef } from 'react';

export default function MemeVideoPopup({ show, videoUrl, onClose }) {
    const localVideoRef = useRef(null);
    const isMp4 = videoUrl ? videoUrl.endsWith('.mp4') : false;
    let ytUrl = videoUrl;
    if (videoUrl && !isMp4 && !videoUrl.includes('?')) {
        ytUrl = videoUrl + "?autoplay=1&controls=0&modestbranding=1&disablekb=1&rel=0";
    }

    useEffect(() => {
        if (show && isMp4 && localVideoRef.current) {
            localVideoRef.current.src = videoUrl;
            localVideoRef.current.play().catch(e => console.log("Video autoplay blocked", e));
        } else if (!show && localVideoRef.current) {
            localVideoRef.current.pause();
            localVideoRef.current.src = "";
        }
    }, [show, videoUrl, isMp4]);

    return (
        <div id="memeVideoPopup" className={show ? 'show' : ''}>
            <button 
                id="closeMemeVideoBtn" 
                className="modal-close-btn" 
                style={{ 
                    position: 'absolute', 
                    top: '15px', 
                    right: '15px', 
                    zIndex: 1001, 
                    background: 'rgba(0,0,0,0.7)',
                    boxShadow: '0 0 10px rgba(0,0,0,0.5)',
                    fontWeight: 'bold',
                    fontSize: '20px'
                }}
                onClick={onClose}
            >
                &times;
            </button>
            {show && !isMp4 && (
                <iframe 
                    id="youtubeIframe" 
                    width="315" 
                    height="560" 
                    src={ytUrl} 
                    title="YouTube video player" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                ></iframe>
            )}
            <video 
                ref={localVideoRef}
                id="localVideo" 
                width="315" 
                height="560" 
                className={isMp4 ? '' : 'hide'} 
                style={{ objectFit: 'cover', borderRadius: '20px' }} 
                autoPlay 
            ></video>
        </div>
    );
}
