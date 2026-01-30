import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Download, Share2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAccessibility } from "@/hooks/useAccessibility";
import { useEffect, useRef, useState } from "react";
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
                            Download AI-ASSESSMENT
                        </Button>
                        <Button variant="outline" className="gap-2">
                            <Share2 className="h-4 w-4" />
                            Share
                        </Button>
                    </div>
                </div>

                <div ref={reportTemplateRef} className="bg-white p-12 border shadow-sm max-w-[210mm] mx-auto text-slate-900 font-serif">
                    {/* Official Letterhead */}
                    <div className="text-center border-b-2 border-slate-900 pb-6 mb-8">
                        <h2 className="text-2xl font-bold uppercase tracking-widest leading-none text-primary">AI-ASSESSMENT TOOL</h2>
                        <p className="text-xs font-bold mt-2 uppercase text-slate-500">Official Academic Transcript & Statement of Marks</p>
                    </div>

                    {/* Student & Exam Details Table */}
                    <div className="grid grid-cols-2 gap-x-12 gap-y-3 mb-8 text-xs">
                        <div className="flex justify-between border-b border-slate-200 pb-1">
                            <span className="font-bold">STUDENT NAME:</span>
                            <span>{userName.toUpperCase()}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200 pb-1">
                            <span className="font-bold">EXAM DATE:</span>
                            <span>{date.toUpperCase()}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200 pb-1">
                            <span className="font-bold">SUBJECT:</span>
                            <span>{result.exam_title || 'GENERAL ASSESSMENT'}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200 pb-1">
                            <span className="font-bold">RESULT STATUS:</span>
                            <span className={passed ? "text-green-700 font-bold" : "text-red-700 font-bold"}>
                                {passed ? 'QUALIFIED' : 'NOT QUALIFIED'}
                            </span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200 pb-1">
                            <span className="font-bold">ROLL NUMBER:</span>
                            <span>AT-{Math.floor(Math.random() * 90000) + 10000}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200 pb-1">
                            <span className="font-bold">EXAMINATION ID:</span>
                            <span>{result.exam_id?.substring(0, 8).toUpperCase() || 'N/A'}</span>
                        </div>
                    </div>

                    {/* Marks Distribution Table */}
                    <table className="w-full border-collapse border border-slate-900 text-xs mb-8">
                        <thead>
                            <tr className="bg-slate-100">
                                <th className="border border-slate-900 p-2 text-center w-12">SR.</th>
                                <th className="border border-slate-900 p-2 text-left">TOPIC / CONTENT DESCRIPTION</th>
                                <th className="border border-slate-900 p-2 text-center w-24">MAX MARKS</th>
                                <th className="border border-slate-900 p-2 text-center w-24">MARKS OBT.</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(result.question_results && result.question_results.length > 0) ? (
                                result.question_results.map((q: any, idx: number) => (
                                    <tr key={idx}>
                                        <td className="border border-slate-900 p-2 text-center">{idx + 1}</td>
                                        <td className="border border-slate-900 p-2">{q.question_text?.substring(0, 80)}...</td>
                                        <td className="border border-slate-900 p-2 text-center">{q.points || 10}</td>
                                        <td className="border border-slate-900 p-2 text-center font-bold">{q.score || 0}</td>
                                    </tr>
                                ))
                            ) : (
                                // Fallback if internal breakdown is missing
                                <tr>
                                    <td className="border border-slate-900 p-2 text-center">01</td>
                                    <td className="border border-slate-900 p-2">{result.exam_title || 'General Subject Competency'}</td>
                                    <td className="border border-slate-900 p-2 text-center">{result.max_score || 100}</td>
                                    <td className="border border-slate-900 p-2 text-center font-bold">{result.total_score || overallScore}</td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot>
                            <tr className="bg-slate-50 font-bold border-t-2 border-slate-900">
                                <td colSpan={2} className="border border-slate-900 p-2 text-right uppercase">Total Aggregate</td>
                                <td className="border border-slate-900 p-2 text-center">{result.max_score || 100}</td>
                                <td className="border border-slate-900 p-2 text-center text-sm">{result.total_score || overallScore}</td>
                            </tr>
                        </tfoot>
                    </table>

                    {/* Final Result & Remarks */}
                    <div className="flex justify-between items-start gap-12">
                        <div className="flex-1 border border-slate-900 p-4">
                            <p className="text-[10px] font-bold uppercase mb-2 border-b border-slate-200 pb-1">Examiner Remarks & Feedback:</p>
                            <p className="text-[11px] leading-relaxed italic">
                                {result.summary || "The candidate's performance has been evaluated based on their responses to the assessment items. Detailed analysis of correct and incorrect attempts has been factored into the final scoring."}
                            </p>
                        </div>
                        <div className="w-48 text-center">
                            <div className="border border-slate-900 p-4 mb-8">
                                <p className="text-[10px] font-bold uppercase mb-1">Percentage Secured</p>
                                <p className="text-2xl font-black">{overallScore}%</p>
                            </div>
                            <div className="pt-4 mt-auto">
                                <div className="h-px border-t border-dashed border-slate-900 w-full mb-1" />
                                <p className="text-[9px] font-bold uppercase tracking-tighter">Controller of Examinations</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-16 text-[8px] text-slate-400 text-center border-t pt-4 uppercase tracking-[0.2em]">
                        This is a computer-generated document and does not require a physical signature.
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
