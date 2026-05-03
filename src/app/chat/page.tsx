"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { chatMultimodal } from "@/lib/api";
import type { MultimodalChatResponse } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  image?: string; // base64 thumbnail for display
  timestamp: Date;
}

export default function ChatPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Map language to supported chat languages
  const getChatLanguage = (): "hi-IN" | "kn-IN" | "en-IN" => {
    if (language === "hi-IN") return "hi-IN";
    if (language === "kn-IN") return "kn-IN";
    return "en-IN";
  };

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(",")[1];
      setAttachedImage(base64);
    };
    reader.readAsDataURL(file);
  };

  // ── Drag & Drop ──
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageFile(file);
  }, []);

  const removeAttachment = () => setAttachedImage(null);

  // ── Send Message ──
  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed && !attachedImage) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      text: trimmed || "(Image attached)",
      image: attachedImage || undefined,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    const imageToSend = attachedImage;
    setAttachedImage(null);
    setIsLoading(true);

    setTimeout(scrollToBottom, 50);

    try {
      const result: MultimodalChatResponse = await chatMultimodal({
        image_base64: imageToSend || undefined,
        text: trimmed || "What can you tell me about this image?",
        response_mode: "CHAT",
        language: getChatLanguage(),
      });

      if (result.chat_text) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          text: result.chat_text,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }

      // If BREAKDOWN data came back, allow navigating to results
      if (result.recommendation) {
        sessionStorage.setItem("forge_analysis_result", JSON.stringify(result));
        const navMessage: ChatMessage = {
          id: (Date.now() + 2).toString(),
          role: "assistant",
          text: "📊 I've prepared a detailed material breakdown for you. [View Full Report]",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, navMessage]);
      }
    } catch (err) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: `⚠️ ${err instanceof Error ? err.message : "Something went wrong. Please try again."}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(scrollToBottom, 100);
    }
  };

  const handleBreakdownRequest = async () => {
    const trimmed = input.trim();
    if (!trimmed && !attachedImage) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      text: `🔬 ${trimmed || "Analyze this material"}`,
      image: attachedImage || undefined,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    const imageToSend = attachedImage;
    setAttachedImage(null);
    setIsLoading(true);

    setTimeout(scrollToBottom, 50);

    try {
      const result = await chatMultimodal({
        image_base64: imageToSend || undefined,
        text: trimmed || "Analyze this material",
        response_mode: "BREAKDOWN",
        language: getChatLanguage(),
      });

      if (result.recommendation) {
        sessionStorage.setItem("forge_analysis_result", JSON.stringify(result));
        router.push("/results");
      } else if (result.chat_text) {
        const msg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          text: result.chat_text,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, msg]);
      }
    } catch (err) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: `⚠️ ${err instanceof Error ? err.message : "Breakdown request failed."}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(scrollToBottom, 100);
    }
  };

  return (
    <div
      className="pt-16 flex flex-col h-screen w-full"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      <AnimatePresence>
        {isDragOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[var(--color-forge-accent)]/10 border-4 border-dashed border-[var(--color-forge-accent)] flex items-center justify-center pointer-events-none"
          >
            <div className="bg-[var(--color-surface-card)] rounded-[8px] px-8 py-6 shadow-xl flex items-center gap-3">
              <span className="material-symbols-outlined text-[var(--color-forge-accent)] text-3xl">add_photo_alternate</span>
              <span className="text-lg font-bold text-[var(--color-text-heading)]">Drop image here</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto w-full">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
          {messages.length === 0 ? (
            <div className="min-h-[60vh] flex flex-col justify-center text-center">
              <div className="mx-auto mb-4">
                <span className="material-symbols-outlined text-[64px] text-[var(--color-forge-red)]/30">
                  forum
                </span>
              </div>
              <h2 className="text-2xl font-bold text-[var(--color-text-heading)] mb-2">
                FORGE Chat
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] max-w-md mx-auto mb-8">
                Ask questions about materials, upload site photos for analysis, or check if your contractor is overcharging.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto">
                {[
                  { icon: "receipt_long", text: "Is my contractor overcharging for TMT bars?" },
                  { icon: "photo_camera", text: "Drop a site photo to identify materials" },
                  { icon: "engineering", text: "What's the best steel for coastal construction?" },
                ].map((example) => (
                  <button
                    key={example.text}
                    onClick={() => {
                      setInput(example.text);
                      textareaRef.current?.focus();
                    }}
                    className="bg-[var(--color-surface-card)] border border-[var(--color-border-light)] rounded-[8px] p-3 text-left hover:border-[var(--color-forge-red)]/30 hover:bg-[var(--color-surface-warm)] transition-all group"
                  >
                    <span className="material-symbols-outlined text-[var(--color-forge-red)] text-lg mb-2 block group-hover:scale-110 transition-transform">
                      {example.icon}
                    </span>
                    <span className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                      {example.text}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[70%] rounded-[12px] px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-[var(--color-forge-accent)] text-white rounded-br-[4px]"
                        : "bg-[var(--color-surface-card)] border border-[var(--color-border-light)] text-[var(--color-text-primary)] rounded-bl-[4px]"
                    }`}
                  >
                    {msg.image && (
                      <div className="mb-2 rounded-[8px] overflow-hidden">
                        <img
                          src={`data:image/jpeg;base64,${msg.image}`}
                          alt="Attached"
                          className="max-w-full max-h-48 object-cover rounded-[8px]"
                        />
                      </div>
                    )}
                    <p
                      className={`text-sm whitespace-pre-wrap leading-relaxed ${
                        msg.role === "assistant" && msg.text.includes("[View Full Report]")
                          ? "cursor-pointer"
                          : ""
                      }`}
                      onClick={() => {
                        if (msg.text.includes("[View Full Report]")) {
                          router.push("/results");
                        }
                      }}
                    >
                      {msg.text.includes("[View Full Report]") ? (
                        <>
                          {msg.text.replace("[View Full Report]", "")}
                          <span className="underline font-semibold text-[var(--color-forge-red)] hover:opacity-80">
                            View Full Report →
                          </span>
                        </>
                      ) : (
                        msg.text
                      )}
                    </p>
                    <span className={`text-[10px] mt-1 block ${
                      msg.role === "user" ? "text-white/60" : "text-[var(--color-text-muted)]"
                    }`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-[var(--color-surface-card)] border border-[var(--color-border-light)] rounded-[12px] rounded-bl-[4px] px-4 py-3 flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-[var(--color-text-muted)] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-[var(--color-text-muted)] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-[var(--color-text-muted)] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input bar */}
      <div className="border-t border-[var(--color-border-light)] bg-[var(--color-surface-card)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3">
          {/* Image preview */}
          <AnimatePresence>
            {attachedImage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-3"
              >
                <div className="relative inline-block">
                  <img
                    src={`data:image/jpeg;base64,${attachedImage}`}
                    alt="Attachment preview"
                    className="h-20 rounded-[8px] border border-[var(--color-border-light)]"
                  />
                  <button
                    onClick={removeAttachment}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-[var(--color-error)] text-white rounded-full flex items-center justify-center text-xs hover:scale-110 transition-transform"
                  >
                    ×
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-end gap-2">
            {/* Attachment buttons */}
            <div className="flex items-center gap-1 pb-1">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-9 h-9 flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-track)] rounded-full transition-all"
                title="Upload image"
              >
                <span className="material-symbols-outlined text-xl">add_photo_alternate</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageFile(file);
                  if (e.target) e.target.value = "";
                }}
              />
            </div>

            {/* Text input */}
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask about materials, costs, or drop a site photo..."
                rows={1}
                className="w-full px-4 py-2.5 bg-[var(--color-surface-subtle)] border border-[var(--color-border-light)] rounded-[20px] text-sm resize-none outline-none focus:border-[var(--color-forge-accent)] transition-colors placeholder:text-[var(--color-text-muted)]"
                style={{ maxHeight: "120px" }}
                id="chat-input"
              />
            </div>

            {/* Send buttons */}
            <div className="flex items-center gap-1 pb-1">
              {(input.trim() || attachedImage) && (
                <button
                  onClick={handleBreakdownRequest}
                  disabled={isLoading}
                  className="w-9 h-9 flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-forge-red)] hover:bg-[var(--color-surface-warm)] rounded-full transition-all disabled:opacity-50"
                  title="Get full material breakdown"
                >
                  <span className="material-symbols-outlined text-xl">science</span>
                </button>
              )}
              <button
                onClick={handleSend}
                disabled={isLoading || (!input.trim() && !attachedImage)}
                className="w-9 h-9 flex items-center justify-center bg-[var(--color-forge-accent)] text-white rounded-full hover:bg-[var(--color-forge-accent-hover)] transition-colors disabled:opacity-50"
                title="Send message"
                id="chat-send-btn"
              >
                <span className="material-symbols-outlined text-lg">arrow_upward</span>
              </button>
            </div>
          </div>

          <p className="text-[10px] text-[var(--color-text-muted)] text-center mt-2">
            Powered by Gemini multimodal reasoning • Price data grounded in FORGE database
          </p>
        </div>
      </div>
    </div>
  );
}
