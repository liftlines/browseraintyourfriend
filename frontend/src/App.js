import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import ResultsGrid from '@/components/ResultsGrid';
import RecommendationsCard from '@/components/RecommendationsCard';
import Footer from '@/components/Footer';
import { runAllTests } from '@/utils/privacyTests';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

const HomePage = () => {
    const [results, setResults] = useState(null);
    const [isScanning, setIsScanning] = useState(true);
    const [stats, setStats] = useState(null);
    
    const calculateStats = useCallback((results) => {
        if (!results) return null;
        
        const values = Object.values(results);
        return {
            total: values.length,
            leak: values.filter(r => r.status === 'leak').length,
            safe: values.filter(r => r.status === 'safe').length,
            warning: values.filter(r => r.status === 'warning').length,
            unknown: values.filter(r => r.status === 'unknown').length
        };
    }, []);
    
    const runScan = useCallback(async () => {
        setIsScanning(true);
        setResults(null);
        setStats(null);
        
        toast.info('Starting privacy scan...', {
            description: 'Analyzing your browser fingerprint'
        });
        
        try {
            const testResults = await runAllTests();
            setResults(testResults);
            
            const newStats = calculateStats(testResults);
            setStats(newStats);
            
            if (newStats.leak > newStats.safe) {
                toast.error(`${newStats.leak} privacy leaks detected`);
            } else if (newStats.leak > 0) {
                toast.warning(`${newStats.leak} potential exposures found`);
            } else {
                toast.success('Great privacy posture!', {
                    description: 'Your browser is well protected'
                });
            }
        } catch (error) {
            console.error('Scan failed:', error);
            toast.error('Scan failed', {
                description: 'Please try refreshing the page'
            });
        } finally {
            setIsScanning(false);
        }
    }, [calculateStats]);
    
    useEffect(() => {
        // Run scan on mount
        runScan();
    }, [runScan]);
    
    return (
        <div className="min-h-screen bg-background">
            <Header onRefresh={runScan} isScanning={isScanning} />
            <main>
                <Hero stats={stats} isScanning={isScanning} />
                
                <ResultsGrid results={results} isLoading={isScanning} />
                
                {/* Privacy Tips & Logos CTA - Always shows after scanning */}
                {!isScanning && (
                    <section className="px-4 sm:px-6 lg:px-8 pb-8">
                        <div className="max-w-6xl mx-auto">
                            <RecommendationsCard />
                        </div>
                    </section>
                )}
            </main>
            <Footer />
            <Toaster 
                position="bottom-right"
                toastOptions={{
                    className: 'bg-card border-border text-foreground',
                }}
            />
        </div>
    );
};

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<HomePage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
