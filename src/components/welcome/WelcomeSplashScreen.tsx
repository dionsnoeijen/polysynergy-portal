'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';

const Brain3D = dynamic(() => import('./Brain3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="animate-pulse text-purple-400">Loading...</div>
    </div>
  ),
});

interface WelcomeSplashScreenProps {
  onClose: () => void;
}

export default function WelcomeSplashScreen({ onClose }: WelcomeSplashScreenProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Fade in animation
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  const handleGetStarted = () => {
    setIsVisible(false);
    setTimeout(() => onClose(), 300);
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-black transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Brain3D Background */}
      <div className="absolute inset-0">
        <Brain3D />
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/70" />

      {/* Content */}
      <div className="relative h-full w-full flex flex-col items-center justify-center px-6 py-12 overflow-y-auto">
        <div
          className={`max-w-2xl w-full space-y-8 transition-all duration-500 delay-200 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Image
              src="/logo-with-text.svg"
              alt="PolySynergy"
              width={300}
              height={75}
              className="brightness-0 invert"
              priority
            />
          </div>

          {/* Welcome Message */}
          <div className="text-center space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold text-white" style={{ textShadow: '0 0 40px rgba(0, 0, 0, 0.9), 0 0 20px rgba(0, 0, 0, 0.8)' }}>
              Welcome to PolySynergy
            </h1>
            <p className="text-xl md:text-2xl text-purple-300" style={{ textShadow: '0 0 30px rgba(0, 0, 0, 0.9), 0 0 15px rgba(0, 0, 0, 0.8)' }}>
              Visual Node-Based Automation Platform
            </p>
          </div>

          {/* Alpha Notice */}
          <div className="bg-purple-900/60 border border-purple-400/60 rounded-lg p-6 backdrop-blur-md">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-purple-500/40 text-purple-200 text-xl font-bold">
                  α
                </span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">
                  This is an Alpha Release
                </h3>
                <p className="text-gray-100 text-sm leading-relaxed">
                  You&apos;re using early-access software. Some features may be incomplete or change over time.
                  We appreciate your patience and feedback as we continue to improve the platform.
                </p>
              </div>
            </div>
          </div>

          {/* Contact & Support */}
          <div className="bg-black/50 border border-white/20 rounded-lg p-6 backdrop-blur-md space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              Need Help or Want to Connect?
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Email */}
              <a
                href="mailto:dion@polysynergy.com"
                className="flex items-center gap-3 p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors group"
              >
                <div className="flex-shrink-0 text-2xl">📧</div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-300 mb-1">Email Support</div>
                  <div className="text-sm text-white group-hover:text-purple-300 transition-colors truncate">
                    dion@polysynergy.com
                  </div>
                </div>
              </a>

              {/* Discord */}
              <a
                href="https://discord.gg/g3atXten"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors group"
              >
                <div className="flex-shrink-0 text-2xl">💬</div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-300 mb-1">Join Community</div>
                  <div className="text-sm text-white group-hover:text-purple-300 transition-colors">
                    Discord Server
                  </div>
                </div>
              </a>

              {/* GitHub Issues */}
              <a
                href="https://github.com/polysynergy/polysynergy/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors group md:col-span-2"
              >
                <div className="flex-shrink-0 text-2xl">🐛</div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-300 mb-1">Report Issues</div>
                  <div className="text-sm text-white group-hover:text-purple-300 transition-colors">
                    GitHub Issues Tracker
                  </div>
                </div>
              </a>
            </div>
          </div>

          {/* Get Started Button */}
          <div className="flex justify-center pt-6">
            <button
              onClick={handleGetStarted}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              Get Started
            </button>
          </div>

          {/* Footer Text */}
          <p className="text-center text-xs text-gray-400 pt-4" style={{ textShadow: '0 0 20px rgba(0, 0, 0, 0.9)' }}>
            By using PolySynergy, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
