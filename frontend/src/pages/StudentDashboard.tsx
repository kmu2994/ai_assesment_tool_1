import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { useNavigate } from "react-router-dom";
import {
    TrendingUp,
    FileText,
    Award,
    PlayCircle,
    BarChart3,
    Clock,
    Loader2,
    MessageSquare,
    Lock
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { analyticsApi, examsApi, StudentAnalytics, Exam } from "@/lib/api";
import { toast } from "sonner";
import { useAccessibility } from "@/hooks/useAccessibility";

const StudentDashboard = () => {
    const navigate = useNavigate();
    const { speak } = useAccessibility();
    const [isLoading, setIsLoading] = useState(true);
    const [analytics, setAnalytics] = useState<StudentAnalytics | null>(null);
    const [availableExams, setAvailableExams] = useState<Exam[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [analyticsData, examsData] = await Promise.all([
                analyticsApi.getStudentAnalytics(),
                examsApi.listAvailable()
            ]);
            setAnalytics(analyticsData);
            setAvailableExams(examsData);
        } catch {
            toast.error("Failed to load dashboard data");
        } finally {
            setIsLoading(false);
        }
    };

    // Chart data from analytics
    const skillsData = analytics?.history?.slice(0, 5).map(h => ({
        name: h.exam_title.slice(0, 12) + (h.exam_title.length > 12 ? '...' : ''),
        score: h.percentage || 0
    })) || [];

    const progressData = analytics?.history?.slice(0, 5).reverse().map((h, idx) => ({
        month: `Test ${idx + 1}`,
        avg: h.percentage || 0
    })) || [];

    const stats = [
        {
            title: "Total Assessments",
            value: String(analytics?.analytics?.total_exams || 0),
            change: "+20%",
            icon: FileText,
            color: "text-primary"
        },
        {
            title: "Average Score",
            value: `${analytics?.analytics?.average_score?.toFixed(0) || 0}%`,
            change: "+5%",
            icon: TrendingUp,
            color: "text-accent"
        },
        {
            title: "Best Score",
            value: `${analytics?.analytics?.best_score?.toFixed(0) || 0}%`,
            change: "+12%",
            icon: Clock,
            color: "text-secondary"
        },
        {
            title: "Available Exams",
            value: String(availableExams.length),
            change: `${availableExams.length} ready`,
            icon: Award,
            color: "text-success"
        },
    ];

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
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1
                            className="text-4xl font-bold mb-2 flex items-center gap-3"
                            onMouseEnter={() => speak(`Welcome back, ${JSON.parse(localStorage.getItem('user') || '{}').full_name || 'Student'}`)}
                        >
                            <span className="opacity-70 font-light">Welcome back,</span>
                            {JSON.parse(localStorage.getItem('user') || '{}').full_name || 'Student'}
                        </h1>
                        <p className="text-muted-foreground">Track your assessment progress and performance</p>
                    </div>
                    <Button onClick={() => navigate("/exams")} size="lg" className="gap-2">
                        <PlayCircle className="h-5 w-5" aria-hidden="true" />
                        Start New Assessment
                    </Button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat, idx) => (
                        <Card
                            key={idx}
                            className="hover:shadow-lg transition-shadow duration-300 animate-scale-in card-hover"
                            style={{ animationDelay: `${idx * 0.1}s` }}
                            tabIndex={0}
                            onFocus={() => speak(`${stat.title}: ${stat.value}`)}
                        >
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    {stat.title}
                                </CardTitle>
                                <stat.icon className={`h-5 w-5 ${stat.color}`} aria-hidden="true" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold mb-1">{stat.value}</div>
                                <p className="text-xs text-muted-foreground">
                                    <span className="text-success font-medium">{stat.change}</span> from last month
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Skills Performance */}
                    <Card className="animate-fade-in-up">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-primary" aria-hidden="true" />
                                Recent Performance
                            </CardTitle>
                            <CardDescription>Your latest assessment scores</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {skillsData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={skillsData}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                        <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "hsl(var(--card))",
                                                border: "1px solid hsl(var(--border))",
                                                borderRadius: "8px"
                                            }}
                                        />
                                        <Bar dataKey="score" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                    No assessment data yet. Take your first exam!
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Progress Over Time */}
                    <Card className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-accent" aria-hidden="true" />
                                Progress Over Time
                            </CardTitle>
                            <CardDescription>Your score progression</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {progressData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={progressData}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                        <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "hsl(var(--card))",
                                                border: "1px solid hsl(var(--border))",
                                                borderRadius: "8px"
                                            }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="avg"
                                            stroke="hsl(var(--accent))"
                                            strokeWidth={3}
                                            dot={{ fill: "hsl(var(--accent))", r: 5 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                    Complete more assessments to see your progress
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Available Exams */}
                <Card className="animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
                    <CardHeader>
                        <CardTitle>Available Exams</CardTitle>
                        <CardDescription>Ready for you to take</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {availableExams.length > 0 ? (
                            <div className="space-y-4">
                                {availableExams.slice(0, 5).map((exam) => (
                                    <div
                                        key={exam.id}
                                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                        tabIndex={0}
                                        onFocus={() => speak(exam.title)}
                                    >
                                        <div className="space-y-1">
                                            <h4 className="font-semibold">{exam.title}</h4>
                                            <p className="text-sm text-muted-foreground">
                                                {exam.duration_minutes} minutes • {exam.total_marks} marks
                                            </p>
                                        </div>
                                        <Button
                                            onClick={() => navigate(`/exam/${exam.id}`)}
                                            variant={exam.user_status && exam.user_status !== "in_progress" ? "secondary" : "outline"}
                                            disabled={Boolean(exam.user_status && exam.user_status !== "in_progress")}
                                            className="gap-2"
                                        >
                                            {exam.user_status && exam.user_status !== "in_progress" ? (
                                                <>
                                                    <Lock className="h-4 w-4" aria-hidden="true" />
                                                    Attempt Locked
                                                </>
                                            ) : exam.user_status === "in_progress" ? (
                                                <>
                                                    <PlayCircle className="h-4 w-4" aria-hidden="true" />
                                                    Resume
                                                </>
                                            ) : (
                                                "Start Exam"
                                            )}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                No exams available at the moment
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Assessments */}
                <Card className="animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
                    <CardHeader>
                        <CardTitle>Recent Assessments</CardTitle>
                        <CardDescription>Your latest test results</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {analytics?.history && analytics.history.length > 0 ? (
                            <div className="space-y-4">
                                {analytics.history.slice(0, 5).map((assessment) => (
                                    <div
                                        key={assessment.id}
                                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                        tabIndex={0}
                                        onFocus={() => speak(`${assessment.exam_title}: ${assessment.percentage?.toFixed(0)}%`)}
                                    >
                                        <div className="space-y-1">
                                            <h4 className="font-semibold">{assessment.exam_title}</h4>
                                            <p className="text-sm text-muted-foreground">
                                                {assessment.submitted_at ? new Date(assessment.submitted_at).toLocaleDateString() : 'Recently'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right space-y-1">
                                                <div className="text-2xl font-bold text-primary">{assessment.percentage?.toFixed(0) || 0}%</div>
                                                <p className="text-xs text-muted-foreground">
                                                    {(assessment.percentage || 0) >= 40 ? 'Passed' : 'Needs Improvement'}
                                                </p>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => navigate("/results", {
                                                    state: {
                                                        result: {
                                                            percentage: assessment.percentage,
                                                            exam_title: assessment.exam_title,
                                                            passed: (assessment.percentage || 0) >= 40
                                                        }
                                                    }
                                                })}
                                                className="gap-2"
                                            >
                                                <FileText className="h-4 w-4" />
                                                Report Card
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={() => navigate(`/detailed-result/${assessment.id}`)}
                                                className="gap-2"
                                            >
                                                <MessageSquare className="h-4 w-4" />
                                                Detailed Feedback
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                No completed assessments yet. Start your first exam!
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
};

export default StudentDashboard;
