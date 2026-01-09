import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

export default function ForgotPassword() {
    const { register, handleSubmit, formState: { isSubmitting } } = useForm<{ email: string }>();
    const [isSent, setIsSent] = useState(false);

    const onSubmit = async (data: { email: string }) => {
        try {
            // Call mock reset endpoint
            // Note: Router uses query param, but let's try sending body or query.
            // Python endpoint: async def reset_password_mock(email: str) -> Query param by default in FastAPI if not typed as schema
            // So url?email=...
            await api.post(`/auth/reset-password?email=${encodeURIComponent(data.email)}`);
            setIsSent(true);
            toast.success("Reset link sent");
        } catch (error) {
            console.error(error);
            toast.error("Failed to send reset link");
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 py-12 px-4 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-foreground">
                    Reset your password
                </h2>
                <p className="mt-2 text-center text-sm text-foreground/80">
                    Or{' '}
                    <Link to="/login" className="font-medium text-primary hover:text-primary/80">
                        return to sign in
                    </Link>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-card px-4 py-8 shadow sm:rounded-lg sm:px-10 border border-border">
                    {isSent ? (
                        <div className="text-center space-y-4">
                            <div className="rounded-full bg-green-100 p-3 mx-auto w-12 h-12 flex items-center justify-center">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-foreground">Check your email</h3>
                            <p className="text-sm text-muted-foreground">
                                We've sent password reset instructions to your email address.
                            </p>
                            <div className="pt-4">
                                <Link to="/login" className="text-sm font-medium text-primary hover:text-primary/80">
                                    Return to login
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium leading-6 text-foreground">
                                    Email address
                                </label>
                                <div className="mt-2">
                                    <input
                                        id="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        {...register('email', { required: true })}
                                        className="block w-full rounded-md border-0 py-1.5 text-foreground shadow-sm ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-background"
                                    />
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex w-full justify-center rounded-md bg-primary px-3 py-1.5 text-sm font-semibold leading-6 text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
