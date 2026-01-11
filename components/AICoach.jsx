'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, Bot, User, Zap } from 'lucide-react';
import { useApp } from './AppContext';
import { auth, db } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

const defaultPrompt = `Hi! 👋 I'm your Kickstart AI Coach. I can see you're working on "CONTENT".

Suggested question: "PROMPT"`;

export default function AICoach() {
    const { aiCoachOpen, setAiCoachOpen, getCurrentStep, getContextData } = useApp();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const step = getCurrentStep();
    const contextData = getContextData([
        'surveySentence',
        'courseName',
        'bigPromise',
        'interviewFindings',
        'contentPlan',
    ]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Load History & Focus Input
    useEffect(() => {
        if (aiCoachOpen) {
            loadHistory();
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [aiCoachOpen]);

    const loadHistory = async () => {
        try {
            const user = auth.currentUser;
            if (!user) return;

            const q = query(
                collection(db, 'users', user.uid, 'chat_history'),
                orderBy('createdAt', 'asc'),
                limit(50)
            );

            const snapshot = await getDocs(q);
            const historyData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            if (historyData.length > 0) {
                setMessages(historyData);
            } else {
                setMessages([{
                    id: 'welcome',
                    role: 'assistant',
                    content: defaultPrompt
                        .replace('CONTENT', step?.title || 'your program')
                        .replace('PROMPT', step?.aiPrompt || 'How can I help?')
                }]);
            }
        } catch (error) {
            console.error('History load error:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const user = auth.currentUser;
        if (!user) {
            alert('Please login first');
            return;
        }

        const originalInput = input;

        // Optimistic UI update
        const tempId = Date.now();
        const userMessage = {
            id: tempId,
            role: 'user',
            content: input.trim(),
        };

        // Create placeholder AI message
        const aiMessageId = Date.now() + 1;
        const aiPlaceholder = {
            id: aiMessageId,
            role: 'assistant',
            content: '',
        };

        setMessages((prev) => [...prev, userMessage, aiPlaceholder]);
        setInput('');
        setIsTyping(true);

        try {
            // 1. Save User Message to Firestore (Non-blocking)
            addDoc(collection(db, 'users', user.uid, 'chat_history'), {
                role: 'user',
                content: originalInput,
                createdAt: serverTimestamp()
            }).catch(err => console.error('Failed to save user msg', err));

            // 2. Call AI Endpoint (Streaming)
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: originalInput,
                    userId: user.uid,
                    context: {
                        ...contextData,
                        currentStep: step?.title
                    },
                })
            });

            if (!response.ok) throw new Error('Network response was not ok');

            // 3. Read Stream
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let aiContent = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                aiContent += chunk;

                // Update UI in real-time
                setMessages(prev => prev.map(msg =>
                    msg.id === aiMessageId
                        ? { ...msg, content: aiContent }
                        : msg
                ));
            }

            // 4. Save Final AI Message to Firestore
            await addDoc(collection(db, 'users', user.uid, 'chat_history'), {
                role: 'assistant',
                content: aiContent,
                createdAt: serverTimestamp()
            });

        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => prev.map(msg =>
                msg.id === aiMessageId
                    ? { ...msg, content: "I'm having trouble connecting to the network." }
                    : msg
            ));
        } finally {
            setIsTyping(false);
        }
    };

    const quickPrompts = [
        "Help me refine this",
        "Give me examples",
        "What's next?",
    ];

    return (
        <AnimatePresence>
            {aiCoachOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setAiCoachOpen(false)}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                    />

                    {/* Chat Panel */}
                    <motion.div
                        initial={{ opacity: 0, x: 400, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 400, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-4 right-4 bottom-4 w-[420px] bg-white dark:bg-zinc-900 shadow-2xl z-50 flex flex-col rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                        <Sparkles className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-zinc-900 dark:text-white">
                                            Kickstart AI Coach
                                        </h2>
                                        <p className="text-xs text-zinc-500 flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                            Online • Ready to help
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setAiCoachOpen(false)}
                                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                                >
                                    <X className="w-5 h-5 text-zinc-500" />
                                </button>
                            </div>
                        </div>

                        {/* Context Badge */}
                        {step && (
                            <div className="px-5 py-3 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-indigo-500" />
                                <p className="text-xs text-zinc-500">
                                    Context: <span className="font-medium text-zinc-900 dark:text-white">{step.title}</span>
                                </p>
                            </div>
                        )}

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                            {messages.map((message) => (
                                <motion.div
                                    key={message.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                                >
                                    <div
                                        className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${message.role === 'user'
                                            ? 'bg-zinc-100 dark:bg-zinc-800'
                                            : 'bg-gradient-to-br from-indigo-500 to-violet-500'
                                            }`}
                                    >
                                        {message.role === 'user' ? (
                                            <User className="w-4 h-4 text-zinc-500" />
                                        ) : (
                                            <Bot className="w-4 h-4 text-white" />
                                        )}
                                    </div>
                                    <div
                                        className={`flex-1 p-4 rounded-2xl text-sm leading-relaxed ${message.role === 'user'
                                            ? 'bg-indigo-600 text-white rounded-tr-md'
                                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-tl-md'
                                            }`}
                                    >
                                        <div className="whitespace-pre-wrap">{message.content}</div>
                                    </div>
                                </motion.div>
                            ))}

                            {/* Typing indicator */}
                            {isTyping && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex gap-3"
                                >
                                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center flex-shrink-0">
                                        <Bot className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-2xl rounded-tl-md">
                                        <div className="flex gap-1.5">
                                            <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick Prompts */}
                        <div className="px-5 pb-3 flex gap-2">
                            {quickPrompts.map((prompt) => (
                                <button
                                    key={prompt}
                                    onClick={() => setInput(prompt)}
                                    className="px-3 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-full transition-colors"
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>

                        {/* Input */}
                        <form
                            onSubmit={handleSubmit}
                            className="p-4 border-t border-zinc-100 dark:border-zinc-800"
                        >
                            <div className="flex gap-2">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask me anything..."
                                    className="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || isTyping}
                                    className="p-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-colors shadow-lg shadow-indigo-600/20 disabled:shadow-none"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
