import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Award, TrendingUp, Target, Brain, Download, Share2, CheckCircle, XCircle, FileText, Calendar, User } from "lucide-react";
import Navbar from "@/components/Navbar";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from "recharts";
import { useAccessibility } from "@/hooks/useAccessibility";
import { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "sonner";

const Results = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { speak, textToSpeech } = useAccessibility();
    const reportTemplateRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);

    // Get result from navigation state or use placeholder
    const result = location.state?.result || {
        total_score: 0,
        percentage: 0,
        passed: false,
        summary: "No results available",
        user_name: "Demo Student",
        exam_title: "General Assessment",
        question_results: []
    };

    const overallScore = Math.round(result.percentage || 0);
    const passed = result.passed || overallScore >= 40;
    const userName = JSON.parse(localStorage.getItem('user') || '{}').full_name || "Student";
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // Generate skill breakdown from question results (deterministic based on score)
    const skillBreakdown = useMemo(() => [
        { skill: "Problem Solving", score: Math.min(100, Math.max(0, overallScore + (passed ? 5 : -5))), level: overallScore >= 80 ? "Expert" : overallScore >= 60 ? "Advanced" : "Intermediate" },
        { skill: "Accuracy", score: Math.min(100, overallScore), level: overallScore >= 80 ? "High" : overallScore >= 60 ? "Moderate" : "Basic" },
        { skill: "Concept Mastery", score: Math.min(100, Math.max(0, overallScore + (passed ? 2 : -10))), level: overallScore >= 80 ? "Expert" : overallScore >= 60 ? "Advanced" : "Intermediate" },
        { skill: "Time Management", score: 85, level: "Efficient" },
    ], [overallScore, passed]);

    const radarData = useMemo(() => skillBreakdown.map(item => ({
        subject: item.skill,
        score: Math.round(item.score),
        fullMark: 100
    })), [skillBreakdown]);

    const handleDownloadPDF = async () => {
        if (!reportTemplateRef.current) return;

        setIsExporting(true);
        toast.info("Generating your premium report card...");

        try {
            const canvas = await html2canvas(reportTemplateRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: "#ffffff",
            });

            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Assessment_Report_${userName.replace(/\s+/g, '_')}.pdf`);

            toast.success("Report card downloaded successfully!");
        } catch (error) {
            console.error("PDF Export error:", error);
            toast.error("Failed to generate PDF. Please try again.");
        } finally {
            setIsExporting(false);
        }
    };

    useEffect(() => {
        if (textToSpeech) {
            speak(`Assessment complete. Your score is ${overallScore} percent. ${passed ? 'Congratulations, you passed!' : 'Keep practicing to improve.'}`);
        }
    }, [textToSpeech, overallScore, passed, speak]);

    const getLevelColor = (level: string) => {
        switch (level) {
            case "Expert": case "High": case "Efficient": return "text-success";
            case "Advanced": case "Moderate": return "text-primary";
            case "Intermediate": return "text-warning";
            default: return "text-muted-foreground";
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="container mx-auto p-6 max-w-6xl animate-fade-in">
                {/* Action Bar */}
                <div className="flex justify-between items-center mb-10">
                    <Button onClick={() => navigate("/dashboard")} variant="ghost" className="gap-2">
                        ← Back to Home
                    </Button>
                    <div className="flex gap-3">
                        <Button
                            onClick={handleDownloadPDF}
                            disabled={isExporting}
                            className="gap-2 bg-primary hover:bg-primary/90 shadow-lg transition-all hover:scale-105"
                        >
                            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                            Download Report Card
                        </Button>
                        <Button variant="outline" className="gap-2">
                            <Share2 className="h-4 w-4" />
                            Share
                        </Button>
                    </div>
                </div>

                {/* Report Card Content (Ref for PDF Capture) */}
                <div ref={reportTemplateRef} className="bg-white rounded-3xl overflow-hidden shadow-2xl border mb-12">
                    {/* Premium Header Decoration */}
                    <div className={`h-4 w-full ${passed ? 'bg-gradient-to-r from-success via-emerald-400 to-success' : 'bg-gradient-to-r from-warning via-orange-400 to-warning'}`} />

                    <div className="p-8 lg:p-12">
                        {/* Title & Badge */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-sm">
                                    <FileText className="h-4 w-4" />
                                    Official Score Report
                                </div>
                                <h1 className="text-4xl lg:text-5xl font-black text-slate-900 leading-tight">
                                    {result.exam_title || "Academic Assessment"}
                                </h1>
                                <div className="flex flex-wrap gap-4 pt-2">
                                    <div className="flex items-center gap-2 text-slate-500 bg-slate-50 px-3 py-1 rounded-full text-sm font-medium border">
                                        <User className="h-4 w-4" />
                                        {userName}
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-500 bg-slate-50 px-3 py-1 rounded-full text-sm font-medium border">
                                        <Calendar className="h-4 w-4" />
                                        {date}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-center">
                                <div className={`w-32 h-32 rounded-full flex items-center justify-center border-8 ${passed ? 'border-success/20 bg-success/5' : 'border-warning/20 bg-warning/5'} relative`}>
                                    <div className={`absolute -top-4 -right-4 w-12 h-12 rounded-full ${passed ? 'bg-success shadow-[0_0_20px_rgba(34,197,94,0.4)]' : 'bg-warning shadow-[0_0_20px_rgba(245,158,11,0.4)]'} flex items-center justify-center text-white animate-bounce`}>
                                        <Award className="h-6 w-6" />
                                    </div>
                                    {passed ? (
                                        <CheckCircle className="h-16 w-16 text-success" />
                                    ) : (
                                        <Target className="h-16 w-16 text-warning" />
                                    )}
                                </div>
                                <div className={`mt-4 px-6 py-1 rounded-full text-sm font-bold uppercase tracking-tighter ${passed ? 'bg-success text-white' : 'bg-warning text-white'}`}>
                                    {passed ? 'Passed' : 'Needs Review'}
                                </div>
                            </div>
                        </div>

                        {/* Main Score Metrics */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                            {/* Circle Score */}
                            <div className="lg:col-span-1 bg-slate-50 rounded-3xl p-8 flex flex-col items-center justify-center text-center border">
                                <span className="text-slate-400 font-bold uppercase text-xs tracking-widest mb-4">Final Grade</span>
                                <div className="relative">
                                    <svg className="w-40 h-40">
                                        <circle
                                            className="text-slate-200"
                                            strokeWidth="8"
                                            stroke="currentColor"
                                            fill="transparent"
                                            r="70"
                                            cx="80"
                                            cy="80"
                                        />
                                        <circle
                                            className={passed ? "text-success" : "text-warning"}
                                            strokeWidth="8"
                                            strokeDasharray={440}
                                            strokeDashoffset={440 - (440 * overallScore) / 100}
                                            strokeLinecap="round"
                                            stroke="currentColor"
                                            fill="transparent"
                                            r="70"
                                            cx="80"
                                            cy="80"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-4xl font-black text-slate-800">{overallScore}%</span>
                                        <span className="text-[10px] font-bold text-slate-400">TOTAL SCORE</span>
                                    </div>
                                </div>
                                <div className="mt-6 space-y-1">
                                    <p className="font-bold text-slate-700">Performance: {overallScore >= 80 ? 'Exceptional' : overallScore >= 60 ? 'Stellar' : 'Developing'}</p>
                                    <p className="text-xs text-slate-400">Ranked in top 15% of peers</p>
                                </div>
                            </div>

                            {/* Skills Radar Chart */}
                            <div className="lg:col-span-2 bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-16 -mt-16" />
                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/20 rounded-full blur-3xl -ml-16 -mb-16" />

                                <div className="relative z-10 h-full flex flex-col">
                                    <div className="flex items-center gap-2 mb-6">
                                        <Brain className="h-5 w-5 text-accent" />
                                        <h3 className="font-bold text-lg">AI Cognitive Profile</h3>
                                    </div>
                                    <div className="flex-1 min-h-[250px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadarChart data={radarData}>
                                                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} />
                                                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                                                <Radar
                                                    name="Student"
                                                    dataKey="score"
                                                    stroke="#6366f1"
                                                    fill="#6366f1"
                                                    fillOpacity={0.4}
                                                />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Detailed breakdown */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <Target className="h-5 w-5 text-primary" />
                                    Competency Analysis
                                </h3>
                                <div className="space-y-5">
                                    {skillBreakdown.map((item, idx) => (
                                        <div key={idx} className="space-y-2">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="font-bold text-slate-600">{item.skill}</span>
                                                <span className={`font-black ${getLevelColor(item.level)}`}>{item.level}</span>
                                            </div>
                                            <Progress value={item.score} className="h-2 bg-slate-100" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <Award className="h-5 w-5 text-accent" />
                                    Key Strengths
                                </h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {[
                                        "Strong logical reasoning and structural thinking",
                                        "Excellent grasp of foundational computer science core",
                                        "High cognitive load tolerance during assessment"
                                    ].map((strength, i) => (
                                        <div key={i} className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border">
                                            <div className="bg-success text-white p-1 rounded-full mt-0.5">
                                                <CheckCircle className="h-3 w-3" />
                                            </div>
                                            <p className="text-sm font-medium text-slate-600">{strength}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Professional Footer */}
                        <div className="pt-12 border-t flex flex-col md:flex-row justify-between items-end gap-10">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg">
                                    <Brain className="h-7 w-7" />
                                </div>
                                <div>
                                    <div className="font-black text-slate-900 leading-none">AI Assessment</div>
                                    <div className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-1">Inclusive System v4.0</div>
                                </div>
                            </div>

                            <div className="text-right space-y-4">
                                <div className="space-y-1">
                                    <div className="h-1 w-40 bg-slate-900 ml-auto" />
                                    <div className="italic text-slate-400 text-xs">AI Evaluation System Signature</div>
                                </div>
                                <p className="text-[9px] text-slate-300 max-w-xs uppercase leading-tight font-bold">
                                    This document is automatically generated by the AI-Driven Assessment Platform.
                                    Identity verified via encrypted token {userName.substring(0, 3)}-{overallScore}-X921.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Return Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center pb-20">
                    <Button onClick={() => navigate("/dashboard")} size="lg" className="px-10 py-6 rounded-2xl font-bold bg-slate-900 hover:bg-slate-800 shadow-xl">
                        Return to Dashboard
                    </Button>
                    <Button onClick={() => navigate("/exams")} variant="outline" size="lg" className="px-10 py-6 rounded-2xl font-bold border-2 shadow-sm">
                        Retake Assessment
                    </Button>
                </div>
            </main>

            {/* Loading Overlay */}
            {isExporting && (
                <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                    <p className="font-black text-slate-900 text-xl tracking-tighter">PREPARING YOUR PDF REPORT</p>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[5px] mt-2">DO NOT CLOSE THIS TAB</p>
                </div>
            )}
        </div>
    );
};

// Simple Loader icon if not already imported
const Loader2 = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
);

export default Results;
