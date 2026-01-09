import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const { login } = useAuth();
    const navigate = useNavigate();
    const [apiError, setApiError] = useState('');

    const onSubmit = async (data: any) => {
        try {
            // Need URLSearchParams for OAuth2PasswordRequestForm if used in backend? 
            // My backend uses OAuth2PasswordRequestForm which expects x-www-form-urlencoded 'username'/'password'.
            const formData = new URLSearchParams();
            formData.append('username', data.email);
            formData.append('password', data.password);

            const res = await api.post('/auth/login', formData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            const { data: userData } = await api.get('/auth/me', {
                headers: { Authorization: `Bearer ${res.data.access_token}` }
            });

            login(res.data.access_token, userData);

            // Intelligent Redirect
            if (userData.role === 'admin') {
                navigate('/admin');
            } else if (userData.role === 'creator') {
                navigate('/dashboard');
            } else {
                navigate('/explore');
            }
        } catch (err: any) {
            console.error('Login error:', err);
            if (!err.response) {
                setApiError('Network error. Is the backend running?');
            } else {
                setApiError(err.response?.data?.detail || 'Login failed');
            }
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8 p-8 bg-card rounded-lg shadow-md border border-border">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Sign in to VOD SaaS</h2>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    {apiError && (
                        <div className="p-3 text-sm text-destructive-foreground bg-destructive rounded-md">
                            {apiError}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground">Email address</label>
                            <input
                                type="email"
                                {...register('email', { required: 'Email is required' })}
                                className="mt-1 block w-full rounded-md border-input bg-background text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
                            />
                            {errors.email && <span className="text-xs text-destructive">{errors.email.message as string}</span>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground">Password</label>
                            <input
                                type="password"
                                {...register('password', { required: 'Password is required' })}
                                className="mt-1 block w-full rounded-md border-input bg-background text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
                            />
                            {errors.password && <span className="text-xs text-destructive">{errors.password.message as string}</span>}
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="text-sm">
                            <a href="/forgot-password" className="font-medium text-primary hover:text-primary/80">
                                Forgot your password?
                            </a>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="flex w-full justify-center rounded-md border border-transparent bg-primary py-2 px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                        Sign in
                    </button>

                    <div className="text-sm text-center">
                        <a href="/register" className="font-medium text-primary hover:text-primary/80">
                            Or register for free
                        </a>
                    </div>
                </form>
            </div>
        </div>
    );
}
