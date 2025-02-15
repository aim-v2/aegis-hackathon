export const chatStyles = `
.status-text {
    font-size: 16px;
    font-weight: 600;
    margin-top: 4px; /* Reduced since we're using flex gap */
    transition: all 0.3s ease;
}

    .score-value {
        transition: background-color 0.3s ease;
    }
#chat-container {
            width: 100%;
            max-width: 600px;
            margin: 32px auto;
            border: 1px solid #e1e4e8;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            overflow: hidden;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            opacity: 0;
            transform: translateY(30px);
            animation: chatAppear 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes chatAppear {
            0% {
                opacity: 0;
                transform: translateY(30px);
            }
            100% {
                opacity: 1;
                transform: translateY(0);
            }
        }
    #safety-score {
    padding: 16px 24px;
    background-color: #ffffff;
    border-bottom: 1px solid #e1e4e8;
    display: flex;
    flex-direction: column; /* Changed to vertical layout */
    gap: 8px;
    opacity: 0;
    animation: sectionFade 0.5s ease forwards;
    animation-delay: 0.3s;
}

    
        @keyframes sectionFade {
            0% {
                opacity: 0;
                transform: translateY(10px);
            }
            100% {
                opacity: 1;
                transform: translateY(0);
            }
        }
    
        .score-label {
            font-size: 15px;
            color: #4a5568;
            font-weight: 500;
        }
    
        .score-value {
    background-color: #22c55e;
    color: white;
    padding: 4px 14px;
    border-radius: 24px;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.3px;
}
    
        #messages-area {
            height: 420px;
            padding: 24px;
            overflow-y: auto;
            background-color: #f8fafc;
            opacity: 0;
            animation: sectionFade 0.5s ease forwards;
            animation-delay: 0.5s;
        }

 .message-title {
    font-size: 1.1em;
    font-weight: bold;
    margin-bottom: 1em;
}

.message-points {
    list-style: none;
    padding: 0;
    margin: 0;
}

.message-points li {
    margin-bottom: 0.75em;
    line-height: 1.4;
}
.point-wrapper {
    display: flex;
    gap: 0.5em;
    line-height: 1.5;
}

.point-label {
    color: #0066cc;
    min-width: 100px;
    flex-shrink: 0;
}

.point-content {
    flex: 1;
    padding-right: 1em;
}

        .message {
            margin: 16px 0;
            padding: 14px 18px;
            border-radius: 16px;
            max-width: 75%;
            word-wrap: break-word;
            line-height: 1.5;
            font-size: 15px;
            opacity: 0;
            animation: messageAppear 0.3s ease forwards;
        }

        @keyframes messageAppear {
            0% {
                opacity: 0;
                transform: translateY(10px);
            }
            100% {
                opacity: 1;
                transform: translateY(0);
            }
        }
    
        .user-message {
            background-color: #2563eb;
            color: white;
            margin-left: auto;
            border-bottom-right-radius: 6px;
            box-shadow: 0 2px 4px rgba(37, 99, 235, 0.1);
            animation: userMessageSlide 0.3s ease forwards;
        }

        @keyframes userMessageSlide {
            0% {
                opacity: 0;
                transform: translateX(20px);
            }
            100% {
                opacity: 1;
                transform: translateX(0);
            }
        }
    
        .ai-message {
            background-color: #ffffff;
            color: #1f2937;
            margin-right: auto;
            border-bottom-left-radius: 6px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            border: 1px solid #e5e7eb;
            animation: aiMessageSlide 0.3s ease forwards;
        }

        @keyframes aiMessageSlide {
            0% {
                opacity: 0;
                transform: translateX(-20px);
            }
            100% {
                opacity: 1;
                transform: translateX(0);
            }
        }
    
         #suggestion-area {
        display: flex;
        padding: 16px 24px;
        background-color: #ffffff;
        border-top: 1px solid #e1e4e8;
        gap: 8px;
        flex-wrap: wrap;
        justify-content: flex-start;
        opacity: 0;
        animation: sectionFade 0.5s ease forwards;
        animation-delay: 0.7s;
    }
    
       .suggestion-button {
        padding: 8px 16px;
        background-color: #f3f4f6;
        color: #4b5563;
        border: 1px solid #e5e7eb;
        border-radius: 20px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 13px;
        font-weight: 500;
        white-space: nowrap;
        flex: 0 1 auto;
        min-width: 0;
        max-width: calc(50% - 8px);
        overflow: hidden;
        text-overflow: ellipsis;
        position: relative;
        opacity: 0;
        animation: buttonPop 0.4s ease forwards;
    }

	    .score-value {
            background-color: #22c55e;
            color: white;
            padding: 4px 14px;
            border-radius: 24px;
            font-size: 14px;
            font-weight: 600;
            letter-spacing: 0.3px;
            position: relative;
            overflow: hidden;
            transition: background-color 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .score-value::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(90deg, rgba(255,255,255,0.1), rgba(255,255,255,0.2), rgba(255,255,255,0.1));
            transform: translateX(-100%);
            animation: shimmer 2s infinite;
        }

        @keyframes shimmer {
            100% {
                transform: translateX(100%);
            }
        }

        .score-value.animate {
            animation: scorePop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes scorePop {
            0% {
                transform: scale(0.8);
                opacity: 0;
            }
            50% {
                transform: scale(1.1);
            }
            100% {
                transform: scale(1);
                opacity: 1;
            }
        }
        

        @keyframes buttonPop {
            0% {
                opacity: 0;
                transform: scale(0.95);
            }
            50% {
                transform: scale(1.05);
            }
            100% {
                opacity: 1;
                transform: scale(1);
            }
        }

        .suggestion-button:nth-child(1) { animation-delay: 0.8s; }
        .suggestion-button:nth-child(2) { animation-delay: 0.9s; }
        .suggestion-button:nth-child(3) { animation-delay: 1.0s; }
    
        .suggestion-button:hover {
            background-color: #e5e7eb;
            color: #1f2937;
            transform: translateY(-1px);
        }
    
        #input-area {
            display: flex;
            padding: 20px 24px;
            background-color: #ffffff;
            border-top: 1px solid #e1e4e8;
            gap: 12px;
            opacity: 0;
            animation: sectionFade 0.5s ease forwards;
            animation-delay: 0.9s;
        }
    
        #message-input {
            flex-grow: 1;
            padding: 12px 16px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            resize: none;
            font-size: 15px;
            line-height: 1.5;
            font-family: inherit;
            opacity: 0;
            animation: sectionFade 0.5s ease forwards;
            animation-delay: 1s;
        }
    
        #message-input:focus {
            outline: none;
            border-color: #2563eb;
            box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
        }
    
        #send-button {
            padding: 12px 24px;
            background-color: #2563eb;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 500;
            font-size: 15px;
            opacity: 0;
            animation: buttonPop 0.4s ease forwards;
            animation-delay: 1.1s;
        }
    
        #send-button:hover {
            background-color: #1d4ed8;
        }

		.suggestion-button {
    position: relative;
    overflow: hidden;
}

.suggestion-button:hover {
    background-color: #e5e7eb;
    color: #1f2937;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.suggestion-button:active {
    transform: translateY(1px);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.suggestion-button::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 5px;
    height: 5px;
    background: rgba(255, 255, 255, 0.5);
    opacity: 0;
    border-radius: 100%;
    transform: scale(1, 1) translate(-50%);
    transform-origin: 50% 50%;
}

.suggestion-button:focus:not(:active)::after {
    animation: ripple 1s ease-out;
}

@keyframes ripple {
    0% {
        transform: scale(0, 0);
        opacity: 0.5;
    }
    100% {
        transform: scale(30, 30);
        opacity: 0;
    }
}

#send-button {
    padding: 12px 24px;
    background-color: #2563eb;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    font-size: 15px;
    opacity: 1; 
    animation: buttonPop 0.4s ease forwards;
    animation-delay: 1.1s;
}
#send-button.animate-send {
    animation: sendPulse 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes sendPulse {
    0% {
        transform: scale(1);
        opacity: 1;
    }
    50% {
        transform: scale(0.95);
        opacity: 1;
    }
    100% {
        transform: scale(1);
        opacity: 1;
    }
}

.error-message {
    color: #dc2626;
    font-size: 14px;
    padding: 8px 12px;
    margin-top: 8px;
    background-color: #fee2e2;
    border-radius: 6px;
    transform: translateY(-10px);
    opacity: 0;
    position: absolute;
    bottom: 100%;
    left: 24px;
    right: 24px;
    animation: errorSlide 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes errorSlide {
    0% {
        transform: translateY(-10px);
        opacity: 0;
    }
    100% {
        transform: translateY(0);
        opacity: 1;
    }
}

@keyframes errorSlideOut {
    0% {
        transform: translateY(0);
        opacity: 1;
    }
    100% {
        transform: translateY(-10px);
        opacity: 0;
    }
}
#send-button:disabled {
    background-color: #94a3b8;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
    opacity: 1;
}

#send-button:disabled:hover {
    background-color: #94a3b8;
    transform: none;
    box-shadow: none;
    opacity: 1;
}
`