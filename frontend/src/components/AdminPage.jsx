import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BarChart3, Users, MousePointerClick, Lock, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminPage = () => {
    const [code, setCode] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [analytics, setAnalytics] = useState(null);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_URL}/api/analytics/data`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code })
            });

            if (response.ok) {
                const data = await response.json();
                setAnalytics(data);
                setIsAuthenticated(true);
            } else {
                setError('Invalid admin code');
            }
        } catch (err) {
            setError('Failed to connect to server');
        } finally {
            setIsLoading(false);
        }
    };

    const maxVisits = analytics?.daily_stats?.length > 0 
        ? Math.max(...analytics.daily_stats.map(d => Math.max(d.visits, d.cta_clicks)), 1)
        : 1;

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto p-3 rounded-full bg-primary/10 w-fit mb-4">
                            <Lock className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle className="font-serif text-2xl">Admin Access</CardTitle>
                        <p className="text-sm text-muted-foreground mt-2">
                            Enter the admin code to view analytics
                        </p>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <Input
                                type="password"
                                placeholder="Enter admin code"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="text-center text-lg tracking-widest"
                            />
                            {error && (
                                <p className="text-destructive text-sm text-center">{error}</p>
                            )}
                            <Button 
                                type="submit" 
                                className="w-full"
                                disabled={isLoading || !code}
                            >
                                {isLoading ? 'Verifying...' : 'Access Dashboard'}
                            </Button>
                        </form>
                        <Button
                            variant="ghost"
                            className="w-full mt-4 text-muted-foreground"
                            onClick={() => navigate('/')}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Home
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-4 sm:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="font-serif text-3xl text-foreground">Analytics Dashboard</h1>
                        <p className="text-muted-foreground mt-1">Track visitor engagement</p>
                    </div>
                    <Button variant="outline" onClick={() => navigate('/')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Site
                    </Button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-lg bg-primary/10">
                                    <Users className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Visitors</p>
                                    <p className="text-3xl font-serif font-medium">
                                        {analytics?.total_visits?.toLocaleString() || 0}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-lg bg-success/10">
                                    <MousePointerClick className="h-6 w-6 text-success" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">CTA Clicks</p>
                                    <p className="text-3xl font-serif font-medium">
                                        {analytics?.total_cta_clicks?.toLocaleString() || 0}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Bar Chart */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-muted-foreground" />
                            <CardTitle className="font-serif text-xl">Daily Activity (Last 30 Days)</CardTitle>
                        </div>
                        <div className="flex items-center gap-6 mt-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-primary" />
                                <span className="text-sm text-muted-foreground">Visitors</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-success" />
                                <span className="text-sm text-muted-foreground">CTA Clicks</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {analytics?.daily_stats?.length > 0 ? (
                            <div className="space-y-2">
                                {analytics.daily_stats.map((day) => (
                                    <div key={day.date} className="flex items-center gap-4">
                                        <div className="w-24 text-xs text-muted-foreground font-mono">
                                            {day.date.slice(5)}
                                        </div>
                                        <div className="flex-1 flex gap-1">
                                            {/* Visits bar */}
                                            <div 
                                                className="h-6 bg-primary/80 rounded-sm flex items-center justify-end pr-2 min-w-[2px]"
                                                style={{ width: `${(day.visits / maxVisits) * 50}%` }}
                                            >
                                                {day.visits > 0 && (
                                                    <span className="text-xs text-primary-foreground font-medium">
                                                        {day.visits}
                                                    </span>
                                                )}
                                            </div>
                                            {/* CTA clicks bar */}
                                            <div 
                                                className="h-6 bg-success/80 rounded-sm flex items-center justify-end pr-2 min-w-[2px]"
                                                style={{ width: `${(day.cta_clicks / maxVisits) * 50}%` }}
                                            >
                                                {day.cta_clicks > 0 && (
                                                    <span className="text-xs text-success-foreground font-medium">
                                                        {day.cta_clicks}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No data yet. Analytics will appear as visitors arrive.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AdminPage;
