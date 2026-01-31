import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Fingerprint, TrendingUp, Info, ShieldCheck, ShieldAlert } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

const UniquenessCard = ({ privacyData }) => {
    if (!privacyData) return null;
    
    const { totalItems, maxPossibleItems, privacyScore, assessment, trackability, breakdown } = privacyData;
    
    // Color based on privacy score
    const getColorClass = (score) => {
        if (score >= 80) return 'text-success';
        if (score >= 60) return 'text-warning';
        if (score >= 40) return 'text-warning';
        return 'text-destructive';
    };
    
    const getBgClass = (score) => {
        if (score >= 80) return 'bg-success/20';
        if (score >= 60) return 'bg-warning/20';
        if (score >= 40) return 'bg-warning/20';
        return 'bg-destructive/20';
    };
    
    const getTrackabilityColor = (level) => {
        switch (level) {
            case 'low': return 'text-success';
            case 'medium': return 'text-warning';
            case 'high': return 'text-destructive';
            case 'very-high': return 'text-destructive';
            default: return 'text-muted-foreground';
        }
    };
    
    // Get top exposed items for display
    const exposedItems = Object.entries(breakdown)
        .filter(([_, data]) => data.items > 0)
        .sort((a, b) => b[1].items - a[1].items)
        .slice(0, 5);
    
    return (
        <Card className="leak-card mb-8">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-lg ${getBgClass(privacyScore)}`}>
                            {privacyScore >= 60 ? (
                                <ShieldCheck className={`h-6 w-6 ${getColorClass(privacyScore)}`} />
                            ) : (
                                <ShieldAlert className={`h-6 w-6 ${getColorClass(privacyScore)}`} />
                            )}
                        </div>
                        <div>
                            <CardTitle className="font-serif text-xl text-foreground flex items-center gap-2">
                                Privacy Assessment
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <Info className="h-4 w-4 text-muted-foreground" />
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs">
                                            <p>
                                                We count how many identifying items of information your browser exposes.
                                                Fewer items = harder to track.
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                How trackable is your browser?
                            </p>
                        </div>
                    </div>
                    <Badge 
                        variant="outline" 
                        className={`${getColorClass(privacyScore)} border-current text-sm px-3 py-1`}
                    >
                        {assessment.label}
                    </Badge>
                </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
                {/* Main Assessment Message */}
                <div className={`p-4 rounded-lg border ${
                    trackability.level === 'low' || trackability.level === 'medium'
                        ? 'bg-success/5 border-success/30' 
                        : 'bg-destructive/5 border-destructive/30'
                }`}>
                    <p className={`text-lg font-medium ${getTrackabilityColor(trackability.level)}`}>
                        {trackability.message}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                        {trackability.detail}
                    </p>
                </div>

                {/* Privacy Score Bar */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Privacy Score</span>
                        <span className={`font-bold ${getColorClass(privacyScore)}`}>
                            {privacyScore}%
                        </span>
                    </div>
                    <Progress 
                        value={privacyScore} 
                        className="h-3 bg-muted"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Not Protected</span>
                        <span>Well Protected</span>
                    </div>
                </div>
                
                {/* Items Count */}
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div>
                        <p className="text-sm font-medium text-foreground">
                            Identifying Information Exposed
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Items websites can use to track you
                        </p>
                    </div>
                    <div className="text-right">
                        <p className={`text-2xl font-bold ${getColorClass(privacyScore)}`}>
                            {totalItems}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            of {maxPossibleItems} items
                        </p>
                    </div>
                </div>
                
                {/* Top Exposed Items */}
                {exposedItems.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <TrendingUp className="h-4 w-4" />
                            Exposed Information
                        </div>
                        <div className="space-y-2">
                            {exposedItems.map(([key, data]) => (
                                <div 
                                    key={key}
                                    className="flex items-center justify-between p-2 bg-muted/20 rounded-md"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-destructive" />
                                        <span className="text-sm text-foreground capitalize">
                                            {data.description}
                                        </span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {data.items} item{data.items > 1 ? 's' : ''}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {/* Simple Explanation */}
                <div className="text-xs text-muted-foreground border-t border-border pt-4">
                    <p>
                        <strong>What does this mean?</strong> Websites collect identifying information from your browser
                        to create a &quot;fingerprint&quot; that can track you. The more items exposed, the easier you are to track.
                        {totalItems > 10 
                            ? ' Your browser exposes many identifying details - consider using privacy tools.' 
                            : totalItems > 5 
                                ? ' Your browser has some protection but could be improved.' 
                                : ' Your browser is well protected against tracking.'
                        }
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};

export default UniquenessCard;
