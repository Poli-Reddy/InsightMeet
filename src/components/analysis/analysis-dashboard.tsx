"use client";

import type { AnalysisData } from "@/lib/types";
import SummaryReport from "./summary-report";
import TranscriptView from "./transcript-view";
import RelationshipGraph from "./relationship-graph";
import EmotionTimeline from "./emotion-timeline";
import ParticipantProfiles from "./participant-profiles";
import ParticipationCharts from "./participation-charts";
import ActionItems from "./action-items";
import Decisions from "./decisions";
import TopicSegmentation from "./topic-segmentation";
import { UnansweredQuestions } from "./unanswered-questions";
import { InterruptionDetection } from "./interruption-detection";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  BarChart,
  FileText,
  Smile,
  GitGraph,
  ListTodo,
  CheckSquare,
  Layers,
  HelpCircle,
  AlertCircle,
  Menu,
  Users,
  MessageSquare,
  Activity,
  ChevronRight,
} from "lucide-react";
import React, { useState, useEffect, useMemo } from "react";
import ExportResultsButton from "./export-results-button";

interface AnalysisDashboardProps {
  data: AnalysisData;
}

/** Utility: compute the total height of fixed elements at the top of the viewport */
function computeFixedTopOffset(): number {
  let fallback = 260;

  if (typeof window === "undefined" || typeof document === "undefined") {
    return fallback;
  }

  try {
    const all = Array.from(document.body.getElementsByTagName("*"));
    const tops: Array<{ top: number; height: number }> = [];

    for (const el of all) {
      const style = window.getComputedStyle(el);
      if (style.position === "fixed") {
        const rect = el.getBoundingClientRect();
        if (rect.bottom > 0 && rect.top <= 8 && rect.height > 0 && rect.height < 400) {
          tops.push({ top: rect.top, height: rect.height });
        }
      }
    }

    if (tops.length === 0) return fallback;

    tops.sort((a, b) => a.top - b.top);
    let total = 0;
    let currentBottom = -Infinity;

    for (const t of tops) {
      const top = Math.max(0, t.top);
      const bottom = top + t.height;
      if (top >= currentBottom) {
        total += t.height;
        currentBottom = bottom;
      } else if (bottom > currentBottom) {
        total += bottom - currentBottom;
        currentBottom = bottom;
      }
    }

    return Math.min(480, Math.max(120, Math.round(total + 20)));
  } catch {
    return fallback;
  }
}

export default function AnalysisDashboard({ data }: AnalysisDashboardProps) {
  const [activeSection, setActiveSection] = useState("summary");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [fixedOffset, setFixedOffset] = useState<number>(() => computeFixedTopOffset());

  useEffect(() => {
    const update = () => setFixedOffset(computeFixedTopOffset());
    update();

    window.addEventListener("resize", update);

    const ro = new ResizeObserver(() => update());
    ro.observe(document.documentElement);
    ro.observe(document.body);

    let raf = 0;
    let lastWidth = window.innerWidth;
    const tick = () => {
      if (Math.abs(window.innerWidth - lastWidth) > 1) {
        lastWidth = window.innerWidth;
        update();
      }
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("resize", update);
      ro.disconnect();
      window.cancelAnimationFrame(raf);
    };
  }, []);

  const sections = useMemo(
    () => [
      {
        id: "summary",
        title: "Summary",
        icon: FileText,
        component: (
          <SummaryReport
            summary={data.summary}
            relationshipGraph={data.relationshipGraph}
            keywords={data.keywords}
          />
        ),
      },
      {
        id: "participant-profiles",
        title: "Participant Profiles",
        icon: Users,
        component: <ParticipantProfiles metrics={data.participation} />,
      },
      {
        id: "transcript",
        title: "Full Transcript",
        icon: FileText,
        component: <TranscriptView transcript={data.transcript} />,
      },
      {
        id: "relationship-graph",
        title: "Relationship Graph",
        icon: GitGraph,
        component: <RelationshipGraph data={data.relationshipGraph} />,
      },
      {
        id: "action-items",
        title: "Action Items",
        icon: ListTodo,
        component: <ActionItems actionItems={data.actionItems} />,
      },
      {
        id: "decisions",
        title: "Decisions",
        icon: CheckSquare,
        component: <Decisions decisions={data.decisions} />,
      },
      {
        id: "topics",
        title: "Topic Segmentation",
        icon: Layers,
        component: <TopicSegmentation topics={data.topics} />,
      },
      {
        id: "unanswered-questions",
        title: "Unanswered Questions",
        icon: HelpCircle,
        component: (
          <UnansweredQuestions
            unansweredQuestions={data.unansweredQuestions}
          />
        ),
      },
      {
        id: "interruption-detection",
        title: "Interruptions",
        icon: AlertCircle,
        component: (
          <InterruptionDetection interruptions={data.interruptions} />
        ),
      },
      {
        id: "emotion-timeline",
        title: "Emotion Timeline",
        icon: Smile,
        component: (
          <EmotionTimeline
            data={data.emotionTimeline}
            speakers={data.participation}
          />
        ),
      },
      {
        id: "participation-metrics",
        title: "Participation Metrics",
        icon: BarChart,
        component: <ParticipationCharts metrics={data.participation} />,
      },
    ],
    [data]
  );

  useEffect(() => {
    const margin = `-${fixedOffset}px 0px -55% 0px`;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          setActiveSection(visible[0].target.id);
        }
      },
      { threshold: [0.2, 0.4, 0.6], rootMargin: margin }
    );

    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    });

    const mainContainer = document.querySelector('main');
    
    const onScroll = () => {
      if (!mainContainer) return;
      const containerRect = mainContainer.getBoundingClientRect();
      const midpoint = containerRect.top + fixedOffset + 100; // 100px below fixed header
      let bestId = sections[0]?.id ?? "summary";
      let bestDist = Infinity;
      
      for (const s of sections) {
        const el = document.getElementById(s.id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const dist = Math.abs(rect.top - midpoint);
        if (dist < bestDist) {
          bestDist = dist;
          bestId = s.id;
        }
      }
      setActiveSection((prev) => (prev !== bestId ? bestId : prev));
    };

    if (mainContainer) {
      mainContainer.addEventListener("scroll", onScroll, { passive: true });
    }

    return () => {
      obs.disconnect();
      if (mainContainer) {
        mainContainer.removeEventListener("scroll", onScroll);
      }
    };
  }, [sections, fixedOffset]);

  const handleScroll = (id: string) => {
    const el = document.getElementById(id);
    const mainContainer = document.querySelector('main');
    if (el && mainContainer) {
      const containerRect = mainContainer.getBoundingClientRect();
      const elementRect = el.getBoundingClientRect();
      const scrollTop = mainContainer.scrollTop;
      const targetScroll = scrollTop + elementRect.top - containerRect.top - fixedOffset;
      
      mainContainer.scrollTo({ top: targetScroll, behavior: "smooth" });
      setIsMenuOpen(false);
    }
  };

  const NavigationMenu = () => (
    <nav className="flex flex-col gap-1">
      {sections.map((section) => {
        const isActive = activeSection === section.id;
        return (
          <Button
            key={section.id}
            variant="ghost"
            className={`justify-start w-full transition-all duration-200 ${
              isActive
                ? "bg-gradient-to-r from-mocha/30 to-caramel/30 text-ivory font-semibold border-l-4 border-gold shadow-lg"
                : "text-taupe hover:bg-white/10 hover:text-ivory border-l-4 border-transparent"
            }`}
            onClick={() => handleScroll(section.id)}
          >
            <section.icon className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="truncate text-left">{section.title}</span>
          </Button>
        );
      })}
    </nav>
  );

  const sidebarStyle: React.CSSProperties = {
    top: 96, // Fixed: main header height (80px) + spacing (16px)
    height: `calc(100vh - 96px)`,
  };

  return (
    <div className="relative w-full">
      {/* Mobile FAB */}
      <div className="lg:hidden fixed bottom-6 right-6 z-50">
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetTrigger asChild>
            <Button size="lg" className="rounded-full h-14 w-14 shadow-lg">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <SheetHeader>
              <SheetTitle>Analysis Sections</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <NavigationMenu />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Layout: Sidebar + Content */}
      <div className="flex gap-0 w-full">
        {/* Fixed Sidebar - Hidden on Mobile, Attached to Left */}
        <aside
          className={`hidden lg:block flex-shrink-0 transition-all duration-300 ${
            isSidebarCollapsed ? 'w-0' : 'w-64'
          }`}
        >
          <div
            className={`fixed left-0 bg-gradient-to-b from-espresso via-cocoa to-espresso border-r border-mocha/20 transition-all duration-300 ${
              isSidebarCollapsed ? 'w-0 opacity-0' : 'w-64 opacity-100'
            }`}
            style={sidebarStyle}
          >
            <style jsx>{`
              .scrollbar-hide::-webkit-scrollbar {
                display: none;
              }
              .scrollbar-hide {
                -ms-overflow-style: none;
                scrollbar-width: none;
              }
            `}</style>

            {/* Sticky Header with Stats */}
            <div className="sticky top-0 bg-gradient-to-b from-espresso via-cocoa to-transparent pb-4 z-10 space-y-4 px-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-ivory">
                  Analysis Dashboard
                </h3>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/20 border border-green-500/30">
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }} 
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-2 h-2 bg-green-400 rounded-full"
                />
                <span className="text-green-400 text-xs font-semibold">Analysis Complete</span>
              </div>

              {/* Stats */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-mocha/10 border border-mocha/20">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-mocha" />
                    <span className="text-taupe text-xs">Speakers</span>
                  </div>
                  <span className="text-ivory font-bold text-sm">{data.participation.length}</span>
                </div>

                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-caramel/10 border border-caramel/20">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-caramel" />
                    <span className="text-taupe text-xs">Lines</span>
                  </div>
                  <span className="text-ivory font-bold text-sm">{data.transcript.length}</span>
                </div>

                <div className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                  data.summary.overallSentiment === "Positive" ? "bg-green-500/10 border-green-500/20" :
                  data.summary.overallSentiment === "Negative" ? "bg-red-500/10 border-red-500/20" :
                  "bg-gray-500/10 border-gray-500/20"
                } border`}>
                  <div className="flex items-center gap-2">
                    <Activity className={`w-4 h-4 ${
                      data.summary.overallSentiment === "Positive" ? "text-green-400" :
                      data.summary.overallSentiment === "Negative" ? "text-red-400" :
                      "text-gray-400"
                    }`} />
                    <span className="text-taupe text-xs">Sentiment</span>
                  </div>
                  <span className="text-ivory font-bold text-sm">{data.summary.overallSentiment}</span>
                </div>
              </div>

              {/* Export Button */}
              <ExportResultsButton analysisData={data} />

              <div className="border-t border-white/20 pt-3">
                <h4 className="text-sm font-semibold text-white mb-2">Sections</h4>
              </div>
            </div>

            {/* Scrollable Menu */}
            <div className="overflow-y-auto scrollbar-hide" style={{ maxHeight: 'calc(100vh - 500px)' }}>
              <NavigationMenu />

              {/* Progress Indicator */}
              <div className="mt-6 pt-6 border-t border-white/20">
              <p className="text-xs text-taupe mb-2">Progress</p>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-mocha to-gold h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      ((sections.findIndex((s) => s.id === activeSection) + 1) /
                        sections.length) *
                      100
                    }%`,
                  }}
                />
              </div>
              <p className="text-xs text-taupe mt-1">
                {sections.findIndex((s) => s.id === activeSection) + 1} of{" "}
                {sections.length}
              </p>
            </div>
            </div>
          </div>
        </aside>

        {/* Collapse/Expand Button */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className={`hidden lg:flex fixed z-50 items-center justify-center w-8 h-16 bg-gradient-to-r from-mocha to-caramel hover:from-mocha-light hover:to-caramel-light text-ivory rounded-r-lg shadow-lg transition-all duration-300 ${
            isSidebarCollapsed ? 'left-0' : 'left-64'
          }`}
          style={{ top: '50%', transform: 'translateY(-50%)' }}
        >
          <motion.div
            animate={{ rotate: isSidebarCollapsed ? 0 : 180 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronRight className="w-5 h-5" />
          </motion.div>
        </button>

        {/* Main Content */}
        <main className={`flex-1 min-w-0 space-y-8 transition-all duration-300 ${
          isSidebarCollapsed ? 'ml-0' : 'ml-8'
        }`}>
          {sections.map((section, index) => (
            <motion.div
              id={section.id}
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="rounded-xl border bg-gradient-to-br from-[#6B4423]/80 to-[#4A2C1A]/80 backdrop-blur-2xl border-mocha/20 shadow-2xl p-8"
            >
              {section.component}
            </motion.div>
          ))}
        </main>
      </div>
    </div>
  );
}
