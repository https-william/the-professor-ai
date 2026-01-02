
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, ChatState } from '../types';
import { generateChatResponse } from '../services/geminiService';
import { CameraScanner } from './CameraScanner';
import DOMPurify from 'dompurify';

interface ChatViewProps {
  chatState: ChatState;
  onUpdate: (state: ChatState) => void;
  onExit: () => void;
}

declare global {
  interface Window {
    marked: any;
  }
}

export const ChatView: React.FC<ChatViewProps> = ({ chatState, onUpdate, onExit }) => {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (chatState.messages.length === 0) {
      const initMsg: ChatMessage = {
          id: 'init',
          role: 'model',
          content: `I have analyzed ${chatState.fileName || 'your document'}. I am ready to answer any questions, verify your understanding, or debate the concepts within. What is on your mind?`,
          timestamp: Date.now()
      };
      onUpdate({ ...chatState, messages: [initMsg] });
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatState.messages, isTyping]);

  const handleSend = async (textOverride?: string, imageBase64?: string) => {
    const textToSend = textOverride || input;
    if ((!textToSend.trim() && !imageBase64) || isTyping) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: Date.now(),
      image: imageBase64
    };

    const newMessages = [...chatState.messages, userMsg];
    onUpdate({ ...chatState, messages: newMessages });
    
    setInput('');
    setIsTyping(true);

    try {
      let contextWithImage = chatState.fileContext;
      if (imageBase64) {
          contextWithImage += `\n[IMAGE_DATA:${imageBase64}]`;
      }

      const responseText = await generateChatResponse(newMessages, contextWithImage, userMsg.content);
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: responseText,
        timestamp: Date.now()
      };
      onUpdate({ ...chatState, messages: [...newMessages, botMsg] });
    } catch (error) {
      console.error("Chat Error", error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: "My connection to the archives was interrupted. Please try again.",
        timestamp: Date.now()
      };
      onUpdate({ ...chatState, messages: [...newMessages, errorMsg] });
    } finally {
      setIsTyping(false);
    }
  };

  const handleToggleSave = (msgId: string) => {
      const newMessages = chatState.messages.map(msg => 
          msg.id === msgId ? { ...msg, isSaved: !msg.isSaved } : msg
      );
      onUpdate({ ...chatState, messages: newMessages });
  };

  const handleCameraCapture = (base64: string) => {
      setShowCamera(false);
      handleSend("Analyze this visual data.", base64);
  };

  const handleVoiceInput = () => {
      if (!('webkitSpeechRecognition' in window)) {
          alert("Voice input is not supported in this browser.");
          return;
      }

      if (isListening) {
          recognitionRef.current?.stop();
          setIsListening(false);
          return;
      }

      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interim