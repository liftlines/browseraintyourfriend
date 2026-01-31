import React from 'react';
import { ShieldAlert, ShieldCheck, Loader2 } from 'lucide-react';

const Hero = ({ stats, isScanning, privacyData }) => {
    // Use privacy score from new system
    const privacyScore = privacyData?.privacyScore || 0;
    const isGood = privacyScore >= 50;
    
    return (
        <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
                {/* Main Heading */}
                <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-foreground leading-tight tracking-tight mb-6">
                    Your browser is leaking
                    <br />
                    <span className="text-muted-foreground italic">more than you think</span>
                </h1>
                
                {/* Subheading */}
                <p className="font-sans text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
                    Every website you visit can see detailed information about your device, 
                    location, and browsing habits. Discover what your browser reveals.
                </p>
                
                {/* Privacy Score Circle */}
                <div className="flex justify-center mb-8">
                    <div className="relative">
                        {/* Outer ring */}
                        <div className={`w-40 h-40 rounded-full border-4 ${
                            isScanning 
                                ? 'border-muted animate-pulse' 
                                : isGood 
                                    ? 'border-success/30' 
                                    : 'border-destructive/30'
                        } flex items-center justify-center transition-all duration-500`}>
                            {/* Inner content */}
                            <div className={`w-32 h-32 rounded-full ${
                                isScanning 
                                    ? 'bg-muted/20' 
                                    : isGood 
                                        ? 'bg-success/10' 
                                        : 'bg-destructive/10'
                            } flex flex-col items-center justify-center transition-all duration-500`}>
                                {isScanning ? (
                                    <>
                                        <Loader2 className="h-8 w-8 text-muted-foreground animate-spin mb-2" />
                                        <span className="text-sm text-muted-foreground font-sans">
                                            Scanning...
                                        </span>
                                    </>
                                ) : privacyData ? (
                                    <>
                                        {isGood ? (
                                            <ShieldCheck className="h-8 w-8 text-success mb-1" />
                                        ) : (
                                            <ShieldAlert className="h-8 w-8 text-destructive mb-1" />
                                        )}
                                        <span className={`text-3xl font-serif font-medium ${
                                            isGood ? 'text-success' : 'text-destructive'
                                        }`}>
                                            {privacyScore}%
                                        </span>
                                        <span className="text-xs text-muted-foreground font-sans mt-1">
                                            Privacy Score
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <ShieldAlert className="h-8 w-8 text-muted-foreground mb-2" />
                                        <span className="text-sm text-muted-foreground font-sans">
                                            Ready
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Stats Summary */}
                {stats && !isScanning && (
                    <div className="flex flex-col items-center gap-6 mb-8 opacity-0 fade-in">
                        <div className="flex justify-center gap-8 sm:gap-12">
                            <div className="text-center">
                                <div className="text-2xl font-serif text-destructive">
                                    {stats.leak}
                                </div>
                                <div className="text-xs text-muted-foreground font-sans uppercase tracking-wider mt-1">
                                    Exposed
                                </div>
                            </div>
                            <div className="w-px bg-border h-12 self-center" />
                            <div className="text-center">
                                <div className="text-2xl font-serif text-success">
                                    {stats.safe}
                                </div>
                                <div className="text-xs text-muted-foreground font-sans uppercase tracking-wider mt-1">
                                    Protected
                                </div>
                            </div>
                            <div className="w-px bg-border h-12 self-center" />
                            <div className="text-center">
                                <div className="text-2xl font-serif text-warning">
                                    {stats.warning}
                                </div>
                                <div className="text-xs text-muted-foreground font-sans uppercase tracking-wider mt-1">
                                    Warnings
                                </div>
                            </div>
                        </div>
                        
                        {/* Items summary */}
                        {privacyData && (
                            <div className="text-center px-4 py-2 bg-muted/30 rounded-full border border-border">
                                <span className="text-sm text-muted-foreground font-sans">
                                    Identifying items exposed: 
                                </span>
                                <span className={`text-sm font-medium ml-1 ${
                                    privacyData.totalItems <= 5 
                                        ? 'text-success' 
                                        : privacyData.totalItems <= 10
                                            ? 'text-warning'
                                            : 'text-destructive'
                                }`}>
                                    {privacyData.totalItems} of {privacyData.maxPossibleItems}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
};

export default Hero;
