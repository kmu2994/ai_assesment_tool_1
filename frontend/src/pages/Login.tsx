import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Brain, Volume2, Contrast, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { authApi, RegisterData } from "@/lib/api";
import { useAccessibility } from "@/hooks/useAccessibility";

const Login = () => {
    const navigate = useNavigate();
    const { textToSpeech, highContrast, toggleTextToSpeech, toggleHighContrast } = useAccessibility();

    const [role, setRole] = useState<"admin" | "teacher" | "student">("student");
    const [isLoading, setIsLoading] = useState(false);

    // Login form state
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");

    // Signup form state
    const [signupEmail, setSignupEmail] = useState("");
    const [signupPassword, setSignupPassword] = useState("");
    const [signupName, setSignupName] = useState("");
    const [signupUsername, setSignupUsername] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!loginEmail || !loginPassword) {
            toast.error("Please fill in all fields");
            return;
        }

        setIsLoading(true);
        try {
            const response = await authApi.login(loginEmail, loginPassword);

            // Validate that the selected role matches the user's actual role
            if (response.user.role !== role) {
                // Clear the session as the user should not be logged in with the wrong role selector
                authApi.logout();
                toast.error("Account type is invalid");
                return;
            }

            toast.success(`Welcome back, ${response.user.full_name || response.user.username}!`);

            // Navigate based on role
            if (response.user.role === 'admin') {
                navigate("/admin");
            } else if (response.user.role === 'teacher') {
                navigate("/teacher");
            } else {
                navigate("/dashboard");
            }
        } catch (error: unknown) {
            const err = error as { response?: { data?: { detail?: string } } };
            const message = err.response?.data?.detail || "Login failed. Please check your credentials.";
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!signupEmail || !signupPassword || !signupName || !signupUsername) {
            toast.error("Please fill in all fields");
            return;
        }

        setIsLoading(true);
        try {
            const data: RegisterData = {
                email: signupEmail,
                password: signupPassword,
                full_name: signupName,
                username: signupUsername,
                role: role,
                accessibility_mode: textToSpeech || highContrast,
            };

            await authApi.register(data);
            toast.success("Account created successfully! Please login.");

            // Auto-fill login form with username and password
            setLoginEmail(signupUsername);
            setLoginPassword(signupPassword);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { detail?: string } } };
            const message = err.response?.data?.detail || "Registration failed. Please try again.";
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4 relative">
            {/* Back Button */}
            <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="absolute top-4 left-4 gap-2 hover:bg-primary/20"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
            </Button>

            <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-center animate-fade-in">
                {/* Left Side - Branding */}
                <div className="text-center md:text-left space-y-6">
                    <div className="flex items-center justify-center md:justify-start gap-3">
                        <div className="bg-primary rounded-2xl p-3 shadow-lg">
                            <Brain className="h-8 w-8 text-primary-foreground" aria-hidden="true" />
                        </div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            AI Assessment Tool
                        </h1>
                    </div>
                    <p className="text-muted-foreground text-lg">
                        Fair, inclusive, and AI-powered skill assessment for everyone
                    </p>
                    <div className="space-y-3 pt-4">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-accent animate-pulse" aria-hidden="true" />
                            <span className="text-sm">Adaptive AI-driven questions</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-accent animate-pulse" aria-hidden="true" />
                            <span className="text-sm">Accessibility features built-in</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-accent animate-pulse" aria-hidden="true" />
                            <span className="text-sm">Real-time performance insights</span>
                        </div>
                    </div>
                </div>

                {/* Right Side - Login Form */}
                <Card className="shadow-2xl border-0 animate-scale-in">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl">Welcome</CardTitle>
                        <CardDescription>Sign in or create an account to continue</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {/* Accessibility Options */}
                            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                                <h3 className="text-sm font-medium">Accessibility Options</h3>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="tts" className="flex items-center gap-2 cursor-pointer">
                                        <Volume2 className="h-4 w-4 text-primary" aria-hidden="true" />
                                        Text-to-Speech
                                    </Label>
                                    <Switch
                                        id="tts"
                                        checked={textToSpeech}
                                        onCheckedChange={toggleTextToSpeech}
                                        aria-describedby="tts-description"
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="contrast" className="flex items-center gap-2 cursor-pointer">
                                        <Contrast className="h-4 w-4 text-primary" aria-hidden="true" />
                                        High Contrast
                                    </Label>
                                    <Switch
                                        id="contrast"
                                        checked={highContrast}
                                        onCheckedChange={toggleHighContrast}
                                        aria-describedby="contrast-description"
                                    />
                                </div>
                            </div>

                            {/* Role Selection */}
                            <div className="space-y-2">
                                <Label>Account Type</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(["student", "teacher", "admin"] as const).map((r) => (
                                        <Button
                                            key={r}
                                            type="button"
                                            variant={role === r ? "default" : "outline"}
                                            onClick={() => setRole(r)}
                                            className="capitalize"
                                            aria-pressed={role === r}
                                        >
                                            {r}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* Login/Signup Tabs */}
                            <Tabs defaultValue="login" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="login">Login</TabsTrigger>
                                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                                </TabsList>

                                <TabsContent value="login">
                                    <form onSubmit={handleLogin} className="space-y-4 pt-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="login-email">Email or Username</Label>
                                            <Input
                                                id="login-email"
                                                type="text"
                                                placeholder="name@example.com"
                                                value={loginEmail}
                                                onChange={(e) => setLoginEmail(e.target.value)}
                                                required
                                                autoComplete="username"
                                                aria-required="true"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="login-password">Password</Label>
                                            <Input
                                                id="login-password"
                                                type="password"
                                                placeholder="Enter your password"
                                                value={loginPassword}
                                                onChange={(e) => setLoginPassword(e.target.value)}
                                                required
                                                autoComplete="current-password"
                                                aria-required="true"
                                            />
                                        </div>
                                        <Button type="submit" className="w-full" disabled={isLoading}>
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Signing in...
                                                </>
                                            ) : (
                                                "Sign In"
                                            )}
                                        </Button>
                                    </form>
                                </TabsContent>

                                <TabsContent value="signup">
                                    <form onSubmit={handleSignup} className="space-y-4 pt-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="signup-name">Full Name</Label>
                                            <Input
                                                id="signup-name"
                                                type="text"
                                                placeholder="John Doe"
                                                value={signupName}
                                                onChange={(e) => setSignupName(e.target.value)}
                                                required
                                                autoComplete="name"
                                                aria-required="true"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="signup-username">Username</Label>
                                            <Input
                                                id="signup-username"
                                                type="text"
                                                placeholder="johndoe"
                                                value={signupUsername}
                                                onChange={(e) => setSignupUsername(e.target.value)}
                                                required
                                                autoComplete="username"
                                                aria-required="true"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="signup-email">Email</Label>
                                            <Input
                                                id="signup-email"
                                                type="email"
                                                placeholder="name@example.com"
                                                value={signupEmail}
                                                onChange={(e) => setSignupEmail(e.target.value)}
                                                required
                                                autoComplete="email"
                                                aria-required="true"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="signup-password">Password</Label>
                                            <Input
                                                id="signup-password"
                                                type="password"
                                                placeholder="Create a password (min 6 characters)"
                                                value={signupPassword}
                                                onChange={(e) => setSignupPassword(e.target.value)}
                                                required
                                                minLength={6}
                                                autoComplete="new-password"
                                                aria-required="true"
                                            />
                                        </div>
                                        <Button type="submit" className="w-full" disabled={isLoading}>
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Creating account...
                                                </>
                                            ) : (
                                                "Create Account"
                                            )}
                                        </Button>
                                    </form>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Login;
