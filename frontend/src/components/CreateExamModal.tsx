import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Plus, Trash2, Loader2, Cpu, FileUp, Sparkles, BrainCircuit, Pencil } from "lucide-react";
import { examsApi, ExamCreate, QuestionCreate } from "@/lib/api";
import { toast } from "sonner";

interface CreateExamModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

const CreateExamModal = ({ onClose, onSuccess }: CreateExamModalProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState("manual");

    // --- Manual State ---
    const [examData, setExamData] = useState<ExamCreate>({
        title: "",
        description: "",
        is_adaptive: true,
        duration_minutes: 60,
        total_marks: 100,
        passing_score: 40,
        questions: []
    });

    const [newQuestion, setNewQuestion] = useState<QuestionCreate>({
        question_text: "",
        question_type: "mcq",
        difficulty: 0.5,
        points: 5,
        options: { A: "", B: "", C: "", D: "" },
        correct_answer: "",
        model_answer: ""
    });

    // --- AI Portal State (NVIDIA) ---
    const [aiParams, setAiParams] = useState({
        title: "",
        num_questions: 10,
        total_marks: 100,
        passing_score: 40,
        is_adaptive: true,
        difficulty_distribution: { easy: 0.3, medium: 0.4, hard: 0.3 },
        question_types: ["mcq", "descriptive"],
        instructions: ""
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleAIExamGeneration = async () => {
        if (!selectedFile) {
            toast.error("Please upload study material first");
            return;
        }
        if (!aiParams.title) {
            toast.error("Please enter an exam title");
            return;
        }

        setIsLoading(true);
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("num_questions", String(aiParams.num_questions));
        formData.append("difficulty_distribution", JSON.stringify(aiParams.difficulty_distribution));
        formData.append("question_types", JSON.stringify(aiParams.question_types));
        if (aiParams.instructions) {
            formData.append("instructions", aiParams.instructions);
        }

        try {
            const previewQuestions = await examsApi.previewExamAI(formData);

            // Sync state: move generated questions to manual list for review
            setExamData(prev => ({
                ...prev,
                title: aiParams.title,
                total_marks: aiParams.total_marks,
                passing_score: aiParams.passing_score,
                is_adaptive: aiParams.is_adaptive,
                questions: previewQuestions
            }));

            toast.success(`Successfully analyzed whole PDF. ${previewQuestions.length} questions generated for your review!`);
            setActiveTab("manual"); // Switch to manual tab so teacher can review
        } catch (error: any) {
            console.error("AI Generation Error:", error);
            const message = error.response?.data?.detail || error.message || "AI Analysis failed.";
            toast.error(message, {
                description: "Ensure your PDF has selectable text and is not a scanned image."
            });
        } finally {
            setIsLoading(false);
        }
    };

    const addQuestion = () => {
        if (!newQuestion.question_text.trim()) {
            toast.error("Please enter question text");
            return;
        }

        setExamData(prev => {
            if (editingIndex !== null) {
                // Update existing
                const updatedQuestions = [...prev.questions];
                updatedQuestions[editingIndex] = { ...newQuestion };
                return { ...prev, questions: updatedQuestions };
            } else {
                // Add new
                return { ...prev, questions: [...prev.questions, { ...newQuestion }] };
            }
        });

        setNewQuestion({
            question_text: "",
            question_type: "mcq",
            difficulty: 0.5,
            points: 5,
            options: { A: "", B: "", C: "", D: "" },
            correct_answer: "",
            model_answer: ""
        });

        toast.success(editingIndex !== null ? "Question updated" : "Question added");
        setEditingIndex(null);
    };

    const removeQuestion = (index: number) => {
        setExamData(prev => ({
            ...prev,
            questions: prev.questions.filter((_, i) => i !== index)
        }));
    };

    const handleManualSubmit = async () => {
        if (!examData.title.trim()) {
            toast.error("Please enter exam title");
            return;
        }
        if (examData.questions.length === 0) {
            toast.error("Please add at least one question");
            return;
        }

        setIsLoading(true);
        try {
            await examsApi.createExam(examData);
            toast.success("Exam created successfully!");
            onSuccess();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Failed to create exam");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <Card className="w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl border-primary/20 bg-card/95">
                <CardHeader className="flex flex-row items-center justify-between border-b shrink-0 bg-muted/30">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Plus className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl">Create New Assessment</CardTitle>
                            <CardDescription>Design manually or use NVIDIA AI to generate from notes</CardDescription>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-destructive/10 hover:text-destructive">
                        <X className="h-5 w-5" />
                    </Button>
                </CardHeader>

                <div className="flex-1 overflow-y-auto p-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-8 p-1 bg-muted/50 rounded-xl">
                            <TabsTrigger value="manual" className="rounded-lg gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                <Plus className="h-4 w-4" /> Manual Design
                            </TabsTrigger>
                            <TabsTrigger value="ai" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                <Cpu className="h-4 w-4" /> NVIDIA AI Portal
                                <span className="bg-background/20 text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-tighter ml-1">Beta</span>
                            </TabsTrigger>
                        </TabsList>

                        {/* Manual Tab */}
                        <TabsContent value="manual" className="space-y-8 animate-in slide-in-from-left-4 duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="space-y-2 lg:col-span-2">
                                    <Label>Exam Title</Label>
                                    <Input
                                        placeholder="e.g., Quantum Physics 101"
                                        value={examData.title}
                                        onChange={e => setExamData(p => ({ ...p, title: e.target.value }))}
                                        className="h-11"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Duration (Min)</Label>
                                    <Input
                                        type="number"
                                        value={examData.duration_minutes}
                                        onChange={e => setExamData(p => ({ ...p, duration_minutes: +e.target.value }))}
                                        className="h-11"
                                    />
                                </div>
                                <div className="space-y-2 lg:col-span-3">
                                    <Label>Description</Label>
                                    <Textarea
                                        placeholder="Summary of the assessment..."
                                        value={examData.description}
                                        onChange={e => setExamData(p => ({ ...p, description: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-6 p-4 bg-muted/30 rounded-xl border border-dashed">
                                <div className="flex items-center space-x-3">
                                    <Switch
                                        id="adaptive-manual"
                                        checked={examData.is_adaptive}
                                        onCheckedChange={v => setExamData(p => ({ ...p, is_adaptive: v }))}
                                    />
                                    <div className="space-y-0.5">
                                        <Label htmlFor="adaptive-manual" className="cursor-pointer">Adaptive Mode</Label>
                                        <p className="text-[10px] text-muted-foreground">Difficulty adjusts per student</p>
                                    </div>
                                </div>
                                <div className="h-8 w-[1px] bg-border mx-2" />
                                <div className="space-y-1 flex-1">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span>Passing Score Ratio</span>
                                        <span>{examData.passing_score}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        className="w-full"
                                        min="0"
                                        max="100"
                                        value={examData.passing_score}
                                        onChange={e => setExamData(p => ({ ...p, passing_score: +e.target.value }))}
                                    />
                                </div>
                            </div>

                            {/* Manual Question Form */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        <FileUp className="h-5 w-5 text-primary" />
                                        Question List ({examData.questions.length})
                                    </h3>
                                </div>

                                {examData.questions.length > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2">
                                        {examData.questions.map((q, idx) => (
                                            <div key={idx} className="p-3 border rounded-xl bg-card hover:border-primary/40 transition-colors relative group">
                                                <p className="font-medium text-sm line-clamp-2 pr-6">Q{idx + 1}: {q.question_text}</p>
                                                {q.question_type === 'mcq' ? (
                                                    <p className="text-[10px] mt-1 text-success font-semibold">Correct Answer: {q.correct_answer}</p>
                                                ) : (
                                                    <p className="text-[10px] mt-1 text-muted-foreground line-clamp-1 italic">Model Answer: {q.model_answer}</p>
                                                )}
                                                <div className="mt-2 flex gap-2">
                                                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase font-bold">{q.question_type}</span>
                                                    <span className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-full font-bold">Diff: {q.difficulty}</span>
                                                </div>
                                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            setNewQuestion(q);
                                                            setEditingIndex(idx);
                                                        }}
                                                        className="h-6 w-6 text-primary hover:bg-primary/10"
                                                    >
                                                        <Pencil className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            removeQuestion(idx);
                                                            if (editingIndex === idx) setEditingIndex(null);
                                                        }}
                                                        className="h-6 w-6 text-destructive hover:bg-destructive/10"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className={`p-5 border-2 rounded-2xl transition-all ${editingIndex !== null ? 'border-primary bg-primary/5 shadow-inner' : 'border-primary/10 bg-primary/5'}`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <Label className="uppercase text-[10px] font-bold tracking-widest text-primary">
                                            {editingIndex !== null ? `Editing Question #${editingIndex + 1}` : 'Add Instant Question'}
                                        </Label>
                                        {editingIndex !== null && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setEditingIndex(null);
                                                    setNewQuestion({
                                                        question_text: "",
                                                        question_type: "mcq",
                                                        difficulty: 0.5,
                                                        points: 5,
                                                        options: { A: "", B: "", C: "", D: "" },
                                                        correct_answer: "",
                                                        model_answer: ""
                                                    });
                                                }}
                                                className="h-6 text-[10px] uppercase font-bold"
                                            >
                                                Cancel Edit
                                            </Button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs">Question Text</Label>
                                            <Textarea
                                                placeholder="Type your question text here..."
                                                value={newQuestion.question_text}
                                                onChange={e => setNewQuestion(p => ({ ...p, question_text: e.target.value }))}
                                                className="bg-background h-[100px]"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs">{newQuestion.question_type === 'mcq' ? 'Options & Correct Answer' : 'Model Answer (AI will use this for grading)'}</Label>
                                            {newQuestion.question_type === 'mcq' ? (
                                                <div className="space-y-2">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <Input
                                                            placeholder="Opt A"
                                                            className="h-8 text-[10px]"
                                                            value={newQuestion.options?.A || ''}
                                                            onChange={e => setNewQuestion(p => ({ ...p, options: { ...p.options, A: e.target.value } }))}
                                                        />
                                                        <Input
                                                            placeholder="Opt B"
                                                            className="h-8 text-[10px]"
                                                            value={newQuestion.options?.B || ''}
                                                            onChange={e => setNewQuestion(p => ({ ...p, options: { ...p.options, B: e.target.value } }))}
                                                        />
                                                        <Input
                                                            placeholder="Opt C"
                                                            className="h-8 text-[10px]"
                                                            value={newQuestion.options?.C || ''}
                                                            onChange={e => setNewQuestion(p => ({ ...p, options: { ...p.options, C: e.target.value } }))}
                                                        />
                                                        <Input
                                                            placeholder="Opt D"
                                                            className="h-8 text-[10px]"
                                                            value={newQuestion.options?.D || ''}
                                                            onChange={e => setNewQuestion(p => ({ ...p, options: { ...p.options, D: e.target.value } }))}
                                                        />
                                                    </div>
                                                    <Input
                                                        placeholder="Correct Option (A, B, C, or D)"
                                                        className="h-9 text-xs border-success/50"
                                                        value={newQuestion.correct_answer || ''}
                                                        onChange={e => setNewQuestion(p => ({ ...p, correct_answer: e.target.value.toUpperCase() }))}
                                                    />
                                                </div>
                                            ) : (
                                                <Textarea
                                                    placeholder="Expected answer key points..."
                                                    value={newQuestion.model_answer || ''}
                                                    onChange={e => setNewQuestion(p => ({ ...p, model_answer: e.target.value }))}
                                                    className="bg-background h-[100px]"
                                                />
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-4 mt-4">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="space-y-1.5">
                                                <Label className="text-xs">Type</Label>
                                                <select
                                                    className="w-full h-9 rounded-lg border bg-background px-2 text-xs"
                                                    value={newQuestion.question_type}
                                                    onChange={e => setNewQuestion(p => ({ ...p, question_type: e.target.value as any }))}
                                                >
                                                    <option value="mcq">MCQ</option>
                                                    <option value="descriptive">Descriptive</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs">Points</Label>
                                                <Input
                                                    type="number"
                                                    className="h-9 text-xs"
                                                    value={newQuestion.points}
                                                    onChange={e => setNewQuestion(p => ({ ...p, points: +e.target.value }))}
                                                />
                                            </div>
                                            <div className="space-y-1.5 col-span-2">
                                                <Label className="text-xs">Difficulty (0.1 - 1.0)</Label>
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="range"
                                                        className="flex-1"
                                                        min="0.1"
                                                        max="1"
                                                        step="0.1"
                                                        value={newQuestion.difficulty}
                                                        onChange={e => setNewQuestion(p => ({ ...p, difficulty: +e.target.value }))}
                                                    />
                                                    <span className="text-xs font-mono">{newQuestion.difficulty}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <Button onClick={addQuestion} className="w-full h-11 bg-primary/20 hover:bg-primary text-primary hover:text-white border-primary/20 transition-all font-bold">
                                            {editingIndex !== null ? 'Save Changes to Question' : 'Confirm & Add to List'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* AI Tab */}
                        <TabsContent value="ai" className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Left Side: Config */}
                                <div className="space-y-6">
                                    <div className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl border border-primary/20 space-y-4 relative overflow-hidden">
                                        <Sparkles className="absolute -top-4 -right-4 h-24 w-24 text-primary/5 rotate-12" />
                                        <h3 className="text-lg font-bold flex items-center gap-2">
                                            <BrainCircuit className="h-6 w-6 text-primary" />
                                            NVIDIA Exam Intelligence
                                        </h3>
                                        <div className="space-y-2">
                                            <Label>Exam Title</Label>
                                            <Input
                                                placeholder="e.g., Module 4: Cellular Biology"
                                                className="bg-background/50 h-11"
                                                value={aiParams.title}
                                                onChange={e => setAiParams(p => ({ ...p, title: e.target.value }))}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>No. of Questions</Label>
                                                <Input
                                                    type="number"
                                                    className="bg-background/50 h-11"
                                                    value={aiParams.num_questions}
                                                    onChange={e => setAiParams(p => ({ ...p, num_questions: +e.target.value }))}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Total Marks</Label>
                                                <Input
                                                    type="number"
                                                    className="bg-background/50 h-11"
                                                    value={aiParams.total_marks}
                                                    onChange={e => setAiParams(p => ({ ...p, total_marks: +e.target.value }))}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 p-6 border rounded-2xl bg-muted/20">
                                        <Label className="text-sm font-semibold">Difficulty Distribution</Label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {Object.entries(aiParams.difficulty_distribution).map(([level, val]) => (
                                                <div key={level} className="space-y-1.5 text-center">
                                                    <div className="text-[10px] uppercase font-bold text-muted-foreground">{level}</div>
                                                    <Input
                                                        type="number"
                                                        step="0.1"
                                                        className="text-center h-10 font-mono"
                                                        value={val}
                                                        onChange={e => setAiParams(p => ({
                                                            ...p,
                                                            difficulty_distribution: { ...p.difficulty_distribution, [level]: +e.target.value }
                                                        }))}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-[10px] text-muted-foreground italic">AI uses NVIDIA Embeddings to tag and variant questions based on this ratio.</p>
                                    </div>

                                    <div className="space-y-3 p-6 border rounded-2xl bg-primary/5">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Sparkles className="h-4 w-4 text-primary" />
                                            <Label className="text-sm font-semibold">Custom AI Context (Optional)</Label>
                                        </div>
                                        <Textarea
                                            placeholder="Example: focus more on 'Memory Management' or 'make questions suitable for beginners'..."
                                            value={aiParams.instructions}
                                            onChange={e => setAiParams(p => ({ ...p, instructions: e.target.value }))}
                                            className="bg-background min-h-[120px] text-xs border-primary/20 focus:border-primary"
                                        />
                                        <p className="text-[10px] text-muted-foreground">This context is directly fed into the NVIDIA NIM model to personalize generation.</p>
                                    </div>
                                </div>

                                {/* Right Side: Upload */}
                                <div className="space-y-6">
                                    <Label className="text-sm font-semibold">Upload Study Material</Label>
                                    <div className="relative group">
                                        <input
                                            type="file"
                                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                            onChange={handleFileChange}
                                            accept=".pdf,.docx,.txt"
                                        />
                                        <div className={`h-[280px] border-2 border-dashed rounded-3xl flex flex-col items-center justify-center p-8 transition-all ${selectedFile ? 'border-primary bg-primary/5' : 'border-muted-foreground/20 group-hover:border-primary/50 group-hover:bg-primary/5'}`}>
                                            <div className={`p-5 rounded-2xl mb-4 transition-transform group-hover:scale-110 ${selectedFile ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                                                <FileUp className="h-10 w-10" />
                                            </div>
                                            <p className="font-semibold text-center">{selectedFile ? selectedFile.name : "Drag & Drop Study Notes"}</p>
                                            <p className="text-xs text-muted-foreground mt-2">Supports PDF, DOCX, TXT (Max 20MB)</p>
                                            {selectedFile && (
                                                <div className="mt-4 flex gap-2">
                                                    <span className="text-[10px] bg-primary/20 text-primary px-3 py-1 rounded-full font-bold">READY TO EXTRACT</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="flex-1 flex items-center space-x-3 p-4 border rounded-2xl bg-card">
                                            <Switch
                                                id="ai-adaptive"
                                                checked={aiParams.is_adaptive}
                                                onCheckedChange={v => setAiParams(p => ({ ...p, is_adaptive: v }))}
                                            />
                                            <Label htmlFor="ai-adaptive">Adaptive (NVIDIA NIM)</Label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                <CardHeader className="border-t shrink-0 flex flex-row items-center justify-end gap-3 bg-muted/30 p-4">
                    <Button variant="outline" onClick={onClose} disabled={isLoading} className="rounded-xl h-11 px-6">Cancel</Button>
                    {activeTab === "manual" ? (
                        <Button onClick={handleManualSubmit} disabled={isLoading} className="rounded-xl h-11 px-8 min-w-[160px] shadow-lg shadow-primary/20">
                            {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "Publish Manual Exam"}
                        </Button>
                    ) : (
                        <Button
                            onClick={handleAIExamGeneration}
                            disabled={isLoading || !selectedFile}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 shadow-lg shadow-blue-500/20 py-6"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Analyzing PDF & Generating Questions...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="mr-2 h-5 w-5" />
                                    Generate via NVIDIA
                                </>
                            )}
                        </Button>
                    )}
                </CardHeader>
            </Card>
        </div>
    );
};

export default CreateExamModal;
