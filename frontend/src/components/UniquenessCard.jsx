import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Fingerprint, Users, TrendingUp, Info } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

const UniquenessCard = ({ entropy }) => {
    if (!entropy) return null;
    
    const { totalBits, uniqueness, usersWithSameFingerprint, breakdown } = entropy;
    
    // Calculate percentage for visual (max out at 40 bits for UI purposes)
    const maxBits = 40;
    const percentage = Math.min((totalBits / maxBits) * 100, 100);
    
    // Color based on uniqueness level
    const getColorClass = (level) => {
        switch (level) {
            case 'unique':
            case 'rare':
                return 'text-destructive';
            case 'uncommon':
                return 'text-warning';
            case 'common':
            case 'anonymous':
                return 'text-success';
            default:
                return 'text-muted-foreground';
        }
    };
    
    const getBgClass = (level) => {
        switch (level) {
            case 'unique':
            case 'rare':
                return 'bg-destructive/20';
            case 'uncommon':
                return 'bg-warning/20';
            case 'common':
            case 'anonymous':
                return 'bg-success/20';
            default:
                return 'bg-muted';
        }
    };
    
    // Get top contributing factors
    const topFactors = Object.entries(breakdown)
        .filter(([_, data]) => data.bits > 0)
        .sort((a, b) => b[1].bits - a[1].bits)
        .slice(0, 5);
    
    return (
        <Card className="leak-card mb-8">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-lg ${getBgClass(uniqueness.level)}`}>
                            <Fingerprint className={`h-6 w-6 ${getColorClass(uniqueness.level)}`} />
                        </div>
                        <div>
                            <CardTitle className="font-serif text-xl text-foreground flex items-center gap-2">
                                Browser Fingerprint Uniqueness
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <Info className="h-4 w-4 text-muted-foreground" />
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs">
                                            <p>
                                                Entropy measures how unique your browser fingerprint is.
                                                Higher bits = more unique = easier to track.
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                How identifiable is your browser?
                            </p>
                        </div>
                    </div>
                    <Badge 
                        variant="outline" 
                        className={`${getColorClass(uniqueness.level)} border-current text-sm px-3 py-1`}
                    >
                        {uniqueness.label}
                    </Badge>
                </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
                {/* Entropy Score */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Identifying Information</span>
                        <span className={`font-mono font-bold ${getColorClass(uniqueness.level)}`}>
                            {totalBits.toFixed(1)} bits of entropy
                        </span>
                    </div>
                    <Progress 
                        value={percentage} 
                        className="h-2 bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                        {uniqueness.description}
                    </p>
                </div>
                
                {/* Matching Users */}
                <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                    <Users className="h-8 w-8 text-muted-foreground" />
                    <div>
                        <p className="text-sm font-medium text-foreground">
                            Your fingerprint matches
                        </p>
                        <p className={`text-lg font-serif ${getColorClass(uniqueness.level)}`}>
                            {usersWithSameFingerprint}
                        </p>
                    </div>
                </div>
                
                {/* Top Contributing Factors */}
                {topFactors.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <TrendingUp className="h-4 w-4" />
                            Top Identifying Factors
                        </div>
                        <div className="space-y-2">
                            {topFactors.map(([key, data]) => (
                                <div 
                                    key={key}
                                    className="flex items-center justify-between p-2 bg-muted/20 rounded-md"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${
                                            data.impact === 'high' ? 'bg-destructive' :
                                            data.impact === 'medium' ? 'bg-warning' :
                                            'bg-muted-foreground'
                                        }`} />
                                        <span className="text-sm text-foreground capitalize">
                                            {key.replace(/([A-Z])/g, ' $1').trim()}
                                        </span>
                                    </div>
                                    <span className="text-xs font-mono text-muted-foreground">
                                        +{data.bits} bits
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {/* Explanation */}
                <div className="text-xs text-muted-foreground border-t border-border pt-4">
                    <p>
                        <strong>What is entropy?</strong> Entropy measures uniqueness in bits. 
                        Each bit doubles the number of possible fingerprints. With {totalBits.toFixed(1)} bits, 
                        your browser is one of approximately {Math.pow(2, Math.round(totalBits)).toLocaleString()} possible combinations.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};

export default UniquenessCard;
