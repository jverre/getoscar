"use client"

import Link from 'next/link';
import { createBrowserClient } from "@supabase/ssr";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuthActions } from "@convex-dev/auth/react";

const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);


export default function AuthPage() {
    const { signIn } = useAuthActions();
    
    // const getURL = () => {
    //     const origin = window.location.origin
    //     // Make sure to include a trailing `/`
    //     return origin.endsWith('/') ? origin : `${origin}/`
    // }

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-50 p-4">
            {/* Back Link as Button */}
            <div className="absolute left-4 top-4">
                <Link href="/" passHref>
                    <Button variant="ghost" size="lg" className="text-gray-600 hover:text-gray-900">
                        &larr; Back to Chat
                    </Button>
                </Link>
            </div>

            <div className="w-full max-w-sm text-center">
                {/* Welcome Header */}
                <h1 className="mb-2 text-3xl font-bold text-gray-900">
                    Welcome to Oscar
                </h1>

                {/* Subtext */}
                <p className="mb-6 text-gray-600">
                    Sign in below to save your chats
                </p>

                {/* Sign in Button */}
                <button
                    onClick={() => void signIn("google")}
                    className="mb-6 flex w-full items-center justify-center gap-2 rounded-md bg-purple-600 px-4 py-3 font-semibold text-white shadow-md transition hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                >
                    <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"> {/* Added size and margin */}
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                        <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                    Continue with Google
                </button>

                {/* Legal Text */}
                <p className="text-xs text-gray-500">
                    This page was inspired by{' '}
                    <a
                        href="https://t3.chat"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-gray-700"
                    >
                        T3 Chat
                    </a>{' '}
                    - if you are looking for a real chat app try them first!
                </p>
            </div>
        </div>
    );
}