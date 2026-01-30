import React from 'react';
import LeakCard from './LeakCard';
import { Skeleton } from '@/components/ui/skeleton';

const ResultsGrid = ({ results, isLoading }) => {
    if (isLoading) {
        return (
            <section className="px-4 sm:px-6 lg:px-8 pb-16">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {[...Array(16)].map((_, i) => (
                            <div key={i} className="leak-card p-4 space-y-3">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-10 w-10 rounded-lg" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-3 w-32" />
                                    </div>
                                </div>
                                <Skeleton className="h-8 w-full" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }
    
    if (!results || Object.keys(results).length === 0) {
        return null;
    }
    
    // Group results by status
    const grouped = {
        leak: [],
        warning: [],
        safe: [],
        unknown: []
    };
    
    Object.entries(results).forEach(([id, data]) => {
        const status = data.status || 'unknown';
        if (grouped[status]) {
            grouped[status].push({ id, ...data });
        } else {
            grouped.unknown.push({ id, ...data });
        }
    });
    
    // Combine in order: leaks first, then warnings, then safe, then unknown
    const orderedResults = [
        ...grouped.leak,
        ...grouped.warning,
        ...grouped.safe,
        ...grouped.unknown
    ];
    
    return (
        <section className="px-4 sm:px-6 lg:px-8 pb-16">
            <div className="max-w-6xl mx-auto">
                {/* Section Header */}
                <div className="mb-8 text-center">
                    <h2 className="font-serif text-2xl sm:text-3xl text-foreground mb-3">
                        Privacy Analysis Results
                    </h2>
                    <p className="font-sans text-sm text-muted-foreground max-w-xl mx-auto">
                        Click on any card to see detailed information about what data is being exposed.
                    </p>
                </div>
                
                {/* Results Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {orderedResults.map((result, index) => (
                        <LeakCard 
                            key={result.id} 
                            data={result} 
                            index={index}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ResultsGrid;
