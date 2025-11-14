"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  LoaderCircle,
  Sparkles,
  Zap,
  Brain,
  Network,
  BarChart3,
  MessageSquare,
  Users,
  FileAudio,
  Download,
  ChevronRight,
  Activity,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import UploadForm from "@/components/analysis/upload-form";
import ChunkedUploadForm from "@/components/analysis/chunked-upload-form";
import AnalysisDashboard from "@/components/analysis/analysis-dashboard";
import ExportResultsButton from "@/components/analysis/export-results-button";
import Logo from "@/components/logo";
import { useToast } from "@/hooks/use-toast";
import { formatTimestamp } from "@/lib/utils";
import Tilt from "react-parallax-tilt";
import type {
  AnalysisData,
  TranscriptEntry,
  ParticipationMetric,
  EmotionTimelinePoint,
  RelationshipGraphData,
  SpeakerIndexToDetection,
  UnansweredQuestion,
  Interruption,
  Topic,
  AnalysisMode,
} from "@/lib/types";
import { SPEAKER_CHARACTERISTICS } from "@/lib/speaker-characteristics";
import { ModeSelector, AnalysisModeBadge } from "@/components/mode-selector";

type AppState = "idle" | "loading" | "results";

// Enhanced Card Component with 3D Tilt
const Card3D = ({ 
  children, 
  className = "", 
  delay = 0 
}: { 
  children: React.ReactNode; 
  className?: string; 
  delay?: number;
}) => {
  const isUploadCard = className.includes("upload-form") || className.includes("p-8");
  const isAnalysisSectionsCard =
    className.includes("analysis-dashboard") || className.includes("p-8 backdrop-blur-2xl");

  if (isUploadCard && !isAnalysisSectionsCard) {
    return (
      <Tilt
        tiltMaxAngleX={10}
        tiltMaxAngleY={10}
        perspective={1000}
        glareEnable={true}
        glareMaxOpacity={0.3}
        glareColor="#6366f1"
        glarePosition="all"
        glareBorderRadius="12px"
      >
        <motion.div
          initial={{ opacity: 0, y: 50, rotateX: -15 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{
            duration: 0.8,
            delay,
            type: "spring",
            stiffness: 100,
          }}
          whileHover={{
            scale: 1.02,
            boxShadow: "0 20px 40px rgba(99, 102, 241, 0.3)",
          }}
          className={`rounded-xl border bg-white/90 dark:bg-gray-900/90 shadow-2xl ${className}`}
        >
          {children}
        </motion.div>
      </Tilt>
    );
  }

  if (isAnalysisSectionsCard) {
    return (
      <div className={`rounded-xl border bg-white/90 dark:bg-gray-900/90 shadow-2xl ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, rotateX: -15 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{
        duration: 0.8,
        delay,
        type: "spring",
        stiffness: 100,
      }}
      className={`rounded-xl border bg-white/90 dark:bg-gray-900/90 shadow-2xl ${className}`}
    >
      {children}
    </motion.div>
  );
};

// Animated Stats Counter
const AnimatedCounter = ({ 
  value, 
  suffix = "", 
  prefix = "" 
}: { 
  value: number | string; 
  suffix?: string; 
  prefix?: string;
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const numericValue = typeof value === 'number' ? value : parseInt(value.toString().replace(/\D/g, "")) || 0;

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = numericValue / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= numericValue) {
        setDisplayValue(numericValue);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [numericValue]);

  if (typeof value === 'string') {
    return <span className="font-bold text-2xl">{value}</span>;
  }

  return (
    <span className="font-bold text-2xl">
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
};

// Loading Animation Component
const LoadingAnimation = () => {
  return (
    <div className="relative w-64 h-64 mb-8">
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          animate={{
            rotate: 360,
            scale: [1, 1.2, 1],
          }}
          transition={{
            rotate: { duration: 2, repeat: Infinity, ease: "linear" },
            scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
          }}
          className="w-32 h-32 border-4 border-blue-400 border-t-transparent rounded-full"
        />
        <motion.div
          animate={{
            rotate: -360,
            scale: [1.2, 1, 1.2],
          }}
          transition={{
            rotate: { duration: 3, repeat: Infinity, ease: "linear" },
            scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute w-24 h-24 border-4 border-purple-400 border-b-transparent rounded-full"
        />
      </div>
    </div>
  );
};

// Network Visualization
const NetworkVisualization2D = () => {
  return (
    <div className="absolute inset-0 -z-10 flex items-center justify-center opacity-20">
      <motion.div
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 40,
          repeat: Infinity,
          ease: "linear"
        }}
        className="relative w-96 h-96"
      >
        {[0, 72, 144, 216, 288].map((rotation, i) => (
          <motion.div
            key={i}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: 2 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.2,
            }}
            className="absolute inset-0 flex items-center justify-center"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            <div className="w-4 h-4 bg-blue-400 rounded-full" />
            <div className="absolute w-32 h-32 border-2 border-blue-400/30 rounded-full" />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

// Main Analysis Logic
const generateDynamicAnalysis = async (
  diarizedResult: { speaker: number; text: string; startSec?: number; endSec?: number }[],
  detected: SpeakerIndexToDetection | undefined,
  mediaDurationSec?: number,
  mode: AnalysisMode = 'ai'
): Promise<AnalysisData> => {
  const uniqueSpeakers = [...new Set(diarizedResult.map((u) => u.speaker))];
  const numSpeakers = uniqueSpeakers.length;

  const positiveSet = new Set([
    "good", "great", "excellent", "agree", "yes", "ok", "thanks", "thank", "love", "like", "clear", "awesome", "nice", "happy", "support", "strong", "well", "congrats", "congratulations", "cheers", "success", "improve", "improved", "improving",
  ]);

  const negativeSet = new Set([
    "bad", "worse", "worst", "disagree", "no", "not", "confused", "issue", "problem", "hate", "angry", "sad", "conflict", "weak", "blocker", "delay", "fail", "failed", "failing", "bug", "risk", "concern", "concerns",
  ]);

  const scoreText = (text: string) => {
    const tokens = text.toLowerCase().match(/[a-z']+/g) || [];
    let score = 0;
    let weight = 0;
    for (const tok of tokens) {
      if (positiveSet.has(tok)) {
        score += 2;
        weight += 2;
      }
      if (negativeSet.has(tok)) {
        score -= 2;
        weight += 2;
      }
    }
    return weight > 0 ? Math.max(-1, Math.min(1, score / weight)) : 0;
  };

  const scores = diarizedResult.map((u) => scoreText(u.text));

  const labelFromScore = (s: number) => {
    if (s > 0.3) return "Positive";
    if (s < -0.3) return "Negative";
    return "Neutral";
  };

  const emotionFromScore = (s: number) => {
    if (s > 0.7) return "joy";
    if (s > 0.4) return "calm";
    if (s > 0.2) return "supportive";
    if (s < -0.7) return "anger";
    if (s < -0.4) return "sadness";
    if (s < -0.2) return "critical";
    return "neutral";
  };

  const speakerMap = new Map(
    uniqueSpeakers.map((speakerIndex, i) => [
      speakerIndex,
      {
        id: String.fromCharCode(65 + i),
        label: `Speaker ${String.fromCharCode(65 + i)}`,
        characteristic: {
          color: SPEAKER_CHARACTERISTICS[i % SPEAKER_CHARACTERISTICS.length].color,
          description: "",
        },
      },
    ])
  );

  const diarMaxEnd = Math.max(0, ...diarizedResult.map((u) => (typeof u.endSec === "number" ? Number(u.endSec) : 0)));
  const estDurations = diarizedResult.map((u) => Math.max(1, Math.floor((u.text?.length || 0) / 15) + 1));
  const estTotal = estDurations.reduce((a, b) => a + b, 0);
  const baseDuration = typeof mediaDurationSec === "number" && mediaDurationSec > 0 ? Math.ceil(mediaDurationSec) : diarMaxEnd > 0 ? Math.ceil(diarMaxEnd) : estTotal;

  const starts = diarizedResult.map((u) => (typeof u.startSec === "number" ? Math.max(0, Math.floor(u.startSec)) : undefined));
  const ends = diarizedResult.map((u) => (typeof u.endSec === "number" ? Math.max(0, Math.ceil(u.endSec)) : undefined));
  let validCount = 0;
  let monotonic = true;
  let lastStart = -1;
  for (let i = 0; i < diarizedResult.length; i++) {
    const s = starts[i], e = ends[i];
    if (typeof s === "number" && typeof e === "number" && s < e && e <= baseDuration) {
      validCount++;
      if (s < lastStart) monotonic = false;
      lastStart = s;
    }
  }
  const reliableDiar = validCount >= Math.floor(diarizedResult.length * 0.7) && monotonic;

  const startTimes: number[] = new Array(diarizedResult.length).fill(0);
  const durationsUsed: number[] = new Array(diarizedResult.length).fill(0);
  if (reliableDiar) {
    for (let i = 0; i < diarizedResult.length; i++) {
      let s = typeof starts[i] === "number" ? starts[i]! : i === 0 ? 0 : startTimes[i - 1] + 1;
      let e = typeof ends[i] === "number" ? ends[i]! : s + estDurations[i];
      s = Math.max(0, Math.min(s, baseDuration));
      e = Math.max(s + 1, Math.min(e, baseDuration));
      if (i > 0) s = Math.max(s, startTimes[i - 1]);
      startTimes[i] = s;
      durationsUsed[i] = Math.max(1, e - s);
    }
  } else {
    const scale = estTotal > 0 ? baseDuration / estTotal : 1;
    let t = 0;
    for (let i = 0; i < diarizedResult.length; i++) {
      startTimes[i] = Math.floor(t);
      const d = Math.max(1, Math.round(estDurations[i] * scale));
      durationsUsed[i] = d;
      t += d;
    }
    for (let i = diarizedResult.length - 1; i >= 0; i--) {
      if (startTimes[i] < baseDuration) break;
      startTimes[i] = Math.max(0, baseDuration - durationsUsed[i]);
    }
  }

  const transcript: TranscriptEntry[] = diarizedResult.map((utterance, index) => {
    const speakerInfo = speakerMap.get(utterance.speaker)!;
    return {
      id: index + 1,
      speaker: speakerInfo.id,
      label: speakerInfo.label,
      characteristic: speakerInfo.characteristic,
      text: utterance.text,
      sentiment: labelFromScore(scores[index]),
      emotion: emotionFromScore(scores[index]),
      timestamp: formatTimestamp(startTimes[index]),
    };
  });

  const transcriptBySpeaker = transcript.reduce(
    (acc, t) => {
      if (!acc[t.speaker]) acc[t.speaker] = [];
      acc[t.speaker].push(t);
      return acc;
    },
    {} as Record<string, TranscriptEntry[]>
  );

  const totalSpeakingTime = Array.from(speakerMap.values()).reduce((total, speaker) => {
    const utterances = transcriptBySpeaker[speaker.id] || [];
    const speakingTimeSec = utterances.reduce((acc, u) => acc + Math.max(1, Math.round(durationsUsed[u.id - 1] || 0)), 0);
    return total + speakingTimeSec;
  }, 0);

  const participation: ParticipationMetric[] = Array.from(speakerMap.values()).map((speaker) => {
    const utterances = transcriptBySpeaker[speaker.id] || [];
    const speakingTimeSec = utterances.reduce((acc, u) => acc + Math.max(1, Math.round(durationsUsed[u.id - 1] || 0)), 0);
    const speakingTime = Math.max(1, speakingTimeSec);
    const wordCount = utterances.reduce((acc, u) => acc + (u.text?.split(/\s+/).filter(w => w.length > 0).length || 0), 0);
    const avgScore =
      utterances.reduce(
        (acc, u) => acc + (u.sentiment === "Positive" ? 1 : u.sentiment === "Negative" ? -1 : 0),
        0
      ) / Math.max(1, utterances.length);
    const engagement = totalSpeakingTime > 0 ? (speakingTimeSec / totalSpeakingTime) * 100 : 0;
    
    return {
      speaker: speaker.id,
      label: speaker.label,
      characteristic: speaker.characteristic,
      speakingTime: speakingTime,
      wordCount,
      conflict: Math.max(0, Math.round((1 - Math.max(-1, Math.min(1, avgScore))) * 10)),
      sentiment: labelFromScore(avgScore),
      engagement,
    };
  });

  const totalDuration = baseDuration;
  let interval: number;
  if (totalDuration < 60) interval = 2;
  else if (totalDuration < 300) interval = 5;
  else interval = 10;
  const numPoints = Math.max(3, Math.floor(totalDuration / interval));
  const emotionTimeline: EmotionTimelinePoint[] = Array.from({ length: numPoints + 1 }, (_, i) => {
    const t = Math.floor((i / numPoints) * totalDuration);
    const point: EmotionTimelinePoint = { time: formatTimestamp(t) };
    Array.from(speakerMap.values()).forEach((s) => {
      const closestUtterance = transcript
        .filter((utt) => utt.speaker === s.id)
        .reduce((prev, curr) => (Math.abs(parseInt(curr.timestamp.replace(/:/g, "")) - t) < Math.abs(parseInt(prev.timestamp.replace(/:/g, "")) - t) ? curr : prev));
      point[s.id] = closestUtterance ? scores[closestUtterance.id - 1] : 0;
    });
    return point;
  });

  const sentimentCounts = {
    Positive: transcript.filter((t) => t.sentiment === "Positive").length,
    Negative: transcript.filter((t) => t.sentiment === "Negative").length,
    Neutral: transcript.filter((t) => t.sentiment === "Neutral").length,
  };
  const overallSentiment = Object.entries(sentimentCounts).sort((a, b) => b[1] - a[1])[0][0];

  // Use comprehensive analysis for full coverage
  let comprehensiveResults;
  try {
    const { generateComprehensiveAnalysis } = await import('@/lib/comprehensive-analysis');
    comprehensiveResults = await generateComprehensiveAnalysis(transcript, overallSentiment, mode);
  } catch (error) {
    console.error('Comprehensive analysis failed:', error);
    comprehensiveResults = {
      relationshipGraph: { nodes: [], links: [] },
      summaryReport: `This meeting involved ${Object.keys(transcriptBySpeaker).length} participant(s) discussing various topics. The overall sentiment was ${overallSentiment.toLowerCase()}.`,
      relationshipSummary: "Participants showed mostly neutral interactions with occasional positive and negative exchanges.",
      keyPoints: [],
      actionItems: [],
      decisions: [],
      keywords: [],
      topics: [],
      unansweredQuestions: [],
      interruptions: [],
    };
  }

  const relationshipGraph = comprehensiveResults.relationshipGraph;
  const summaryReport = comprehensiveResults.summaryReport;
  const relationshipSummary = comprehensiveResults.relationshipSummary;
  const keyPoints = comprehensiveResults.keyPoints;
  const actionItems = comprehensiveResults.actionItems;
  const decisions = comprehensiveResults.decisions;
  const keywords = comprehensiveResults.keywords;
  const topics = comprehensiveResults.topics;
  const unansweredQuestions = comprehensiveResults.unansweredQuestions;
  const interruptions = comprehensiveResults.interruptions;

  return {
    summary: {
      title: mode === 'free' ? "Dynamic Analysis Report (Free)" : "Dynamic Analysis Report (AI)",
      overallSentiment,
      points: keyPoints,
      relationshipSummary,
      summaryReport,
    },
    transcript,
    participation,
    emotionTimeline,
    relationshipGraph,
    actionItems,
    decisions,
    keywords,
    topics,
    unansweredQuestions,
    interruptions,
    groupCohesion: {
      agreementScore: 0,
      conflictScore: 0,
      cohesionSummary: "Analysis in progress"
    },
    speakerInfluenceGraph: {
      nodes: Array.from(speakerMap.values()).map(s => ({ id: s.id, label: s.label })),
      links: []
    }
  };
};

// Main Component
export default function Home() {
  const [appState, setAppState] = useState<AppState>("idle");
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>("ai");
  const [history, setHistory] = useState<Array<{ id: string; createdAt: string; fileName?: string; hidden?: boolean; mode?: string }>>([]);
  const [showHidden, setShowHidden] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/upload");
        if (res.ok) {
          const json = await res.json();
          setHistory(Array.isArray(json.items) ? json.items : []);
        }
      } catch {}
    })();
  }, []);

  const handleFileUpload = async (file: File) => {
    setAppState("loading");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        throw new Error(err.details || err.error || "Upload failed");
      }
      const uploadJson = await uploadRes.json();
      const diarizationResult = uploadJson.diarizationResult;
      const speakerCharacteristics = uploadJson.speakerCharacteristics;
      const durationSec = uploadJson.durationSec as number | undefined;
      if (!diarizationResult || !diarizationResult.utterances?.length) {
        throw new Error("Diarization failed or returned no utterances.");
      }
      const dynamicData = await generateDynamicAnalysis(diarizationResult.utterances, speakerCharacteristics, durationSec);
      setAnalysisData(dynamicData);
      try {
        const res = await fetch("/api/upload");
        if (res.ok) {
          const json = await res.json();
          setHistory(json.items || []);
        }
      } catch {}
      setAppState("results");
    } catch (error) {
      console.error("Analysis failed:", error);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
      });
      setAppState("idle");
    }
  };

  const handleChunkedUploadComplete = async (analysisId: string) => {
    // Note: appState is already "loading" from onUploadStart callback
    try {
      // Load the analysis from the saved file
      const res = await fetch(`/api/upload?id=${analysisId}`);
      if (!res.ok) throw new Error("Failed to load analysis");
      const json = await res.json();
      
      // Check if full analysis already exists
      if (json.fullAnalysis) {
        console.log('Loading cached analysis data');
        setAnalysisData(json.fullAnalysis);
      } else {
        console.log('Generating new analysis data');
        const mode = json.mode || 'ai'; // Get mode from saved analysis
        const dynamicData = await generateDynamicAnalysis(
          json.diarizationResult.utterances,
          json.speakerCharacteristics,
          json.durationSec,
          mode
        );
        setAnalysisData(dynamicData);
        
        // Save the full analysis for future use
        try {
          await fetch('/api/upload', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: analysisId, fullAnalysis: dynamicData }),
          });
          console.log('Full analysis saved');
        } catch (saveError) {
          console.error('Failed to save full analysis:', saveError);
          // Continue anyway - analysis is still displayed
        }
      }
      
      // Refresh history
      try {
        const historyRes = await fetch("/api/upload");
        if (historyRes.ok) {
          const historyJson = await historyRes.json();
          setHistory(historyJson.items || []);
        }
      } catch {}
      
      setAppState("results");
    } catch (error) {
      console.error("Analysis loading failed:", error);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Something went wrong.",
      });
      setAppState("idle");
    }
  };

  const handleNewAnalysis = () => {
    setAppState("idle");
    setAnalysisData(null);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-espresso via-cocoa to-deep-mocha relative overflow-hidden">
      {/* Animated Gradient Overlay */}
      <motion.div
        className="fixed inset-0 z-[1] opacity-70"
        animate={{
          background: [
            "linear-gradient(45deg, rgba(164,113,72,0.1) 0%, rgba(214,163,111,0.1) 100%)",
            "linear-gradient(45deg, rgba(214,163,111,0.1) 0%, rgba(244,202,100,0.1) 100%)",
            "linear-gradient(45deg, rgba(164,113,72,0.1) 0%, rgba(214,163,111,0.1) 100%)",
          ],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      />

      {/* Header with Glassmorphism */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="sticky top-0 z-50 w-full border-b border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl"
      >
        <div className="container h-20 flex items-center justify-between">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Logo onClick={handleNewAnalysis} />
          </motion.div>

          <div className="flex items-center gap-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="text-white/70"
            >
              <Network className="w-6 h-6" />
            </motion.div>

            <AnimatePresence>
              {appState === "results" && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNewAnalysis}
                  className="relative inline-flex items-center justify-center rounded-full text-sm font-medium bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-2xl h-12 px-8 overflow-hidden group"
                >
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    New Analysis
                  </span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="flex-1 relative z-10 overflow-y-auto custom-scrollbar">
        <style jsx>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(164, 113, 72, 0.5);
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(164, 113, 72, 0.7);
          }
        `}</style>
        {/* Idle State */}
        {appState === "idle" && (
          <motion.div className="container py-10 space-y-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
            {/* Hero Section */}
            <motion.div className="text-center mb-12" initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8 }}>
              <motion.h1
                className="text-6xl font-bold text-ivory mb-4 bg-clip-text text-transparent bg-gradient-to-r from-mocha to-gold"
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                style={{ backgroundSize: "200% 200%" }}
              >
                Meeting Intelligence Platform
              </motion.h1>
              <motion.p className="text-xl text-taupe max-w-2xl mx-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                Transform your meetings with AI-powered insights, sentiment analysis, and relationship mapping
              </motion.p>

              {/* Feature Icons */}
              <div className="flex justify-center gap-8 mt-8">
                {[
                  { icon: Brain, label: "AI Analysis" },
                  { icon: MessageSquare, label: "Transcription" },
                  { icon: Users, label: "Speaker ID" },
                  { icon: Activity, label: "Sentiment" },
                ].map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    whileHover={{ scale: 1.1, y: -5 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="p-3 rounded-full bg-mocha/20 backdrop-blur-xl border border-mocha/30">
                      <item.icon className="w-6 h-6 text-caramel" />
                    </div>
                    <span className="text-xs text-taupe">{item.label}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Mode Selector */}
            <ModeSelector value={analysisMode} onChange={setAnalysisMode} />

            {/* Upload Section - Use ChunkedUploadForm for large files */}
            <ChunkedUploadForm 
              analysisMode={analysisMode}
              onUploadComplete={handleChunkedUploadComplete}
              onUploadStart={() => setAppState("loading")}
            />

            {/* History Section */}
            {history.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <motion.h3 whileHover={{ x: 5 }} className="font-semibold text-xl text-ivory flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-mocha" />
                    Recent Analyses
                  </motion.h3>

                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="text-sm text-mocha hover:text-caramel transition-colors"
                      onClick={async () => {
                        try {
                          const res = await fetch("/api/upload");
                          if (res.ok) {
                            const j = await res.json();
                            setHistory(j.items || []);
                          }
                        } catch {}
                      }}
                    >
                      Refresh
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="text-sm text-red-400 hover:text-red-300 transition-colors"
                      onClick={async () => {
                        try {
                          setAppState("loading");
                          const res = await fetch("/api/clear-all", { method: "POST" });
                          if (res.ok) {
                            setHistory([]);
                            toast({
                              title: "All analyses cleared",
                              description: "All video data has been deleted.",
                              variant: "default",
                            });
                          }
                          setAppState("idle");
                        } catch {
                          setAppState("idle");
                        }
                      }}
                    >
                      Clear all
                    </motion.button>
                  </div>
                </div>

                {/* History Items */}
                <div className="space-y-3">
                  {history
                    .filter((item) => !item.hidden)
                    .map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05, type: "spring", stiffness: 100 }}
                        className="group relative p-4 rounded-xl bg-cocoa/30 border border-mocha/20 hover:bg-cocoa/50 transition-all"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-mocha/20 to-caramel/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="relative flex items-center justify-between">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-ivory">{new Date(item.createdAt).toLocaleString()}</span>
                              {item.mode === 'free' ? (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                                  🆓 Free
                                </span>
                              ) : (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                  🤖 AI
                                </span>
                              )}
                            </div>
                            {item.fileName && (
                              <span className="text-xs text-taupe flex items-center gap-1">
                                <FileAudio className="w-3 h-3" />
                                {item.fileName}
                              </span>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="px-4 py-2 rounded-lg bg-gradient-to-r from-mocha to-caramel text-ivory text-sm font-medium shadow-lg hover:shadow-mocha/25 transition-all"
                              onClick={async () => {
                                try {
                                  setAppState("loading");
                                  const res = await fetch(`/api/upload?id=${item.id}`);
                                  if (!res.ok) throw new Error("Failed to load analysis");
                                  const j = await res.json();
                                  
                                  // Check if full analysis already exists
                                  if (j.fullAnalysis) {
                                    console.log('Loading cached analysis data');
                                    setAnalysisData(j.fullAnalysis);
                                  } else {
                                    console.log('Generating new analysis data');
                                    const dynamicData = await generateDynamicAnalysis(
                                      j.diarizationResult.utterances,
                                      j.speakerCharacteristics,
                                      j.durationSec
                                    );
                                    setAnalysisData(dynamicData);
                                    
                                    // Save the full analysis for future use
                                    try {
                                      await fetch('/api/upload', {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ id: item.id, fullAnalysis: dynamicData }),
                                      });
                                      console.log('Full analysis saved');
                                    } catch (saveError) {
                                      console.error('Failed to save full analysis:', saveError);
                                    }
                                  }
                                  
                                  setAppState("results");
                                } catch (e) {
                                  setAppState("idle");
                                }
                              }}
                            >
                              <span className="flex items-center gap-1">
                                Open <ChevronRight className="w-3 h-3" />
                              </span>
                            </motion.button>

                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="px-3 py-2 rounded-lg bg-gold/20 hover:bg-gold/30 text-gold text-sm transition-all"
                              onClick={async () => {
                                await fetch("/api/hide-analysis", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ id: item.id }),
                                });
                                setHistory(history.map((h) => (h.id === item.id ? { ...h, hidden: true } : h)));
                              }}
                            >
                              Hide
                            </motion.button>

                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="px-3 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm transition-all"
                              onClick={async () => {
                                await fetch("/api/delete-analysis", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ id: item.id }),
                                });
                                setHistory(history.filter((h) => h.id !== item.id));
                              }}
                            >
                              Delete
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                </div>

                {/* Hidden Files Section */}
                {history.some((item) => item.hidden) && (
                  <motion.div
                    className="mt-6 p-4 rounded-xl bg-gray-800/30 backdrop-blur-lg border border-gray-700/50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      className="text-sm text-gray-400 hover:text-gray-300 mb-3 flex items-center gap-2"
                      onClick={() => setShowHidden((v) => !v)}
                    >
                      <motion.div animate={{ rotate: showHidden ? 180 : 0 }} transition={{ duration: 0.3 }}>
                        <ChevronRight className="w-4 h-4" />
                      </motion.div>
                      {showHidden ? "Hide Hidden Files" : `Show Hidden Files (${history.filter((h) => h.hidden).length})`}
                    </motion.button>

                    <AnimatePresence>
                      {showHidden && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="space-y-2 overflow-hidden"
                        >
                          {history
                            .filter((item) => item.hidden)
                            .map((item, index) => (
                              <motion.div
                                key={item.id}
                                initial={{ opacity: 0, x: -30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="p-3 rounded-lg bg-gray-900/50 border border-gray-700/30"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm text-gray-400">{new Date(item.createdAt).toLocaleString()}</span>
                                      {item.mode === 'free' ? (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                                          💰 Free
                                        </span>
                                      ) : (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                          🤖 AI
                                        </span>
                                      )}
                                    </div>
                                    {item.fileName && <span className="text-xs text-gray-500">{item.fileName}</span>}
                                  </div>

                                  <div className="flex gap-2">
                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      className="px-3 py-1 rounded-md bg-blue-600/30 text-blue-400 text-sm"
                                      onClick={async () => {
                                        try {
                                          setAppState("loading");
                                          const res = await fetch(`/api/upload?id=${item.id}`);
                                          if (!res.ok) throw new Error("Failed to load analysis");
                                          const j = await res.json();
                                          
                                          // Check if full analysis already exists
                                          if (j.fullAnalysis) {
                                            console.log('Loading cached analysis data');
                                            setAnalysisData(j.fullAnalysis);
                                          } else {
                                            console.log('Generating new analysis data');
                                            const dynamicData = await generateDynamicAnalysis(
                                              j.diarizationResult.utterances,
                                              j.speakerCharacteristics,
                                              j.durationSec
                                            );
                                            setAnalysisData(dynamicData);
                                            
                                            // Save the full analysis for future use
                                            try {
                                              await fetch('/api/upload', {
                                                method: 'PATCH',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ id: item.id, fullAnalysis: dynamicData }),
                                              });
                                              console.log('Full analysis saved');
                                            } catch (saveError) {
                                              console.error('Failed to save full analysis:', saveError);
                                            }
                                          }
                                          
                                          setAppState("results");
                                        } catch (e) {
                                          setAppState("idle");
                                        }
                                      }}
                                    >
                                      Open
                                    </motion.button>

                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      className="px-3 py-1 rounded-md bg-green-600/30 text-green-400 text-sm"
                                      onClick={async () => {
                                        await fetch("/api/hide-analysis", {
                                          method: "POST",
                                          headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({ id: item.id, unhide: true }),
                                        });
                                        setHistory(history.map((h) => (h.id === item.id ? { ...h, hidden: false } : h)));
                                      }}
                                    >
                                      Unhide
                                    </motion.button>

                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      className="px-3 py-1 rounded-md bg-red-600/30 text-red-400 text-sm"
                                      onClick={async () => {
                                        await fetch("/api/delete-analysis", {
                                          method: "POST",
                                          headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({ id: item.id }),
                                        });
                                        setHistory(history.filter((h) => h.id !== item.id));
                                      }}
                                    >
                                      Delete
                                    </motion.button>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Loading State */}
        {appState === "loading" && (
          <motion.div
            className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <LoadingAnimation />

            <motion.div className="space-y-4" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
              <h2 className="text-3xl font-bold text-white">Processing Your Meeting</h2>

              <div className="flex items-center justify-center gap-3">
                {["Transcribing", "Analyzing", "Mapping"].map((step, i) => (
                  <motion.div key={step} className="flex items-center gap-2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }}>
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                      className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
                    />
                    <span className="text-gray-400 text-sm">{step}</span>
                  </motion.div>
                ))}
              </div>

              <motion.p
                className="text-gray-400 max-w-md mt-4"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Our AI is extracting insights from your conversation...
              </motion.p>
            </motion.div>
          </motion.div>
        )}

        {/* Results State */}
        {appState === "results" && analysisData && (
          <motion.div className="h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
            {/* Analysis Dashboard with Stats in Sidebar */}
            <div className="h-full px-6 pt-4 max-w-[1920px] mx-auto">
              <AnalysisDashboard data={analysisData} />
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}