import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function Home() {
  const [floatOffset, setFloatOffset] = useState(0);
  const player = JSON.parse(localStorage.getItem('player') || 'null');

  useEffect(() => {
    let frame;
    const animate = () => {
      setFloatOffset(Math.sin(Date.now() / 600) * 15);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="page-container">
      {/* Hero Section */}
      <section className="relative flex-1 flex items-center justify-center overflow-hidden px-4 py-16">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/5 rounded-full blur-3xl animate-float-slow" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-game-bird/5 rounded-full blur-3xl animate-float" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-game-pipe/3 rounded-full blur-3xl" />

          {/* Decorative clouds */}
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-white/5 rounded-full"
              style={{
                width: `${60 + i * 30}px`,
                height: `${30 + i * 15}px`,
                top: `${10 + i * 15}%`,
                left: `${5 + i * 18}%`,
                animation: `float ${4 + i}s ease-in-out infinite`,
                animationDelay: `${i * 0.5}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          {/* Floating bird */}
          <div
            className="text-8xl md:text-9xl mb-6 inline-block"
            style={{ transform: `translateY(${floatOffset}px)` }}
          >
            🐦
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-7xl font-black mb-4">
            <span className="bg-gradient-to-r from-game-bird via-primary-300 to-game-pipe bg-clip-text text-transparent">
              Flappy Bird
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-primary-300/80 font-medium mb-2">
            Rehabilitation Edition
          </p>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-10">
            Play the classic Flappy Bird game right in your browser!
            Use keyboard, touch controls, or your <span className="text-primary-300 font-medium">hand gestures</span> via webcam.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to={player ? '/game' : '/login'}
              className="btn-game text-lg flex items-center gap-3"
            >
              <span>🎮</span>
              <span>{player ? 'Play Now' : 'Get Started'}</span>
            </Link>
            <Link to="/leaderboard" className="btn-secondary flex items-center gap-3">
              <span>🏆</span>
              <span>Leaderboard</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="section-title text-center mb-16">How It Works</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '🖐️',
                title: 'Hand Gesture Control',
                desc: 'Close your hand in front of the webcam to make the bird flap. Same gesture recognition as the desktop version!',
                gradient: 'from-primary-400 to-cyan-400',
              },
              {
                icon: '📱',
                title: 'Play Anywhere',
                desc: 'Works on any device — desktop, tablet, or mobile. Use keyboard, mouse, or touch controls.',
                gradient: 'from-game-pipe to-emerald-400',
              },
              {
                icon: '📊',
                title: 'Track Progress',
                desc: 'Your scores and session data are saved. View your stats, compare with others on the leaderboard.',
                gradient: 'from-game-bird to-orange-400',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="glass-card-hover p-8 text-center"
                style={{ animationDelay: `${i * 0.15}s` }}
              >
                <div className="text-5xl mb-5">{feature.icon}</div>
                <h3 className={`text-xl font-bold mb-3 bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent`}>
                  {feature.title}
                </h3>
                <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Controls Info */}
      <section className="py-16 px-4 border-t border-slate-800/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="section-title text-center mb-12">Controls</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: '⌨️', label: 'Spacebar', desc: 'Desktop keyboard' },
              { icon: '🖱️', label: 'Click', desc: 'Mouse click on canvas' },
              { icon: '👆', label: 'Tap', desc: 'Touch screen tap' },
              { icon: '✊', label: 'Close Hand', desc: 'Webcam gesture' },
            ].map((ctrl, i) => (
              <div key={i} className="glass-card p-5 text-center">
                <div className="text-3xl mb-2">{ctrl.icon}</div>
                <div className="font-semibold text-slate-200">{ctrl.label}</div>
                <div className="text-sm text-slate-500">{ctrl.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-slate-800/50 text-center text-slate-500 text-sm">
        <p>🐦 Flappy Bird Rehab — Hand Gesture Controlled Game for Rehabilitation</p>
      </footer>
    </div>
  );
}
