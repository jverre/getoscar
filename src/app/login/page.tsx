"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import { AlertCircle } from "lucide-react";

const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LoginPage() {
    const [className] = useState("");
    const router = useRouter();
    const [loginError, setLoginError] = useState<string | null>(null);

    // Check session on mount
    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
                router.push("/");
            }
        });
    }, [router]);
    
    const getURL = () => {
        const origin = window.location.origin
        // Make sure to include a trailing `/`
        return origin.endsWith('/') ? origin : `${origin}/`
    }

    const handleGoogleLogin = async () => {
        try {
            setLoginError(null);
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options:
                {
                    // Ensure window is defined (runs client-side)
                    redirectTo: getURL()
                }
            });
            if (error) throw error;
        } catch (error) {
            console.error('Error logging in with Google:', error);
        }
    };

    const handleGithubLogin = async () => {
        try {
            setLoginError(null);
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'github',
                options:
                {
                    redirectTo: getURL()
                }
            });
            if (error) throw error;
        } catch (error) {
            console.error('Error logging in with GitHub:', error);
        }
    };

    const handlePasswordLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault(); // Prevent default form submission
        setLoginError(null);

        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        if (!email || !password) {
            setLoginError("Email and password are required.");
            return;
        }

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) {
                if (error.message === "Invalid login credentials") {
                    setLoginError("Invalid email or password."); // Set user-friendly error
                } else {
                    setLoginError("Login failed. Please try again."); // Set generic error
                } throw error;
            } else {
                // Successful login! Supabase handles session cookies.
                // The middleware should now detect the session and redirect
                // or the useEffect hook (if kept) might trigger a redirect.
                // Optionally, force a page refresh or router push if middleware isn't catching it immediately
                router.push('/'); // Or refresh: router.refresh(); window.location.reload();
            }
        } catch {
            if (!loginError) { // Avoid overwriting specific error message
                setLoginError("An unexpected error occurred.");
            }
        }
    };

    return (
        <div className={cn("flex h-full flex-col items-center justify-center gap-6 p-4", className)}>
            <Card className="w-full max-w-2xl overflow-hidden p-0"> {/* Added max-width */}
                <CardContent className="grid p-0 md:grid-cols-2">
                    <div className="p-6 md:p-8">
                        <div className="flex flex-col gap-6">
                            <div className="flex flex-col items-center text-center">
                                <h1 className="text-2xl font-bold">Welcome back</h1>
                            </div>
                            {/* Note: This form currently lacks an onSubmit handler */}
                            <form onSubmit={handlePasswordLogin}>
                                <div className="grid gap-3">
                                    <div className="grid gap-3">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            name="email" // Added name attribute
                                            type="email"
                                            placeholder="m@example.com"
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <div className="flex items-center">
                                            <Label htmlFor="password">Password</Label>
                                            {/* TODO: Implement password reset */}
                                            <Link
                                                href="#"
                                                className="ml-auto text-sm underline-offset-2 hover:underline"
                                            >
                                                Forgot your password?
                                            </Link>
                                        </div>
                                        <Input id="password" name="password" type="password" required /> {/* Added name attribute */}
                                    </div>
                                </div>

                                {loginError && (
                                    <div className="mt-4 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 p-3 flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" aria-hidden="true" />
                                        <div className="flex-1 text-sm text-red-600 dark:text-red-400">
                                            <p className="font-medium leading-tight">Authentication failed</p>
                                            <p className="text-red-600/90 dark:text-red-400/90">{loginError}</p>
                                        </div>
                                    </div>
                                )}
                                <Button type="submit" className="mt-6 w-full"> {/* Increased top margin */}
                                    Login
                                </Button>
                            </form>
                            <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                                <span className="relative z-10 bg-background px-2 text-muted-foreground">
                                    Or continue with
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Button variant="outline" className="w-full" onClick={handleGoogleLogin}>
                                    <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"> {/* Added size and margin */}
                                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                                        <path fill="none" d="M0 0h48v48H0z"></path>
                                    </svg>
                                    Google {/* Added text */}
                                </Button>
                                <Button variant="outline" className="w-full" onClick={handleGithubLogin}>
                                    <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"> {/* Added size and margin */}
                                        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                                    </svg>
                                    GitHub {/* Added text */}
                                </Button>
                            </div>
                            <div className="text-center text-sm">
                                Don&apos;t have an account?{" "}
                                {/* Use Next.js Link for internal navigation */}
                                <Link href="/signup" className="underline underline-offset-4">
                                    Sign up
                                </Link>
                            </div>
                        </div>
                    </div>
                    {/* Kept placeholder image section */}
                    <div className="relative hidden bg-muted md:block">
                        <img
                            src="/placeholder.svg" // Assuming this path is valid in chat-app
                            alt="Image"
                            className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                        />
                    </div>
                </CardContent>
            </Card>
            <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
                {/* TODO: Update links if necessary */}
                By clicking continue, you agree to our <Link href="#">Terms of Service</Link>{" "}
                and <Link href="#">Privacy Policy</Link>.
            </div>
        </div>
    );
}
