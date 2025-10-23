import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import Spinner from './common/Spinner';

// --- Audio Helper Functions ---

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

// --- Component ---

type Status = 'idle' | 'connecting' | 'listening' | 'error';
interface TranscriptEntry {
  sender: 'user' | 'ai';
  text: string;
}

const VoiceChatPractice: React.FC = () => {
  const [status, setStatus] = useState<Status>('idle');
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioResourcesRef = useRef<{ 
    source?: MediaStreamAudioSourceNode, 
    processor?: ScriptProcessorNode,
    outputSources?: Set<AudioBufferSourceNode> 
  }>({});
  
  const currentInputTranscriptionRef = useRef('');
  const currentOutputTranscriptionRef = useRef('');
  const nextStartTimeRef = useRef(0);

  const stopSession = useCallback(async () => {
    if (sessionPromiseRef.current) {
        try {
            const session = await sessionPromiseRef.current;
            session.close();
        } catch (e) {
            console.error("Error closing session:", e);
        } finally {
            sessionPromiseRef.current = null;
        }
    }
    
    mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    mediaStreamRef.current = null;
    
    audioResourcesRef.current.source?.disconnect();
    audioResourcesRef.current.processor?.disconnect();
    
    // FIX: Check if AudioContext is already closed before attempting to close it again.
    if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
        inputAudioContextRef.current.close();
    }
    if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
        outputAudioContextRef.current.close();
    }
    
    setStatus('idle');
  }, []);
  
  const startSession = async () => {
    setStatus('connecting');
    setTranscript([]);
    
    try {
        mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        const ai = new GoogleGenAI({apiKey: process.env.API_KEY!});
        inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        audioResourcesRef.current.outputSources = new Set();
        nextStartTimeRef.current = 0;

        sessionPromiseRef.current = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                systemInstruction: "You are Lexi, a friendly and patient AI English tutor. Your goal is to help the user practice their English conversation skills. Keep your responses concise and natural.",
                inputAudioTranscription: {},
                outputAudioTranscription: {},
            },
            callbacks: {
                onopen: () => {
                    setStatus('listening');
                    if (!inputAudioContextRef.current || !mediaStreamRef.current) return;

                    const source = inputAudioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
                    const processor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                    
                    processor.onaudioprocess = (e) => {
                        const inputData = e.inputBuffer.getChannelData(0);
                        const pcmBlob = createBlob(inputData);
                        sessionPromiseRef.current?.then((session) => {
                            session.sendRealtimeInput({ media: pcmBlob });
                        });
                    };

                    source.connect(processor);
                    processor.connect(inputAudioContextRef.current.destination);
                    audioResourcesRef.current = { ...audioResourcesRef.current, source, processor };
                },
                onmessage: async (message: LiveServerMessage) => {
                    // Handle Transcription
                    if (message.serverContent?.inputTranscription) {
                        currentInputTranscriptionRef.current += message.serverContent.inputTranscription.text;
                    }
                    if (message.serverContent?.outputTranscription) {
                        currentOutputTranscriptionRef.current += message.serverContent.outputTranscription.text;
                    }
                    if (message.serverContent?.turnComplete) {
                        const userInput = currentInputTranscriptionRef.current.trim();
                        const aiOutput = currentOutputTranscriptionRef.current.trim();
                        const newEntries: TranscriptEntry[] = [];
                        if (userInput) {
                          newEntries.push({ sender: 'user', text: userInput });
                        }
                        if (aiOutput) {
                          newEntries.push({ sender: 'ai', text: aiOutput });
                        }
                        if (newEntries.length > 0) {
                            setTranscript(prev => [...prev, ...newEntries]);
                        }
                        currentInputTranscriptionRef.current = '';
                        currentOutputTranscriptionRef.current = '';
                    }

                    // Handle Audio
                    const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                    if (audioData) {
                        const outputContext = outputAudioContextRef.current!;
                        nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputContext.currentTime);
                        
                        const audioBuffer = await decodeAudioData(decode(audioData), outputContext, 24000, 1);
                        const source = outputContext.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(outputContext.destination);
                        
                        source.addEventListener('ended', () => {
                            audioResourcesRef.current.outputSources?.delete(source);
                        });
                        
                        source.start(nextStartTimeRef.current);
                        nextStartTimeRef.current += audioBuffer.duration;
                        audioResourcesRef.current.outputSources?.add(source);
                    }
                },
                onerror: (e: ErrorEvent) => {
                    console.error('Session error:', e);
                    setStatus('error');
                    stopSession();
                },
                onclose: () => {
                    // onclose can be called after an error or manual stop.
                    // The stopSession function is idempotent, so it's safe to call here.
                    stopSession();
                }
            }
        });

    } catch (error) {
        console.error('Failed to start session:', error);
        setStatus('error');
    }
  };

  useEffect(() => {
    // Cleanup on component unmount
    return () => {
        stopSession();
    };
  }, [stopSession]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);


  const statusInfo = {
    idle: { text: "Start conversation with Lexi", icon: <MicIcon/>, color: 'bg-teal-600 hover:bg-teal-700' },
    connecting: { text: "Connecting...", icon: <Spinner/>, color: 'bg-yellow-500' },
    listening: { text: "Listening... Stop when you're done", icon: <MicIcon className="animate-pulse"/>, color: 'bg-red-600 hover:bg-red-700' },
    error: { text: "Error. Click to retry.", icon: <AlertIcon/>, color: 'bg-red-600 hover:bg-red-700' },
  };

  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-xl shadow-lg p-4 md:p-6 flex flex-col h-[75vh]">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 border-b border-slate-200 dark:border-slate-700 pb-4">Practice Voice Chat with Lexi</h2>
        
        <div className="flex-1 overflow-y-auto pr-4 space-y-4 mb-4">
            {transcript.length === 0 && status !== 'listening' && (
                <div className="flex items-center justify-center h-full">
                    <p className="text-slate-500 dark:text-slate-400">Your conversation will appear here.</p>
                </div>
            )}
            {transcript.map((msg, index) => (
                <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl ${msg.sender === 'user' ? 'bg-teal-600 text-white rounded-br-none' : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none'}`}>
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                    </div>
                </div>
            ))}
            <div ref={messagesEndRef} />
        </div>

        <div className="flex flex-col items-center justify-center pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
                onClick={status === 'listening' ? stopSession : startSession}
                disabled={status === 'connecting'}
                className={`flex items-center justify-center gap-3 w-full max-w-xs text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:cursor-not-allowed ${statusInfo[status].color}`}
            >
                {statusInfo[status].icon}
                {statusInfo[status].text}
            </button>
        </div>
    </div>
  );
};

const MicIcon = ({className = ''}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-5 h-5 ${className}`}>
      <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" />
      <path d="M5.5 8.5a.5.5 0 01.5.5v1a4 4 0 004 4h.5a.5.5 0 010 1h-.5a5 5 0 01-5-5v-1a.5.5 0 01.5-.5z" />
      <path d="M12.5 8.5a.5.5 0 01.5.5v1a4 4 0 004 4h.5a.5.5 0 010 1h-.5a5 5 0 01-5-5v-1a.5.5 0 01.5-.5z" />
    </svg>
);

const AlertIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
);

export default VoiceChatPractice;