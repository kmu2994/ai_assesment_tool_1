import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    ChevronLeft,
    MessageSquare,
    BrainCircuit,
    User,
    Award,
    CheckCircle2,
    Image as ImageIcon,
    Loader2
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { examsApi, SubmissionDetail } from "@/lib/api";
import { toast } from "sonner";

const ViewDetailedResult = () => {
    const { submissionId } = useParams<{ submissionId: string }>();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [submission, setSubmission] = useState<SubmissionDetail | null>(null);

    useEffect(() => {
        if (submissionId) {
            fetchSubmission();
        }
    }, [submissionId]);

    const fetchSubmission = async () => {
        try {
            const data = await examsApi.getSubmission(submissionId!);
            setSubmission(data);
        } catch {
            toast.error("Failed to load result details");
            navigate("/dashboard");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="flex items-center justify-center h-[calc(100vh-80px)]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    if (!submission) return null;

    const passed = submission.percentage >= 40;

    return (
        <div className="min-h-screen bg-background pb-20">
            <Navbar />

            <main className="container mx-auto p-6 max-w-5xl space-y-8 animate-fade-in">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate("/dashboard")}
                            className="gap-2 -ml-2 text-muted-foreground"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Back to Dashboard
                        </Button>
                        <h1 className="text-3xl font-bold">Assessment Feedback</h1>
                        <p className="text-muted-foreground">
                            {submission.exam_title} • Completed on {new Date().toLocaleDateString()}
                        </p>
                    </div>
                </div>

                {/* Score Summary Card */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className={`md:col-span-2 border-2 ${passed ? 'border-success/20 bg-success/5' : 'border-warning/20 bg-warning/5'}`}>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Award className={`h-6 w-6 ${passed ? 'text-success' : 'text-warning'}`} />
                                Final Evaluation
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-5xl font-black">{submission.percentage.toFixed(1)}%</h2>
                                    <p className="text-muted-foreground mt-1">Total Score: {submission.total_score} / {submission.max_score}</p>
                                </div>
                                <Badge className={`text-lg px-6 py-2 rounded-full ${passed ? 'bg-success hover:bg-success/90' : 'bg-destructive'}`}>
                                    {passed ? "PASSED" : "NEEDS IMPROVEMENT"}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-primary/5 border-primary/20">
                        <CardHeader className="pb-3 border-b border-primary/10">
                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary">Teacher's Remarks</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="flex gap-3">
                                <MessageSquare className="h-5 w-5 text-primary shrink-0 mt-1" />
                                <p className="text-foreground italic leading-relaxed">
                                    {submission.teacher_remarks || "No overall remarks provided."}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Question Breakdown */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-2 px-1">
                        <CheckCircle2 className="h-6 w-6 text-primary" />
                        Detailed Answer Breakdown
                    </h3>

                    {submission.answers.map((ans, idx) => (
                        <Card key={ans.answer_id} className="overflow-hidden border-2 rounded-xl">
                            <div className="p-4 bg-muted/30 border-b flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <span className="bg-background text-foreground font-bold h-7 w-7 rounded-md flex items-center justify-center border text-sm">
                                        Q{idx + 1}
                                    </span>
                                    <span className="text-sm font-semibold opacity-70">Descriptive Answer</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-lg font-black text-primary">{ans.current_score}</span>
                                    <span className="text-sm text-muted-foreground ml-1">/ {ans.max_points}</span>
                                </div>
                            </div>

                            <CardContent className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Student Response Section */}
                                    <div className="space-y-4">
                                        <div>
                                            <Label className="text-xs text-muted-foreground uppercase font-bold mb-2 block">Question</Label>
                                            <p className="font-semibold">{ans.question_text}</p>
                                        </div>
                                        <div className="p-5 bg-primary/5 rounded-2xl border-2 border-primary/10 relative">
                                            <Label className="text-[10px] text-primary uppercase font-bold flex items-center gap-2 mb-2">
                                                <User className="h-3 w-3" />
                                                Your Response
                                            </Label>
                                            <p className="text-foreground leading-relaxed">
                                                {ans.student_answer || <span className="text-muted-foreground italic">No answer submitted</span>}
                                            </p>
                                            {ans.image_url && (
                                                <div className="mt-4 pt-4 border-t border-primary/10">
                                                    <Label className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1 mb-2">
                                                        <ImageIcon className="h-3 w-3" />
                                                        Original Uploaded Image
                                                    </Label>
                                                    <div className="rounded-lg overflow-hidden border bg-white group relative">
                                                        <img
                                                            src={ans.image_url}
                                                            alt="Handwritten Answer"
                                                            className="w-full h-auto max-h-[250px] object-contain group-hover:scale-105 transition-transform duration-500"
                                                        />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-zoom-in" onClick={() => window.open(ans.image_url!, '_blank')}>
                                                            <span className="text-white font-bold text-xs uppercase tracking-widest">View Full Size</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Analysis & Feedback Section */}
                                    <div className="space-y-6">
                                        <div className="p-5 rounded-2xl bg-accent/5 border border-accent/20">
                                            <Label className="text-[10px] text-accent uppercase font-bold flex items-center gap-2 mb-3">
                                                <BrainCircuit className="h-4 w-4" />
                                                AI Smart Feedback
                                            </Label>
                                            <p className="text-sm italic leading-relaxed text-foreground/80">
                                                "{ans.feedback}"
                                            </p>
                                        </div>

                                        <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20">
                                            <Label className="text-[10px] text-primary uppercase font-bold flex items-center gap-2 mb-3">
                                                <MessageSquare className="h-4 w-4" />
                                                Teacher's Specific Remarks
                                            </Label>
                                            <p className="text-sm leading-relaxed text-foreground">
                                                {ans.teacher_remarks || "No specific remarks for this question."}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </main>
        </div>
    );
};

// Simple Label component if not imported from UI
const Label = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <label className={className}>{children}</label>
);

export default ViewDetailedResult;
