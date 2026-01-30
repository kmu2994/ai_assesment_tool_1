import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
    TrendingUp,
    FileText,
    Activity,
    Users,
    PlusCircle,
    Trash2,
    Loader2,
    Search,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import CreateExamModal from "@/components/CreateExamModal";
import { analyticsApi, examsApi, TeacherDashboard as TeacherDashboardData } from "@/lib/api";
import { toast } from "sonner";

const TeacherDashboard = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [dashboard, setDashboard] = useState<TeacherDashboardData | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchDashboard();
        const interval = setInterval(fetchDashboard, 15000); // Pulse every 15s for "real-time" feel
        return () => clearInterval(interval);
    }, []);

    const fetchDashboard = async () => {
        try {
            const data = await analyticsApi.getTeacherDashboard();
            setDashboard(data);
        } catch {
            toast.error("Failed to load dashboard");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteExam = async (examId: string) => {
        if (!confirm("Are you sure you want to delete this exam?")) return;

        try {
            await examsApi.deleteExam(examId);
            toast.success("Exam deleted successfully");
            fetchDashboard();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { detail?: string } } };
            toast.error(err.response?.data?.detail || "Failed to delete exam");
        }
    };

    const stats = [
        { title: "Total Exams Created", value: String(dashboard?.total_exams_created || 0), change: "+3", icon: FileText, color: "text-primary" },
        { title: "Total Submissions", value: String(dashboard?.total_submissions || 0), change: "+12%", icon: Activity, color: "text-accent" },
        { title: "Active Exams", value: String(dashboard?.exams?.filter(e => e.is_active).length || 0), change: "+5", icon: Users, color: "text-success" },
        {
            title: "Avg. Score", value: dashboard?.student_submissions?.length ?
                `${(dashboard.student_submissions.reduce((a, b) => a + (b.percentage || 0), 0) / dashboard.student_submissions.length).toFixed(0)}%` : "N/A",
            change: "+8%", icon: TrendingUp, color: "text-warning"
        },
    ];

    // Calculate real-time chart data from actual submissions
    const activityData = useMemo(() => {
        const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        const data = dayNames.map(day => ({ day, submissions: 0 }));

        if (!dashboard?.student_submissions) return data;

        dashboard.student_submissions.forEach(submission => {
            if (!submission.submitted_at) return;
            const date = new Date(submission.submitted_at);
            // Convert Sunday (0) to 6, Monday (1) to 0, etc.
            const dayIndex = (date.getDay() + 6) % 7;
            data[dayIndex].submissions += 1;
        });

        return data;
    }, [dashboard]);

    const filteredSubmissions = dashboard?.student_submissions?.filter(s =>
        s.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.exam_title.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

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
                        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                            <span className="opacity-70 font-light italic">Welcome,</span>
                            {JSON.parse(localStorage.getItem('user') || '{}').full_name || 'Teacher'}
                        </h1>
                        <p className="text-muted-foreground">Manage exams and student performance</p>
                    </div>
                    <Button onClick={() => setShowCreateModal(true)} size="lg" className="gap-2">
                        <PlusCircle className="h-5 w-5" />
                        Create New Exam
                    </Button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat, idx) => (
                        <Card
                            key={idx}
                            className="hover:shadow-lg transition-shadow duration-300 animate-scale-in"
                            style={{ animationDelay: `${idx * 0.1}s` }}
                        >
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    {stat.title}
                                </CardTitle>
                                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold mb-1">{stat.value}</div>
                                <p className="text-xs text-muted-foreground">
                                    <span className="text-success font-medium">{stat.change}</span> this week
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Activity Chart */}
                    <Card className="animate-fade-in-up shadow-lg border-primary/10">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-accent" />
                                    Weekly Submissions
                                </CardTitle>
                                <CardDescription>Live student activity data</CardDescription>
                            </div>
                            <div className="flex items-center gap-2 bg-success/10 px-2 py-1 rounded-full border border-success/20">
                                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                                <span className="text-[10px] font-bold text-success uppercase tracking-wider">Live</span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={activityData}>
                                    <defs>
                                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.8} />
                                            <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                    <XAxis
                                        dataKey="day"
                                        tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }}
                                        contentStyle={{
                                            backgroundColor: "hsl(var(--card))",
                                            border: "1px solid hsl(var(--border))",
                                            borderRadius: "12px",
                                            boxShadow: "var(--shadow-lg)"
                                        }}
                                    />
                                    <Bar
                                        dataKey="submissions"
                                        fill="url(#barGradient)"
                                        radius={[6, 6, 0, 0]}
                                        animationDuration={1500}
                                        animationBegin={200}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* My Exams */}
                    <Card className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                My Exams
                            </CardTitle>
                            <CardDescription>Manage your created exams</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {dashboard?.exams?.map((exam) => (
                                    <div
                                        key={exam.id}
                                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                                    >
                                        <div>
                                            <h4 className="font-medium">{exam.title}</h4>
                                            <p className="text-xs text-muted-foreground">
                                                {exam.is_active ? (
                                                    <span className="text-success">Active</span>
                                                ) : (
                                                    <span className="text-muted-foreground">Inactive</span>
                                                )}
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteExam(exam.id)}
                                            className="text-destructive hover:text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                {(!dashboard?.exams || dashboard.exams.length === 0) && (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No exams created yet
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Student Submissions Table */}
                <Card className="animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-success" />
                                    Student Submissions
                                </CardTitle>
                                <CardDescription>Recent exam submissions from students</CardDescription>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search submissions..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 w-full md:w-64"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {filteredSubmissions.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Student</TableHead>
                                        <TableHead>Exam</TableHead>
                                        <TableHead>Score</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredSubmissions.slice(0, 10).map((submission) => (
                                        <TableRow key={submission.id}>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{submission.student_name}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        @{submission.student_username}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{submission.exam_title}</TableCell>
                                            <TableCell>
                                                <span
                                                    className={`font-semibold ${(submission.percentage || 0) >= 70 ? "text-success" : (submission.percentage || 0) >= 40 ? "text-warning" : "text-destructive"
                                                        }`}
                                                >
                                                    {submission.percentage?.toFixed(0) || 0}%
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {submission.submitted_at
                                                    ? new Date(submission.submitted_at).toLocaleDateString()
                                                    : "N/A"}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => navigate(`/review/${submission.id}`)}
                                                >
                                                    Review
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                No submissions found
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>

            {/* Create Exam Modal */}
            {showCreateModal && (
                <CreateExamModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        setShowCreateModal(false);
                        fetchDashboard();
                    }}
                />
            )}
        </div>
    );
};

export default TeacherDashboard;
