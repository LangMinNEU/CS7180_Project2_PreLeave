import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authSchema, type AuthFormData } from "../schemas/authSchema";

export const AuthPage: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<AuthFormData>({
        resolver: zodResolver(authSchema),
    });

    const onSubmit = async (data: AuthFormData) => {
        // Simulate API call
        console.log("Form data:", data);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        alert(`${isLogin ? "Logged in" : "Signed up"} successfully!`);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        {isLogin ? "Log in to your account" : "Create a new account"}
                    </h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    <div className="rounded-md shadow-sm space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email address
                            </label>
                            <input
                                id="email"
                                type="email"
                                autoComplete="email"
                                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm mt-1"
                                placeholder="Email address"
                                {...register("email")}
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-600" role="alert">
                                    {errors.email.message}
                                </p>
                            )}
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                autoComplete="current-password"
                                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm mt-1"
                                placeholder="Password"
                                {...register("password")}
                            />
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-600" role="alert">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                        >
                            {isSubmitting ? "Processing..." : isLogin ? "Log in" : "Sign up"}
                        </button>
                    </div>
                </form>

                <div className="text-center mt-4">
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-sm text-blue-600 hover:text-blue-500"
                    >
                        {isLogin
                            ? "Don't have an account? Sign up"
                            : "Already have an account? Log in"}
                    </button>
                </div>
            </div>
        </div>
    );
};
