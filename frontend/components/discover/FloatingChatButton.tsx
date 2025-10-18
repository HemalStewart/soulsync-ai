'use client';

import { MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const FloatingChatButton = () => {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.8);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
          }
          50% {
            box-shadow: 0 0 0 12px rgba(59, 130, 246, 0);
          }
        }

        @keyframes rotate-icon {
          from {
            transform: rotate(0deg) scale(1);
          }
          to {
            transform: rotate(360deg) scale(1);
          }
        }

        @keyframes bounce {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }

        .animate-slide-up {
          animation: slideUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-pulse-glow {
          animation: pulse-glow 2.5s infinite;
        }

        .animate-rotate-icon {
          animation: rotate-icon 0.6s ease-in-out;
        }

        .animate-bounce {
          animation: bounce 0.4s ease-in-out;
        }

        .floating-button {
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .floating-button:hover {
          transform: scale(1.15) rotate(-15deg);
          box-shadow: 0 15px 40px rgba(59, 130, 246, 0.4);
        }

        .floating-button:active {
          transform: scale(1.05) rotate(-15deg);
        }

        .icon-pulse {
          transition: all 0.3s ease;
        }

        @media (max-width: 640px) {
          .floating-button {
            width: 3rem;
            height: 3rem;
            bottom: 6rem;
            right: 1rem;
          }

          .floating-button:hover {
            transform: scale(1.1) rotate(-15deg);
          }
        }
      `}</style>

      <button
        onClick={() => router.push('/chats')}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl transition animate-slide-up animate-float floating-button"
        aria-label="Open chats"
      >
        <MessageCircle 
          className={`w-6 h-6 text-white transition-all duration-300 ${isHovered ? 'animate-rotate-icon' : ''}`}
        />
      </button>
    </>
  );
};

export default FloatingChatButton;