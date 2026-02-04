import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, ExternalLink, ChevronRight, Rocket } from 'lucide-react';

const RecommendationsCard = ({ recommendations }) => {
    const hasRecommendations = recommendations && recommendations.length > 0;
    
    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high':
                return 'status-leak';
            case 'medium':
                return 'status-warning';
            default:
                return 'status-unknown';
        }
    };
    
    const getPriorityLabel = (priority) => {
        switch (priority) {
            case 'high':
                return 'High Priority';
            case 'medium':
                return 'Recommended';
            default:
                return 'Optional';
        }
    };
    
    return (
        <Card className="leak-card mb-8">
            <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-success/10">
                        <Shield className="h-6 w-6 text-success" />
                    </div>
                    <div>
                        <CardTitle className="font-serif text-xl text-foreground">
                            How to Protect Yourself
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            Actionable steps to improve your privacy
                        </p>
                    </div>
                </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
                {recommendations.map((rec, index) => (
                    <div 
                        key={index}
                        className="p-4 bg-muted/20 rounded-lg border border-border/50 hover:border-border transition-colors"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <Badge 
                                        variant="outline" 
                                        className={`${getPriorityColor(rec.priority)} text-xs`}
                                    >
                                        {getPriorityLabel(rec.priority)}
                                    </Badge>
                                </div>
                                <h4 className="font-medium text-foreground text-sm mb-1">
                                    {rec.title}
                                </h4>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    {rec.description}
                                </p>
                            </div>
                            {rec.link && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="shrink-0 text-muted-foreground hover:text-foreground"
                                    onClick={() => window.open(rec.link, '_blank')}
                                >
                                    <ExternalLink className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                ))}
                
                {/* General Tips */}
                <div className="mt-6 pt-4 border-t border-border">
                    <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                        <ChevronRight className="h-4 w-4" />
                        General Privacy Tips
                    </h4>
                    <ul className="space-y-2 text-xs text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <span className="text-success">•</span>
                            Use a privacy-focused browser like Brave, Firefox, or Tor
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-success">•</span>
                            Install uBlock Origin and Privacy Badger extensions
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-success">•</span>
                            Clear cookies and storage regularly
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-success">•</span>
                            Use private/incognito mode for sensitive browsing
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-success">•</span>
                            Consider using a VPN for IP address privacy
                        </li>
                    </ul>
                </div>
                
                {/* Logos CTA */}
                <div className="mt-6 pt-4 border-t border-border">
                    <div className="p-5 rounded-xl bg-gradient-to-br from-primary/5 via-accent/10 to-primary/5 border border-primary/20">
                        <div className="flex items-start gap-4">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Rocket className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-serif text-lg text-foreground mb-2">
                                    Want to escape browser hell altogether?
                                </h4>
                                <p className="text-sm text-muted-foreground mb-4">
                                    The browser was never designed with your privacy in mind. 
                                    Escape the surveillance web entirely with a new paradigm.
                                </p>
                                <Button
                                    variant="outline"
                                    className="border-primary/30 hover:bg-primary/10 text-foreground"
                                    onClick={() => window.open('https://logos.co', '_blank')}
                                >
                                    Escape with Logos
                                    <ExternalLink className="h-4 w-4 ml-2" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default RecommendationsCard;
