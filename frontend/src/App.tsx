import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';
import axios, { AxiosResponse } from 'axios';

// === TYPE DEFINITIONS ===
interface Theme {
  bg: string;
  card: string;
  text: string;
  accent: string;
  accentSolid: string;
  button: string;
  input: string;
  sponsor: string;
}

interface UserStats {
  daily_usage: number;
  monthly_usage: number;
  total_usage: number;
  daily_limit: number;
  monthly_limit: number;
  available_models: string[];
  features_enabled: string[];
  is_open_source: boolean;
}

interface GenerationParams {
  temp: number;
  top_p: number;
  model: string;
  persona: string;
}

interface HistoryEntry {
  prompt: string;
  output: string;
  dna: string;
  parameters: GenerationParams;
  model_used: string;
  generation_time: number;
  timestamp: string;
}

interface TripRequest {
  user_id: string;
  prompt: string;
  temp: number;
  top_p: number;
  model: string;
  persona: string;
  voice_enabled?: boolean;
  lang?: string;
}

interface TripResponse {
  output: string;
  dna: string;
  user_id: string;
  voice?: string;
  generation_time: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
}

interface FavoriteEntry {
  id: number;
  prompt: string;
  output: string;
  timestamp: string;
  dna: string;
}

interface BatchResult {
  prompt: string;
  output: string;
  dna: string | null;
}

interface AdvancedSettings {
  style: string;
  length: string;
  creativity: number;
}

interface CommunityPrompt {
  title: string;
  prompt: string;
  description: string;
  tags: string[];
  likes: number;
  downloads: number;
  is_featured: boolean;
  created_at: string;
}

interface Sponsor {
  name: string;
  tier: string;
  logo_url: string;
  website_url: string;
  message: string;
}

// === BACKEND CONFIG ===
const API_BASE_URL = 'http://localhost:5000';

// === THEMES ===
const themes: Record<'dark' | 'light', Theme> = {
  dark: {
    bg: 'bg-gradient-to-br from-purple-900 via-gray-900 to-black',
    card: 'bg-black/30 backdrop-blur-xl border border-purple-500/20 shadow-2xl shadow-purple-500/10',
    text: 'text-gray-100',
    accent: 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400',
    accentSolid: 'text-cyan-400',
    button: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700',
    input: 'bg-black/20 border-purple-500/30 focus:border-purple-500 focus:ring-purple-500/20',
    sponsor: 'bg-gradient-to-r from-yellow-400 to-orange-500',
  },
  light: {
    bg: 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50',
    card: 'bg-white/70 backdrop-blur-xl border border-purple-200/50 shadow-xl shadow-purple-200/20',
    text: 'text-gray-900',
    accent: 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600',
    accentSolid: 'text-indigo-600',
    button: 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700',
    input: 'bg-white/50 border-purple-200 focus:border-purple-500 focus:ring-purple-500/20',
    sponsor: 'bg-gradient-to-r from-yellow-400 to-orange-500',
  },
};

// === COMPONENT PROPS INTERFACES ===
interface FloatingParticlesProps {
  theme: Theme;
  count?: number;
}

interface NeuralNetworkProps {
  isActive: boolean;
  theme: Theme;
}

interface GlitchTextProps {
  children: React.ReactNode;
  className?: string;
}

interface OpenSourceBadgeProps {
  theme: Theme;
}

interface UsageMeterProps {
  used: number;
  limit: number;
  label: string;
  theme: Theme;
}

interface PromptSuggestionsProps {
  theme: Theme;
  onSelectPrompt: (prompt: string) => void;
}

interface VoiceRecorderProps {
  theme: Theme;
  onTranscript: (text: string) => void;
}

interface BatchGeneratorProps {
  theme: Theme;
  onBatchGenerate: (prompts: string[]) => void;
}

interface AdvancedSettingsProps {
  theme: Theme;
  settings: AdvancedSettings;
  onSettingsChange: (key: string, value: any) => void;
}

interface CommunityPanelProps {
  theme: Theme;
  prompts: CommunityPrompt[];
  onSelectPrompt: (prompt: string) => void;
}

interface SponsorshipPanelProps {
  theme: Theme;
  sponsors: Sponsor[];
}

interface ExportPanelProps {
  theme: Theme;
  onExport: (format: string) => void;
  hasContent: boolean;
}

interface ContributePanelProps {
  theme: Theme;
}

// === FLOATING PARTICLES ===
const FloatingParticles: React.FC<FloatingParticlesProps> = ({ theme, count = 20 }) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const newParticles: Particle[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 20 + 15,
    }));
    setParticles(newParticles);
  }, [count]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className={`absolute rounded-full ${theme.accentSolid} opacity-20`}
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
          }}
          animate={{
            x: [0, Math.random() * 200 - 100],
            y: [0, Math.random() * 200 - 100],
            scale: [1, 1.5, 1],
            opacity: [0.2, 0.8, 0.2],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
};

// === NEURAL NETWORK ===
const NeuralNetwork: React.FC<NeuralNetworkProps> = ({ isActive, theme }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    interface Node {
      x: number;
      y: number;
      connections: Node[];
    }
    
    const nodes: Node[] = Array.from({ length: 12 }, (_, i) => ({
      x: (i % 4) * 80 + 40,
      y: Math.floor(i / 4) * 60 + 30,
      connections: [],
    }));

    // Create connections
    nodes.forEach((node, i) => {
      nodes.slice(i + 1).forEach((otherNode) => {
        if (Math.random() > 0.6) {
          node.connections.push(otherNode);
        }
      });
    });

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw connections
      ctx.strokeStyle = isActive ? '#8b5cf6' : '#6b7280';
      ctx.lineWidth = 1;
      ctx.globalAlpha = isActive ? 0.8 : 0.3;
      
      nodes.forEach(node => {
        node.connections.forEach(connection => {
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(connection.x, connection.y);
          ctx.stroke();
        });
      });

      // Draw nodes
      ctx.fillStyle = isActive ? '#06b6d4' : '#6b7280';
      ctx.globalAlpha = 1;
      
      nodes.forEach(node => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, isActive ? 6 : 4, 0, Math.PI * 2);
        ctx.fill();
      });

      if (isActive) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }, [isActive, theme]);

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={180}
      className="w-full h-32 rounded-lg bg-black/10"
    />
  );
};

// === GLITCH TEXT ===
const GlitchText: React.FC<GlitchTextProps> = ({ children, className = "" }) => {
  return (
    <motion.div
      className={`relative ${className}`}
      animate={{
        textShadow: [
          "0 0 0 transparent",
          "2px 0 0 #ff00ff, -2px 0 0 #00ffff",
          "0 0 0 transparent",
        ],
      }}
      transition={{
        duration: 0.1,
        repeat: Infinity,
        repeatDelay: 4,
      }}
    >
      {children}
    </motion.div>
  );
};

// === OPEN SOURCE BADGE ===
const OpenSourceBadge: React.FC<OpenSourceBadgeProps> = ({ theme }) => (
  <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r from-green-500 to-blue-500">
    🌟 FREE & OPEN SOURCE
  </div>
);

// === USAGE METER ===
const UsageMeter: React.FC<UsageMeterProps> = ({ used, limit, label, theme }) => {
  const isUnlimited = limit === -1;
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className={theme.accentSolid}>
          {isUnlimited ? `${used}/∞` : `${used}/${limit}`}
        </span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <motion.div
          className="h-2 rounded-full bg-gradient-to-r from-green-500 to-blue-500"
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 0.5 }}
        />
      </div>
      {isUnlimited && (
        <p className="text-xs text-green-400">✨ Unlimited - Thanks to open source!</p>
      )}
    </div>
  );
};

// === PROMPT SUGGESTIONS ===
const PromptSuggestions: React.FC<PromptSuggestionsProps> = ({ theme, onSelectPrompt }) => {
  const suggestions = [
    "Digital dragons soaring through cyberpunk cityscapes made of flowing data streams",
    "Quantum cats phasing between parallel dimensions of pure mathematics", 
    "Neon forests growing in abandoned space stations, their leaves glowing with bioluminescence",
    "Holographic butterflies dancing in virtual rain that tastes like memories",
    "Crystalline mountains singing electronic melodies that reshape reality itself",
    "Cosmic libraries where books are made of compressed starlight and dreams",
    "Mechanical flowers blooming in gardens of circuit boards and silicon soil"
  ];

  return (
    <motion.div
      className={`${theme.card} p-6 rounded-2xl`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h3 className={`text-lg font-bold ${theme.accent} mb-4`}>✨ Creative Inspiration</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {suggestions.map((suggestion, i) => (
          <motion.button
            key={i}
            className={`w-full text-left p-3 rounded-lg ${theme.input} border hover:border-purple-400 transition-all`}
            whileHover={{ scale: 1.02, x: 5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectPrompt(suggestion)}
          >
            <span className="text-sm">{suggestion}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

// === VOICE RECORDER ===
const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ theme, onTranscript }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      recorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          // Simulate transcription (in real app, send to speech-to-text API)
          const mockTranscripts = [
            "Cosmic cats dancing through digital dimensions of pure imagination",
            "Neural networks dreaming of electric sheep in quantum meadows",
            "Holographic phoenixes rising from ashes of forgotten algorithms"
          ];
          const randomTranscript = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)];
          onTranscript(randomTranscript);
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Recording failed:', error);
      alert('❌ Microphone access denied. Please allow microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <motion.button
        className={`p-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : theme.button} text-white transition-all`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={isRecording ? stopRecording : startRecording}
      >
        {isRecording ? '⏹️' : '🎤'}
      </motion.button>
      <span className="text-sm opacity-70">
        {isRecording ? 'Recording...' : 'Voice Input (FREE!)'}
      </span>
    </div>
  );
};

// === BATCH GENERATOR ===
const BatchGenerator: React.FC<BatchGeneratorProps> = ({ theme, onBatchGenerate }) => {
  const [batchPrompts, setBatchPrompts] = useState(['', '', '']);

  const handleBatchGenerate = () => {
    const validPrompts = batchPrompts.filter(p => p.trim());
    if (validPrompts.length === 0) {
      alert('Please enter at least one prompt');
      return;
    }
    
    onBatchGenerate(validPrompts);
  };

  const addPromptField = () => {
    if (batchPrompts.length < 10) {
      setBatchPrompts([...batchPrompts, '']);
    }
  };

  const removePromptField = (index: number) => {
    if (batchPrompts.length > 1) {
      setBatchPrompts(batchPrompts.filter((_, i) => i !== index));
    }
  };

  return (
    <motion.div
      className={`${theme.card} p-6 rounded-2xl`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-bold ${theme.accent}`}>🚀 Batch Generator</h3>
        <OpenSourceBadge theme={theme} />
      </div>
      
      <div className="space-y-3 mb-4">
        {batchPrompts.map((prompt, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={prompt}
              onChange={(e) => {
                const newPrompts = [...batchPrompts];
                newPrompts[i] = e.target.value;
                setBatchPrompts(newPrompts);
              }}
              placeholder={`Prompt ${i + 1}...`}
              className={`flex-1 p-3 rounded-xl ${theme.input} border transition-all`}
            />
            {batchPrompts.length > 1 && (
              <button
                onClick={() => removePromptField(i)}
                className="px-3 py-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-all"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-4">
        <motion.button
          onClick={addPromptField}
          className="px-4 py-2 rounded-lg border border-dashed border-purple-400 hover:bg-purple-500/20 transition-all"
          whileHover={{ scale: 1.02 }}
          disabled={batchPrompts.length >= 10}
        >
          + Add Prompt
        </motion.button>
      </div>
      
      <motion.button
        className={`w-full py-3 rounded-xl font-bold text-white ${theme.button} transition-all`}
        whileHover={{ scale: 1.02 }}
        onClick={handleBatchGenerate}
      >
        🚀 Generate Batch (FREE!)
      </motion.button>
    </motion.div>
  );
};

// === ADVANCED SETTINGS ===
const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({ theme, settings, onSettingsChange }) => (
  <motion.div
    className={`${theme.card} p-6 rounded-2xl`}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <div className="flex items-center justify-between mb-4">
      <h3 className={`text-lg font-bold ${theme.accent}`}>⚙️ Advanced Settings</h3>
      <OpenSourceBadge theme={theme} />
    </div>
    
    <div className="space-y-4">
      <div>
        <label className={`block mb-2 font-semibold ${theme.accentSolid}`}>
          🎨 Generation Style
        </label>
        <select
          value={settings.style}
          onChange={(e) => onSettingsChange('style', e.target.value)}
          className={`w-full p-3 rounded-xl ${theme.input} border`}
        >
          <option value="creative">🎭 Creative & Imaginative</option>
          <option value="technical">🔬 Technical & Precise</option>
          <option value="poetic">📝 Poetic & Lyrical</option>
          <option value="scientific">🧪 Scientific & Analytical</option>
          <option value="experimental">⚡ Experimental & Wild</option>
          <option value="philosophical">🤔 Philosophical & Deep</option>
        </select>
      </div>

      <div>
        <label className={`block mb-2 font-semibold ${theme.accentSolid}`}>
          📏 Output Length
        </label>
        <select
          value={settings.length}
          onChange={(e) => onSettingsChange('length', e.target.value)}
          className={`w-full p-3 rounded-xl ${theme.input} border`}
        >
          <option value="short">📝 Short (100-200 words)</option>
          <option value="medium">📄 Medium (200-400 words)</option>
          <option value="long">📚 Long (400-600 words)</option>
          <option value="extended">📖 Extended (600+ words)</option>
          <option value="epic">📜 Epic (1000+ words)</option>
        </select>
      </div>

      <div>
        <label className={`block mb-2 font-semibold ${theme.accentSolid}`}>
          🧠 Creativity Level: {settings.creativity.toFixed(1)}
        </label>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={settings.creativity}
          onChange={(e) => onSettingsChange('creativity', Number(e.target.value))}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-purple-200 dark:bg-purple-700"
        />
        <div className="flex justify-between text-xs mt-1 opacity-70">
          <span>🤖 Logical</span>
          <span>⚖️ Balanced</span>
          <span>🌟 Wild</span>
        </div>
      </div>
    </div>
  </motion.div>
);

// === COMMUNITY PANEL ===
const CommunityPanel: React.FC<CommunityPanelProps> = ({ theme, prompts, onSelectPrompt }) => {
  return (
    <motion.div
      className={`${theme.card} p-6 rounded-2xl`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h3 className={`text-lg font-bold ${theme.accent} mb-4`}>🌍 Community Prompts</h3>
      
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {prompts.length > 0 ? prompts.map((communityPrompt, i) => (
          <motion.div 
            key={i} 
            className={`${theme.input} border p-3 rounded-lg cursor-pointer transition-all hover:border-purple-400`}
            whileHover={{ scale: 1.02 }}
            onClick={() => onSelectPrompt(communityPrompt.prompt)}
          >
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold text-sm">{communityPrompt.title}</h4>
              {communityPrompt.is_featured && <span className="text-xs bg-yellow-500 text-black px-2 py-1 rounded">⭐ Featured</span>}
            </div>
            <p className="text-xs opacity-70 mb-2">{communityPrompt.description}</p>
            <p className="text-xs truncate">{communityPrompt.prompt}</p>
            <div className="flex justify-between items-center mt-2">
              <div className="flex gap-2">
                {communityPrompt.tags.slice(0, 3).map((tag, j) => (
                  <span key={j} className="text-xs bg-purple-500/20 px-2 py-1 rounded">#{tag}</span>
                ))}
              </div>
              <div className="flex gap-3 text-xs opacity-70">
                <span>❤️ {communityPrompt.likes}</span>
                <span>⬇️ {communityPrompt.downloads}</span>
              </div>
            </div>
          </motion.div>
        )) : (
          <p className="text-center opacity-70">Loading community prompts...</p>
        )}
      </div>
    </motion.div>
  );
};

// === SPONSORSHIP PANEL ===
const SponsorshipPanel: React.FC<SponsorshipPanelProps> = ({ theme, sponsors }) => {
  return (
    <motion.div
      className={`${theme.card} p-6 rounded-2xl`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h3 className={`text-lg font-bold ${theme.accent} mb-4`}>💝 Our Amazing Sponsors</h3>
      
      <div className="space-y-4">
        {sponsors.map((sponsor, i) => (
          <motion.div 
            key={i} 
            className={`${theme.input} border p-4 rounded-lg transition-all hover:border-purple-400`}
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">{sponsor.name}</h4>
              <span className={`text-xs px-2 py-1 rounded ${
                sponsor.tier === 'platinum' ? 'bg-purple-500 text-white' :
                sponsor.tier === 'gold' ? 'bg-yellow-500 text-black' :
                sponsor.tier === 'silver' ? 'bg-gray-400 text-black' :
                'bg-orange-500 text-white'
              }`}>
                {sponsor.tier.toUpperCase()}
              </span>
            </div>
            {sponsor.message && (
              <p className="text-sm opacity-80 mb-2">{sponsor.message}</p>
            )}
            {sponsor.website_url && (
              <a 
                href={sponsor.website_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className={`text-sm ${theme.accentSolid} hover:underline`}
              >
                Visit Website →
              </a>
            )}
          </motion.div>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg border border-purple-500/30">
        <h4 className="font-semibold mb-2">🌟 Become a Sponsor</h4>
        <p className="text-sm opacity-80 mb-3">Support open-source AI creativity and get your name here!</p>
        <div className="flex gap-2 flex-wrap">
          <motion.a
            href="https://github.com/sponsors/your-username"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800 transition-all"
            whileHover={{ scale: 1.05 }}
          >
            💖 GitHub Sponsors
          </motion.a>
          <motion.a
            href="https://opencollective.com/ai-hallucination-playground"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-all"
            whileHover={{ scale: 1.05 }}
          >
            🏛️ Open Collective
          </motion.a>
        </div>
      </div>
    </motion.div>
  );
};

// === CONTRIBUTE PANEL ===
const ContributePanel: React.FC<ContributePanelProps> = ({ theme }) => {
  return (
    <motion.div
      className={`${theme.card} p-6 rounded-2xl`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h3 className={`text-lg font-bold ${theme.accent} mb-4`}>🤝 Contribute to the Project</h3>
      
      <div className="space-y-4">
        <div className={`${theme.input} border p-4 rounded-lg`}>
          <h4 className="font-semibold mb-2">🛠️ Code Contributions</h4>
          <p className="text-sm opacity-80 mb-2">Help improve the codebase, add features, or fix bugs.</p>
          <motion.a
            href="https://github.com/ai-hallucination-playground/ai-hallucination-playground"
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-block px-3 py-2 ${theme.button} text-white rounded-lg text-sm transition-all`}
            whileHover={{ scale: 1.05 }}
          >
            🔗 View on GitHub
          </motion.a>
        </div>
        
        <div className={`${theme.input} border p-4 rounded-lg`}>
          <h4 className="font-semibold mb-2">🎨 Design & UX</h4>
          <p className="text-sm opacity-80 mb-2">Help make the interface more beautiful and user-friendly.</p>
          <span className="text-sm opacity-70">Join our Discord for design discussions</span>
        </div>
        
        <div className={`${theme.input} border p-4 rounded-lg`}>
          <h4 className="font-semibold mb-2">📚 Documentation</h4>
          <p className="text-sm opacity-80 mb-2">Improve docs, write tutorials, or create guides.</p>
          <span className="text-sm opacity-70">All skill levels welcome!</span>
        </div>
        
        <div className={`${theme.input} border p-4 rounded-lg`}>
          <h4 className="font-semibold mb-2">🌐 Translation</h4>
          <p className="text-sm opacity-80 mb-2">Help translate the interface to other languages.</p>
          <span className="text-sm opacity-70">Currently supporting: EN, PT, ES, FR</span>
        </div>
      </div>
      
      <div className="mt-6 text-center">
        <p className="text-sm opacity-70 mb-3">Made with ❤️ by the open-source community</p>
        <div className="flex justify-center gap-3">
          <motion.a
            href="https://discord.gg/ai-hallucination-playground"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm hover:underline"
            whileHover={{ scale: 1.05 }}
          >
            💬 Discord
          </motion.a>
          <motion.a
            href="https://twitter.com/ai_hallucination"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm hover:underline"
            whileHover={{ scale: 1.05 }}
          >
            🐦 Twitter
          </motion.a>
          <motion.a
            href="https://reddit.com/r/AIHallucinationPlayground"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm hover:underline"
            whileHover={{ scale: 1.05 }}
          >
            🔴 Reddit
          </motion.a>
        </div>
      </div>
    </motion.div>
  );
};

// === EXPORT PANEL ===
const ExportPanel: React.FC<ExportPanelProps> = ({ theme, onExport, hasContent }) => (
  <motion.div
    className={`${theme.card} p-6 rounded-2xl`}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <h3 className={`text-lg font-bold ${theme.accent} mb-4`}>📤 Export Options</h3>
    
    <div className="grid grid-cols-2 gap-2">
      {[
        { format: 'json', label: '📋 JSON', desc: 'Full data' },
        { format: 'txt', label: '📝 Text', desc: 'Plain text' },
        { format: 'md', label: '📄 Markdown', desc: 'Formatted' },
        { format: 'pdf', label: '📊 PDF', desc: 'Document' }
      ].map((item) => (
        <motion.button
          key={item.format}
          className={`p-3 rounded-lg ${hasContent ? theme.input + ' border hover:border-purple-400' : 'bg-gray-500/20 cursor-not-allowed'} transition-all text-left`}
          whileHover={hasContent ? { scale: 1.02 } : {}}
          onClick={() => hasContent && onExport(item.format)}
          disabled={!hasContent}
        >
          <div className="font-semibold text-sm">{item.label}</div>
          <div className="text-xs opacity-70">{item.desc}</div>
        </motion.button>
      ))}
    </div>
  </motion.div>
);

// === USER MANAGEMENT ===
const getUserId = (): string => {
  let userId = localStorage.getItem('hallucination_user_id');
  if (!userId) {
    userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('hallucination_user_id', userId);
  }
  return userId;
};

// === MAIN APP ===
const App: React.FC = () => {
  // === CORE STATE ===
  const [dark, setDark] = useState<boolean>(true);
  const [prompt, setPrompt] = useState<string>('Cosmic cats dancing through fractal dimensions of digital consciousness, their whiskers trailing stardust and binary dreams...');
  const [temp, setTemp] = useState<number>(1.3);
  const [topP, setTopP] = useState<number>(0.9);
  const [model, setModel] = useState<string>('dolphin-phi:latest');
  const [persona, setPersona] = useState<string>('Cyber-shaman');
  const [output, setOutput] = useState<string>('');
  const [dna, setDna] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  // === USER STATS ===
  const [userId] = useState<string>(getUserId());
  const [userStats, setUserStats] = useState<UserStats>({
    daily_usage: 0,
    monthly_usage: 0,
    total_usage: 0,
    daily_limit: -1,
    monthly_limit: -1,
    available_models: ['dolphin-phi:latest'],
    features_enabled: [],
    is_open_source: true
  });
  
  // === DNA REMIX ===
  const [dnaA, setDnaA] = useState<string>('');
  const [dnaB, setDnaB] = useState<string>('');
  const [remix, setRemix] = useState<string>('');
  
  // === VOICE ===
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(false);
  const [audioData, setAudioData] = useState<string>('');
  
  // === HISTORY ===
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  // === COMMUNITY & FEATURES STATE ===
  const [favoritePrompts, setFavoritePrompts] = useState<FavoriteEntry[]>([]);
  const [showPromptLibrary, setShowPromptLibrary] = useState<boolean>(false);
  const [batchResults, setBatchResults] = useState<BatchResult[]>([]);
  const [showBatchResults, setShowBatchResults] = useState<boolean>(false);
  const [communityPrompts, setCommunityPrompts] = useState<CommunityPrompt[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [advancedSettings, setAdvancedSettings] = useState<AdvancedSettings>({
    style: 'creative',
    length: 'medium',
    creativity: 1.3
  });

  // === LOAD DATA ===
  useEffect(() => {
    loadUserStats();
    loadHistory();
    loadFavorites();
    loadCommunityPrompts();
    loadSponsors();
  }, [userId]);

  const loadUserStats = async (): Promise<void> => {
    try {
      const response: AxiosResponse<UserStats> = await axios.get(`${API_BASE_URL}/user/stats`, {
        params: { user_id: userId }
      });
      setUserStats(response.data);
    } catch (error) {
      console.error('Failed to load user stats:', error);
    }
  };

  const loadHistory = async (): Promise<void> => {
    try {
      const response: AxiosResponse<{ history: HistoryEntry[] }> = await axios.get(`${API_BASE_URL}/history`, {
        params: { user_id: userId }
      });
      setHistory(response.data.history || []);
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const loadCommunityPrompts = async (): Promise<void> => {
    try {
      const response: AxiosResponse<{ prompts: CommunityPrompt[] }> = await axios.get(`${API_BASE_URL}/community/prompts`);
      setCommunityPrompts(response.data.prompts || []);
    } catch (error) {
      console.error('Failed to load community prompts:', error);
    }
  };

  const loadSponsors = async (): Promise<void> => {
    try {
      const response: AxiosResponse<{ sponsors: Sponsor[] }> = await axios.get(`${API_BASE_URL}/sponsors`);
      setSponsors(response.data.sponsors || []);
    } catch (error) {
      console.error('Failed to load sponsors:', error);
    }
  };

  const loadFavorites = (): void => {
    const saved = localStorage.getItem(`favorites_${userId}`);
    if (saved) {
      setFavoritePrompts(JSON.parse(saved));
    }
  };

  const saveFavorites = (favorites: FavoriteEntry[]): void => {
    localStorage.setItem(`favorites_${userId}`, JSON.stringify(favorites));
  };

  // === CORE FUNCTIONS ===
  const hallucinate = async (): Promise<void> => {
    setLoading(true);
    setError('');
    
    try {
      const payload: TripRequest = {
        user_id: userId,
        prompt,
        temp,
        top_p: topP,
        model,
        persona,
        voice_enabled: voiceEnabled,
        lang: 'pt-BR'
      };

      const response: AxiosResponse<TripResponse> = await axios.post(`${API_BASE_URL}/trip`, payload, {
        timeout: 120000
      });

      const { output: aiOutput, dna: aiDna, voice, generation_time } = response.data;
      
      setOutput(aiOutput);
      setDna(aiDna);
      
      if (voice) {
        setAudioData(`data:audio/mp3;base64,${voice}`);
      }
      
      setUserStats(prev => ({
        ...prev,
        daily_usage: prev.daily_usage + 1,
        monthly_usage: prev.monthly_usage + 1,
        total_usage: prev.total_usage + 1
      }));
      
      await loadHistory();
      
      showNotification(`✨ Generated in ${generation_time.toFixed(2)}s!`, 'success');
      
    } catch (error: any) {
      console.error('Generation failed:', error);
      
      if (error.code === 'ECONNABORTED') {
        setError('Request timeout. The AI model is taking too long to respond.');
      } else if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else {
        setError('Failed to generate. Make sure the backend server is running.');
      }
    }
    
    setLoading(false);
  };

  const generateVoice = async (): Promise<void> => {
    if (!output) {
      setError('No text to convert to voice');
      return;
    }

    setLoading(true);
    try {
      const response: AxiosResponse<{ mp3: string }> = await axios.post(`${API_BASE_URL}/voice`, {
        user_id: userId,
        text: output,
        lang: 'pt-BR'
      });
      
      setAudioData(`data:audio/mp3;base64,${response.data.mp3}`);
      
      showNotification('🔊 Voice generated successfully!', 'success');
      
    } catch (error: any) {
      console.error('Voice generation failed:', error);
      setError('Voice generation failed: ' + (error.response?.data?.error || error.message));
    }
    setLoading(false);
  };

  const remixDna = (): void => {
    if (dnaA.length !== 64 || dnaB.length !== 64) {
      setError('Both DNA sequences must be exactly 64 characters long');
      return;
    }
    
    setError('');
    const cross = dnaA.slice(0, 32) + dnaB.slice(32);
    setRemix(cross);
    setPrompt(`Remixed DNA: ${cross}`);
    showNotification('🧬 DNA remixed successfully!', 'success');
  };

  const shareLink = (): void => {
    const params = new URLSearchParams({ 
      dna, 
      prompt: prompt.slice(0, 100), 
      temp: String(temp), 
      topP: String(topP) 
    });
    navigator.clipboard.writeText(`${window.location.origin}?${params}`);
    showNotification('🔗 Share link copied to clipboard!', 'success');
  };

  // === NEW FEATURE FUNCTIONS ===
  const addToFavorites = (): void => {
    if (!prompt || !output) return;
    
    const favorite: FavoriteEntry = {
      id: Date.now(),
      prompt: prompt.slice(0, 100),
      output: output.slice(0, 200),
      timestamp: new Date().toLocaleString(),
      dna
    };
    
    const newFavorites = [favorite, ...favoritePrompts.slice(0, 49)]; // Keep only 50
    setFavoritePrompts(newFavorites);
    saveFavorites(newFavorites);
    
    showNotification('⭐ Added to favorites!', 'success');
  };

  const shareToCommunity = async (): Promise<void> => {
    if (!prompt || !output) {
      setError('No content to share');
      return;
    }

    const title = prompt.slice(0, 50) + '...';
    const description = `Community prompt with ${model} model`;
    const tags = [model.split(':')[0], persona.toLowerCase(), 'community'].join(',');

    try {
      await axios.post(`${API_BASE_URL}/share/prompt`, {
        user_id: userId,
        title,
        prompt,
        description,
        tags
      });
      
      showNotification('🌍 Shared to community!', 'success');
      await loadCommunityPrompts();
      
    } catch (error: any) {
      setError('Failed to share: ' + error.message);
    }
  };

  const handleBatchGenerate = async (prompts: string[]): Promise<void> => {
    setLoading(true);
    const results: BatchResult[] = [];
    
    for (const batchPrompt of prompts) {
      try {
        const response: AxiosResponse<TripResponse> = await axios.post(`${API_BASE_URL}/trip`, {
          user_id: userId,
          prompt: batchPrompt,
          temp,
          top_p: topP,
          model,
          persona
        });
        
        results.push({
          prompt: batchPrompt,
          output: response.data.output,
          dna: response.data.dna
        });
      } catch (error: any) {
        results.push({
          prompt: batchPrompt,
          output: `Error: ${error.message}`,
          dna: null
        });
      }
    }
    
    setBatchResults(results);
    setShowBatchResults(true);
    setLoading(false);
    showNotification(`🚀 Batch generation completed! ${results.length} results ready.`, 'success');
  };

  const exportGeneration = (format: string): void => {
    if (!output) return;
    
    const data = {
      prompt,
      output,
      dna,
      parameters: { temp, topP, model, persona },
      timestamp: new Date().toISOString(),
      userStats,
      metadata: {
        project: "AI Hallucination Playground",
        version: "1.0.0",
        license: "MIT",
        repository: "https://github.com/ai-hallucination-playground/ai-hallucination-playground"
      }
    };
    
    let content: string, filename: string, mimeType: string;
    
    switch (format) {
      case 'json':
        content = JSON.stringify(data, null, 2);
        filename = `hallucination-${Date.now()}.json`;
        mimeType = 'application/json';
        break;
      case 'txt':
        content = `AI HALLUCINATION PLAYGROUND EXPORT\n${'='.repeat(50)}\n\nPrompt:\n${prompt}\n\nOutput:\n${output}\n\nDNA: ${dna}\n\nParameters:\n- Temperature: ${temp}\n- Top-p: ${topP}\n- Model: ${model}\n- Persona: ${persona}\n\nGenerated: ${new Date().toLocaleString()}\n\n---\nGenerated with AI Hallucination Playground\nFree & Open Source: https://github.com/ai-hallucination-playground/ai-hallucination-playground`;
        filename = `hallucination-${Date.now()}.txt`;
        mimeType = 'text/plain';
        break;
      case 'md':
        content = `# 🧠 AI Hallucination Playground Export\n\n> Generated with [AI Hallucination Playground](https://github.com/ai-hallucination-playground/ai-hallucination-playground) - Free & Open Source\n\n## Prompt\n${prompt}\n\n## Output\n${output}\n\n## Metadata\n- **DNA:** \`${dna}\`\n- **Temperature:** ${temp}\n- **Top-p:** ${topP}\n- **Model:** ${model}\n- **Persona:** ${persona}\n- **Generated:** ${new Date().toLocaleString()}\n\n---\n*Support the project: [GitHub Sponsors](https://github.com/sponsors/your-username) | [Open Collective](https://opencollective.com/ai-hallucination-playground)*`;
        filename = `hallucination-${Date.now()}.md`;
        mimeType = 'text/markdown';
        break;
      default:
        return;
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    
    showNotification(`📤 Exported as ${format.toUpperCase()}!`, 'success');
  };

  const handleAdvancedSettingsChange = (key: string, value: any): void => {
    setAdvancedSettings(prev => ({ ...prev, [key]: value }));
    
    // Apply settings to generation parameters
    if (key === 'creativity') {
      setTemp(value);
    }
  };

  const loadFromHistory = (entry: HistoryEntry): void => {
    setPrompt(entry.prompt);
    setOutput(entry.output);
    setDna(entry.dna);
    setTemp(entry.parameters.temp);
    setTopP(entry.parameters.top_p);
    setModel(entry.parameters.model);
    setPersona(entry.parameters.persona);
    setShowHistory(false);
    showNotification('📜 Loaded from history!', 'success');
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success'): void => {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.className = `fixed top-4 right-4 ${type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white p-3 rounded-lg z-50 shadow-lg`;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  };

  const t = dark ? themes.dark : themes.light;

  return (
    <div className={`min-h-screen transition-all duration-1000 ${t.bg} ${t.text} relative`}>
      <FloatingParticles theme={t} count={15} />
      
      {/* === HEADER === */}
      <header className="relative z-10 flex justify-between items-center p-6 border-b border-purple-500/20">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4"
        >
          <GlitchText className={`text-4xl font-bold ${t.accent}`}>
            🧠 AI Hallucination Playground
          </GlitchText>
          <OpenSourceBadge theme={t} />
        </motion.div>
        
        <div className="flex items-center gap-4">
          <motion.a
            href="https://github.com/ai-hallucination-playground/ai-hallucination-playground"
            target="_blank"
            rel="noopener noreferrer"
            className={`px-4 py-2 rounded-full ${t.sponsor} text-black font-bold`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ⭐ Star on GitHub
          </motion.a>
          
          <button
            className={`p-2 rounded-full ${t.card}`}
            onClick={() => setShowPromptLibrary(!showPromptLibrary)}
          >
            ✨
          </button>
          
          <button
            className={`p-2 rounded-full ${t.card}`}
            onClick={() => setShowHistory(!showHistory)}
          >
            📜
          </button>
          
          <button
            className={`p-2 rounded-full ${t.card}`}
            onClick={() => setDark(!dark)}
          >
            {dark ? '🌞' : '🌙'}
          </button>
        </div>
      </header>

      {/* === ERROR DISPLAY === */}
      {error && (
        <div className="relative z-10 max-w-7xl mx-auto p-6">
          <motion.div
            className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 flex justify-between items-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="text-red-400">❌ {error}</span>
            <button
              onClick={() => setError('')}
              className="text-red-400 hover:text-red-300"
            >
              ✕
            </button>
          </motion.div>
        </div>
      )}

      {/* === USAGE STATS === */}
      <div className="relative z-10 max-w-7xl mx-auto p-6">
        <motion.div
          className={`${t.card} p-4 rounded-xl`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="grid grid-cols-3 gap-4">
            <UsageMeter 
              used={userStats.daily_usage} 
              limit={userStats.daily_limit} 
              label="Daily Generations" 
              theme={t} 
            />
            <UsageMeter 
              used={userStats.monthly_usage} 
              limit={userStats.monthly_limit} 
              label="Monthly Total" 
              theme={t} 
            />
            <UsageMeter 
              used={userStats.total_usage} 
              limit={-1} 
              label="All Time" 
              theme={t} 
            />
          </div>
          <div className="mt-2 text-xs opacity-70">
            🌟 Open Source & Free Forever | 
            User ID: <span className="font-mono">{userId.slice(-8)}</span> | 
            All Features Unlocked
          </div>
        </motion.div>
      </div>

      {/* === PROMPT LIBRARY SIDEBAR === */}
      <AnimatePresence>
        {showPromptLibrary && (
          <motion.div
            className="fixed left-0 top-0 h-full w-80 bg-black/90 backdrop-blur-xl z-50 border-r border-purple-500/20"
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-xl font-bold ${t.accent}`}>✨ Prompt Library</h3>
                <button onClick={() => setShowPromptLibrary(false)}>❌</button>
              </div>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <h4 className={`font-semibold ${t.accentSolid}`}>⭐ Your Favorites</h4>
                {favoritePrompts.length > 0 ? favoritePrompts.map((fav) => (
                  <motion.div
                    key={fav.id}
                    className={`${t.card} p-3 rounded-lg cursor-pointer`}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => {
                      setPrompt(fav.prompt);
                      setShowPromptLibrary(false);
                    }}
                  >
                    <p className="text-sm opacity-70">{fav.timestamp}</p>
                    <p className="text-sm truncate">{fav.prompt}</p>
                  </motion.div>
                )) : (
                  <p className="text-sm opacity-50">No favorites yet</p>
                )}
                
                <h4 className={`font-semibold ${t.accentSolid} mt-6`}>🌍 Community</h4>
                {communityPrompts.slice(0, 3).map((prompt, i) => (
                  <motion.div
                    key={i}
                    className={`${t.card} p-3 rounded-lg cursor-pointer`}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => {
                      setPrompt(prompt.prompt);
                      setShowPromptLibrary(false);
                    }}
                  >
                    <p className="text-sm font-semibold">{prompt.title}</p>
                    <p className="text-xs truncate opacity-70">{prompt.prompt}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* === HISTORY SIDEBAR === */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            className="fixed right-0 top-0 h-full w-80 bg-black/90 backdrop-blur-xl z-50 border-l border-purple-500/20"
            initial={{ x: 320 }}
            animate={{ x: 0 }}
            exit={{ x: 320 }}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-xl font-bold ${t.accent}`}>🕐 History</h3>
                <button onClick={() => setShowHistory(false)}>❌</button>
              </div>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {history.length > 0 ? history.map((entry, index) => (
                  <motion.div
                    key={index}
                    className={`${t.card} p-4 rounded-lg cursor-pointer`}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => loadFromHistory(entry)}
                  >
                    <p className="text-sm opacity-70">{entry.timestamp}</p>
                    <p className="truncate">{entry.prompt}</p>
                    <p className="text-xs opacity-50">
                      {entry.model_used} • {entry.generation_time?.toFixed(2)}s
                    </p>
                  </motion.div>
                )) : (
                  <p className="text-center opacity-70">No history yet</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* === BATCH RESULTS MODAL === */}
      <AnimatePresence>
        {showBatchResults && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={`${t.card} max-w-4xl max-h-96 overflow-y-auto p-6 rounded-2xl`}
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className={`text-xl font-bold ${t.accent}`}>🚀 Batch Results</h3>
                <button onClick={() => setShowBatchResults(false)}>❌</button>
              </div>
              
              <div className="space-y-4">
                {batchResults.map((result, i) => (
                  <div key={i} className={`${t.input} border p-4 rounded-lg`}>
                    <h4 className="font-semibold mb-2">Prompt {i + 1}:</h4>
                    <p className="text-sm opacity-70 mb-2">{result.prompt}</p>
                    <p className="text-sm">{result.output}</p>
                    {result.dna && (
                      <p className="text-xs opacity-50 mt-2">DNA: {result.dna.slice(0, 20)}...</p>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative z-10 max-w-7xl mx-auto p-6 grid lg:grid-cols-2 gap-8">
        {/* === LEFT COLUMN === */}
        <div className="space-y-8">
          {/* === CONTROLS === */}
          <motion.section
            className={`${t.card} p-8 rounded-2xl space-y-6`}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className={`text-2xl font-bold ${t.accent}`}>🎮 Control Panel</h2>
            
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className={`font-semibold ${t.accentSolid}`}>
                  🎯 Prompt
                </label>
                <VoiceRecorder 
                  theme={t} 
                  onTranscript={(text) => setPrompt(text)}
                />
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className={`w-full p-4 rounded-xl ${t.input} border transition-all duration-300 focus:outline-none focus:ring-2`}
                rows={4}
                placeholder="Describe your wildest AI hallucination..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block mb-3 font-semibold ${t.accentSolid}`}>
                  🌡️ Temperature: {temp}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temp}
                  onChange={(e) => setTemp(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs mt-1 opacity-70">
                  <span>Conservative</span>
                  <span>Chaotic</span>
                </div>
              </div>

              <div>
                <label className={`block mb-3 font-semibold ${t.accentSolid}`}>
                  🎲 Top-p: {topP}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={topP}
                  onChange={(e) => setTopP(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs mt-1 opacity-70">
                  <span>Focused</span>
                  <span>Diverse</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block mb-3 font-semibold ${t.accentSolid}`}>
                  🤖 Model
                </label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className={`w-full p-3 rounded-xl ${t.input} border`}
                >
                  {userStats.available_models.map(modelName => (
                    <option key={modelName} value={modelName}>
                      {modelName === 'dolphin-phi:latest' ? 'Dolphin Phi' :
                       modelName === 'llama2:latest' ? 'Llama 2' :
                       modelName === 'mistral:latest' ? 'Mistral' :
                       modelName === 'gpt-4' ? 'GPT-4' : modelName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block mb-3 font-semibold ${t.accentSolid}`}>
                  🎭 Persona
                </label>
                <select
                  value={persona}
                  onChange={(e) => setPersona(e.target.value)}
                  className={`w-full p-3 rounded-xl ${t.input} border`}
                >
                  <option value="Cyber-shaman">Cyber Shaman</option>
                  <option value="Digital-poet">Digital Poet</option>
                  <option value="AI-philosopher">AI Philosopher</option>
                  <option value="Quantum-dreamer">Quantum Dreamer</option>
                  <option value="Neural-architect">Neural Architect</option>
                  <option value="Code-whisperer">Code Whisperer</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={voiceEnabled}
                  onChange={(e) => setVoiceEnabled(e.target.checked)}
                  className="rounded"
                />
                <span>🔊 Voice Output (FREE!)</span>
              </label>
            </div>

            <motion.button
              className={`w-full py-4 rounded-xl font-bold text-white transition-all duration-300 ${
                loading ? 'bg-gray-600/50 cursor-not-allowed' : t.button
              }`}
              onClick={hallucinate}
              disabled={loading}
              whileHover={!loading ? { scale: 1.02 } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.div
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  Hallucinating...
                </span>
              ) : (
                '🚀 Generate Hallucination (FREE!)'
              )}
            </motion.button>
          </motion.section>

          {/* === PROMPT SUGGESTIONS === */}
          <PromptSuggestions theme={t} onSelectPrompt={setPrompt} />

          {/* === ADVANCED SETTINGS === */}
          <AdvancedSettings 
            theme={t} 
            settings={advancedSettings}
            onSettingsChange={handleAdvancedSettingsChange}
          />
        </div>

        {/* === RIGHT COLUMN === */}
        <div className="space-y-8">
          {/* === OUTPUT === */}
          <motion.section
            className={`${t.card} p-8 rounded-2xl`}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className={`text-2xl font-bold mb-6 ${t.accent}`}>✨ Hallucination Output</h2>
            
            <NeuralNetwork isActive={loading} theme={t} />
            
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-8"
                >
                  <motion.div
                    className="text-6xl mb-4"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    🌀
                  </motion.div>
                  <p className={`${t.accentSolid} text-lg`}>AI is dreaming...</p>
                </motion.div>
              ) : output ? (
                <motion.div
                  key="output"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className={`p-4 rounded-xl ${t.input} border`}>
                    <p className="whitespace-pre-wrap text-lg leading-relaxed">{output}</p>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2 flex-wrap">
                    <motion.button
                      onClick={addToFavorites}
                      className={`px-3 py-2 rounded-lg ${t.button} text-white text-sm`}
                      whileHover={{ scale: 1.05 }}
                    >
                      ⭐ Favorite
                    </motion.button>
                    
                    <motion.button
                      onClick={shareToCommunity}
                      className={`px-3 py-2 rounded-lg ${t.button} text-white text-sm`}
                      whileHover={{ scale: 1.05 }}
                    >
                      🌍 Share
                    </motion.button>
                    
                    {!audioData && (
                      <motion.button
                        onClick={generateVoice}
                        className={`px-3 py-2 rounded-lg ${t.button} text-white text-sm`}
                        whileHover={{ scale: 1.05 }}
                      >
                        🔊 Generate Voice
                      </motion.button>
                    )}
                  </div>
                  
                  {dna && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className={`text-lg font-semibold mb-3 ${t.accentSolid}`}>🧬 DNA Code</h3>
                        <div className="bg-black/20 p-3 rounded-lg flex justify-center">
                          <QRCodeCanvas 
                            value={dna} 
                            size={120} 
                            bgColor="transparent"
                            fgColor={dark ? "#06b6d4" : "#4f46e5"}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <h3 className={`text-lg font-semibold ${t.accentSolid}`}>🔗 Actions</h3>
                        <motion.button
                          onClick={shareLink}
                          className={`w-full py-2 px-4 rounded-lg ${t.button} text-white font-semibold`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Share Link
                        </motion.button>
                        
                        {audioData && (
                          <audio controls className="w-full">
                            <source src={audioData} type="audio/mpeg" />
                          </audio>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <div className="text-6xl mb-4">🧠</div>
                  <p className={`${t.accentSolid} text-lg`}>Ready to hallucinate?</p>
                  <p className="text-sm opacity-70 mt-2">
                    All features unlocked! No limits, completely free.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>

          {/* === EXPORT PANEL === */}
          <ExportPanel 
            theme={t} 
            onExport={exportGeneration}
            hasContent={!!output}
          />

          {/* === BATCH GENERATOR === */}
          <BatchGenerator 
            theme={t} 
            onBatchGenerate={handleBatchGenerate}
          />
        </div>

        {/* === FULL WIDTH SECTIONS === */}
        <div className="lg:col-span-2 space-y-8">
          {/* === DNA REMIX === */}
          <motion.section
            className={`${t.card} p-8 rounded-2xl`}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex items-center gap-2 mb-6">
              <h2 className={`text-2xl font-bold ${t.accent}`}>🧬 DNA Remix Lab</h2>
              <OpenSourceBadge theme={t} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                placeholder="DNA A (64 characters)"
                maxLength={64}
                value={dnaA}
                onChange={(e) => setDnaA(e.target.value)}
                className={`p-3 rounded-xl ${t.input} border font-mono text-sm`}
              />
              
              <input
                placeholder="DNA B (64 characters)"
                maxLength={64}
                value={dnaB}
                onChange={(e) => setDnaB(e.target.value)}
                className={`p-3 rounded-xl ${t.input} border font-mono text-sm`}
              />
              
              <motion.button
                onClick={remixDna}
                className={`py-3 rounded-xl font-bold text-white ${t.button}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                🔬 Remix DNA (FREE!)
              </motion.button>
            </div>
            
            {remix && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-4 p-3 ${t.input} rounded-lg border`}
              >
                <p className="text-sm mb-2">🧬 Remixed DNA:</p>
                <p className={`text-xs break-all font-mono ${t.accentSolid}`}>{remix}</p>
              </motion.div>
            )}
            
            {dna && (
              <div className="mt-4 p-3 bg-purple-500/10 rounded-lg">
                <p className="text-sm mb-2">🧬 Current Generation DNA:</p>
                <p className={`text-xs break-all font-mono ${t.accentSolid} mb-2`}>{dna}</p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setDnaA(dna)}
                    className={`px-3 py-1 rounded text-xs ${t.button} text-white`}
                  >
                    Use as DNA A
                  </button>
                  <button 
                    onClick={() => setDnaB(dna)}
                    className={`px-3 py-1 rounded text-xs ${t.button} text-white`}
                  >
                    Use as DNA B
                  </button>
                </div>
              </div>
            )}
          </motion.section>

          {/* === COMMUNITY AND SPONSORSHIP === */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* === COMMUNITY PANEL === */}
            <CommunityPanel 
              theme={t} 
              prompts={communityPrompts}
              onSelectPrompt={setPrompt}
            />

            {/* === SPONSORSHIP PANEL === */}
            <SponsorshipPanel theme={t} sponsors={sponsors} />
          </div>

          {/* === CONTRIBUTE AND NEURAL WAVES === */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* === CONTRIBUTE PANEL === */}
            <ContributePanel theme={t} />

            {/* === NEURAL WAVES === */}
            <motion.section
              className={`${t.card} p-8 rounded-2xl`}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <h2 className={`text-2xl font-bold mb-6 ${t.accent}`}>🌊 Neural Waves</h2>
              
              <div className="flex justify-center items-end space-x-1 h-32 mb-6">
                {Array.from({ length: 50 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-2 rounded-full bg-gradient-to-t from-cyan-500 to-purple-500"
                    animate={{
                      height: loading ? [8, Math.random() * 80 + 20, 8] : [8, 16, 8],
                      opacity: loading ? [0.3, 1, 0.3] : [0.3, 0.6, 0.3],
                    }}
                    transition={{
                      duration: loading ? 1 + Math.random() : 2,
                      repeat: Infinity,
                      delay: i * 0.02,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </div>
              
              <div className="text-center">
                <motion.p
                  className={`${t.accentSolid} text-sm`}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {loading ? 'Neural activity detected' : 'Waiting for neural activity...'}
                </motion.p>
              </div>
            </motion.section>
          </div>

          {/* === REAL-TIME STATUS === */}
          <motion.section
            className={`${t.card} p-8 rounded-2xl`}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
          >
            <h2 className={`text-2xl font-bold mb-6 ${t.accent}`}>📊 System Status</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className={`${t.input} border p-4 rounded-xl text-center`}>
                <div className="text-2xl mb-2">🔧</div>
                <h3 className="font-semibold mb-2">Backend</h3>
                <div className={`text-sm ${error.includes('backend') ? 'text-red-400' : 'text-green-400'}`}>
                  {error.includes('backend') ? 'Offline' : 'Online'}
                </div>
              </div>
              
              <div className={`${t.input} border p-4 rounded-xl text-center`}>
                <div className="text-2xl mb-2">🤖</div>
                <h3 className="font-semibold mb-2">Ollama</h3>
                <div className={`text-sm ${error.includes('Ollama') || error.includes('connect') ? 'text-red-400' : 'text-green-400'}`}>
                  {error.includes('Ollama') || error.includes('connect') ? 'Offline' : 'Ready'}
                </div>
              </div>
              
              <div className={`${t.input} border p-4 rounded-xl text-center`}>
                <div className="text-2xl mb-2">🌟</div>
                <h3 className="font-semibold mb-2">Features</h3>
                <div className={`text-sm text-green-400`}>
                  All Unlocked
                </div>
              </div>
              
              <div className={`${t.input} border p-4 rounded-xl text-center`}>
                <div className="text-2xl mb-2">📈</div>
                <h3 className="font-semibold mb-2">Generations</h3>
                <div className={`text-sm ${t.accentSolid}`}>
                  {userStats.total_usage} total
                </div>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-sm opacity-70">
                Backend: <code className="bg-black/20 px-2 py-1 rounded">http://localhost:5000</code> | 
                Ollama: <code className="bg-black/20 px-2 py-1 rounded">http://localhost:11434</code>
              </p>
            </div>
          </motion.section>

          {/* === OPEN SOURCE PROMOTION === */}
          <motion.section
            className={`${t.sponsor} text-black p-8 rounded-2xl text-center`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2 }}
          >
            <h2 className="text-3xl font-bold mb-4">🌟 Free & Open Source Forever</h2>
            <p className="text-lg mb-6 opacity-90">
              All features unlocked • No paywalls • Community-driven • Transparent development
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-black/10 p-4 rounded-xl">
                <h3 className="font-bold text-lg">💖 Support Us</h3>
                <p className="text-sm">Star our GitHub repo</p>
                <p className="text-sm">Spread the word</p>
                <p className="text-sm">Sponsor development</p>
              </div>
              <div className="bg-black/20 p-4 rounded-xl border-2 border-black/30">
                <h3 className="font-bold text-lg">🤝 Contribute</h3>
                <p className="text-sm">Code contributions</p>
                <p className="text-sm">Bug reports</p>
                <p className="text-sm">Feature ideas</p>
              </div>
              <div className="bg-black/10 p-4 rounded-xl">
                <h3 className="font-bold text-lg">🌍 Community</h3>
                <p className="text-sm">Join Discord</p>
                <p className="text-sm">Share creations</p>
                <p className="text-sm">Help others</p>
              </div>
            </div>
            
            <div className="flex justify-center gap-4 flex-wrap">
              <motion.a
                href="https://github.com/ai-hallucination-playground/ai-hallucination-playground"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-black text-white px-6 py-3 rounded-full font-bold"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                ⭐ Star on GitHub
              </motion.a>
              <motion.a
                href="https://github.com/sponsors/your-username"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-pink-600 text-white px-6 py-3 rounded-full font-bold"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                💖 Sponsor Project
              </motion.a>
              <motion.a
                href="https://discord.gg/ai-hallucination-playground"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-indigo-600 text-white px-6 py-3 rounded-full font-bold"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                💬 Join Discord
              </motion.a>
            </div>
          </motion.section>
        </div>
      </main>

      {/* === FOOTER === */}
      <footer className="relative z-10 border-t border-purple-500/20 p-6 text-center">
        <div className="max-w-4xl mx-auto">
          <p className={`${t.accentSolid} mb-4`}>
            Made with ❤️ by the open-source community
          </p>
          <div className="flex justify-center gap-6 text-sm flex-wrap">
            <a href="https://github.com/ai-hallucination-playground/ai-hallucination-playground" target="_blank" rel="noopener noreferrer" className="hover:underline">📚 Documentation</a>
            <a href="https://discord.gg/ai-hallucination-playground" target="_blank" rel="noopener noreferrer" className="hover:underline">💬 Community</a>
            <a href="https://github.com/ai-hallucination-playground/ai-hallucination-playground/issues" target="_blank" rel="noopener noreferrer" className="hover:underline">🐛 Report Issues</a>
            <a href="https://github.com/ai-hallucination-playground/ai-hallucination-playground" target="_blank" rel="noopener noreferrer" className="hover:underline">🔗 GitHub</a>
          </div>
          <p className="text-xs opacity-50 mt-4">
            User ID: {userId} | Session: {new Date().toLocaleTimeString()} | 
            Generations: {userStats.total_usage} total | MIT License
          </p>
          <p className="text-xs opacity-50 mt-2">
            🌟 Free Forever • 🤝 Open Source • 🚀 Community Driven
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;  