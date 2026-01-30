import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, PlayCircle, Clock, Target, BookOpen } from "lucide-react";
import Navbar from "@/components/Navbar";
import { examsApi, Exam } from "@/lib/api";
import { toast } from "sonner";
import { useAccessibility } from "@/hooks/useAccessibility";

const ExamsList = () => {
    const navigate = useNavigate();
    const { speak } = useAccessibility();
    const [isLoading, setIsLoading] = useState(true);
    const [exams, setExams] = useState<Exam[]>([]);

    useEffect(() => {
        fetchExams();
    }, []);

    const fetchExams = async () => {
        try {
            const data = await examsApi.listAvailable();
            setExams(data);
        } catch {
            toast.error("Failed to load available exams");
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

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="container mx-auto p-6 space-y-8 animate-fade-in">
                {/* Header */}
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-bold">Available Exams</h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Choose an exam to test your skills. Our AI-powered assessments adapt to your level.
                    </p>
                </div>

                {/* Exams Grid */}
                {exams.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {exams.map((exam, idx) => (
                            <Card
                                key={exam.id}
                                className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-scale-in border-0"
                                style={{ animationDelay: `${idx * 0.1}s` }}
                                tabIndex={0}
                                onFocus={() => speak(exam.title)}
                            >
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                                            <BookOpen className="h-6 w-6 text-primary" aria-hidden="true" />
                                        </div>
                                        {exam.is_adaptive && (
                                            <span className="bg-accent/10 text-accent text-xs font-semibold px-2 py-1 rounded-full">
                                                Adaptive
                                            </span>
                                        )}
                                    </div>
                                    <CardTitle className="text-xl">{exam.title}</CardTitle>
                                    <CardDescription className="line-clamp-2">
                                        {exam.description || "Test your knowledge and skills with this assessment."}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-4 w-4" aria-hidden="true" />
                                            <span>{exam.duration_minutes} min</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Target className="h-4 w-4" aria-hidden="true" />
                                            <span>{exam.total_marks} marks</span>
                                        </div>
                                    </div>
                                    <div className="text-sm">
                                        <span className="text-muted-foreground">Passing score: </span>
                                        <span className="font-semibold text-primary">{exam.passing_score}%</span>
                                    </div>
                                    <Button
                                        onClick={() => navigate(`/exam/${exam.id}`)}
                                        className="w-full gap-2"
                                    >
                                        <PlayCircle className="h-4 w-4" aria-hidden="true" />
                                        Start Exam
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="max-w-md mx-auto text-center">
                        <CardContent className="py-12">
                            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Exams Available</h3>
                            <p className="text-muted-foreground mb-4">
                                There are no exams available at the moment. Check back later!
                            </p>
                            <Button onClick={() => navigate("/dashboard")} variant="outline">
                                Return to Dashboard
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </main>
        </div>
    );
};

export default ExamsList;
