import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
    Globe, Video, Palette, Cpu, Code, Monitor, Type, Music,
    MapPin, Clock, EyeOff, Battery, Wifi, Info, Database, Camera,
    ChevronDown, ChevronUp, Shield, ShieldAlert, ShieldQuestion, AlertTriangle,
    HelpCircle
} from 'lucide-react';
import { getTestExplanation } from '@/utils/entropyCalculator';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

const iconMap = {
    globe: Globe,
    video: Video,
    palette: Palette,
    cpu: Cpu,
    code: Code,
    monitor: Monitor,
    type: Type,
    music: Music,
    mapPin: MapPin,
    clock: Clock,
    eyeOff: EyeOff,
    battery: Battery,
    wifi: Wifi,
    info: Info,
    database: Database,
    camera: Camera
};

const statusConfig = {
    safe: {
        label: 'Protected',
        icon: Shield,
        className: 'status-safe',
        description: 'This aspect of your privacy is protected'
    },
    leak: {
        label: 'Exposed',
        icon: ShieldAlert,
        className: 'status-leak',
        description: 'Your privacy is exposed in this area'
    },
    warning: {
        label: 'Caution',
        icon: AlertTriangle,
        className: 'status-warning',
        description: 'Potential privacy concern detected'
    },
    unknown: {
        label: 'Unknown',
        icon: ShieldQuestion,
        className: 'status-unknown',
        description: 'Could not determine status'
    }
};

const LeakCard = ({ data, index }) => {
    const [expanded, setExpanded] = useState(false);
    
    const Icon = iconMap[data.icon] || Info;
    const status = statusConfig[data.status] || statusConfig.unknown;
    const StatusIcon = status.icon;
    const explanation = getTestExplanation(data.id);
    
    const renderDetailValue = (key, value) => {
        if (value === null || value === undefined) return 'N/A';
        if (typeof value === 'boolean') return value ? 'Yes' : 'No';
        if (Array.isArray(value)) {
            if (value.length === 0) return 'None';
            return value.slice(0, 5).join(', ') + (value.length > 5 ? ` (+${value.length - 5} more)` : '');
        }
        if (typeof value === 'object') {
            return JSON.stringify(value, null, 2);
        }
        return String(value);
    };
    
    const formatKey = (key) => {
        return key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    };
    
    return (
        <Card 
            className={`leak-card opacity-0 fade-in stagger-${Math.min(index + 1, 10)} overflow-hidden`}
        >
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2 rounded-lg ${data.status === 'leak' ? 'bg-destructive/10' : data.status === 'safe' ? 'bg-success/10' : 'bg-muted'}`}>
                            <Icon className={`h-5 w-5 ${data.status === 'leak' ? 'text-destructive' : data.status === 'safe' ? 'text-success' : 'text-muted-foreground'}`} />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-1">
                                <h3 className="font-sans font-medium text-foreground text-sm">
                                    {data.name}
                                </h3>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="max-w-xs">
                                            <p className="text-xs">{explanation.what}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                                {data.summary}
                            </p>
                        </div>
                    </div>
                    <Badge 
                        variant="outline" 
                        className={`${status.className} border shrink-0 text-xs px-2 py-0.5`}
                    >
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status.label}
                    </Badge>
                </div>
            </CardHeader>
            
            <CardContent className="pt-0">
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between text-muted-foreground hover:text-foreground h-8 px-2"
                    onClick={() => setExpanded(!expanded)}
                >
                    <span className="text-xs">
                        {expanded ? 'Hide details' : 'Show details'}
                    </span>
                    {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
                
                {expanded && data.details && (
                    <div className="mt-3 p-3 bg-muted/30 rounded-lg border border-border/50 space-y-2 animate-fade-in">
                        {Object.entries(data.details).map(([key, value]) => (
                            <div key={key} className="flex justify-between items-start gap-4 text-xs">
                                <span className="text-muted-foreground font-medium shrink-0">
                                    {formatKey(key)}:
                                </span>
                                <span className="text-foreground text-right break-all font-mono">
                                    {renderDetailValue(key, value)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default LeakCard;
