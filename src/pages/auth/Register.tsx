import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { cn } from '../../lib/utils';

export function Register() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState<'consumer' | 'creator'>('consumer');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            await api.post('/auth/register', {
                email,
                password,
                full_name: fullName,
                role
            });
            // On success, redirect to login
            navigate('/login');
        } catch (err: any) {
            console.error('Registration failed', err);
            setError(err.response?.data?.detail || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 py-12 px-4 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-foreground">
                    Create your account
                </h2>
                <p className="mt-2 text-center text-sm text-foreground/80">
                    Or{' '}
                    <Link to="/login" className="font-medium text-primary hover:text-primary/80">
                        sign in to your existing account
                    </Link>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-card px-4 py-8 shadow sm:rounded-lg sm:px-10 border border-border">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {/* Role Selection */}
                        <div>
                            <label className="text-sm font-medium text-foreground">I am a...</label>
                            <div className="mt-2 grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setRole('consumer')}
                                    className={cn(
                                        "flex items-center justify-center rounded-md border px-3 py-2 text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
                                        role === 'consumer'
                                            ? "bg-primary text-primary-foreground hover:bg-primary/90 border-transparent focus-visible:outline-primary"
                                            : "bg-background text-foreground ring-1 ring-inset ring-input hover:bg-accent"
                                    )}
                                >
                                    Viewer
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRole('creator')}
                                    className={cn(
                                        "flex items-center justify-center rounded-md border px-3 py-2 text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
                                        role === 'creator'
                                            ? "bg-primary text-primary-foreground hover:bg-primary/90 border-transparent focus-visible:outline-primary"
                                            : "bg-background text-foreground ring-1 ring-inset ring-input hover:bg-accent"
                                    )}
                                >
                                    Creator
                                </button>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="fullName" className="block text-sm font-medium leading-6 text-foreground">
                                Full Name
                            </label>
                            <div className="mt-2">
                                <input
                                    id="fullName"
                                    name="fullName"
                                    type="text"
                                    required
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="block w-full rounded-md border-0 py-1.5 text-foreground shadow-sm ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-background"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium leading-6 text-foreground">
                                Email address
                            </label>
                            <div className="mt-2">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full rounded-md border-0 py-1.5 text-foreground shadow-sm ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-background"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium leading-6 text-foreground">
                                Password
                            </label>
                            <div className="mt-2">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full rounded-md border-0 py-1.5 text-foreground shadow-sm ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-background"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-md bg-destructive/10 p-4">
                                <div className="flex">
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-destructive">{error}</h3>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex w-full justify-center rounded-md bg-primary px-3 py-1.5 text-sm font-semibold leading-6 text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
                            >
                                {isLoading ? 'Creating account...' : 'Sign up'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
