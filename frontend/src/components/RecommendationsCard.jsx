import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, ExternalLink, ChevronRight, Rocket } from 'lucide-react';
import { trackCtaClick } from '@/App';

const RecommendationsCard = () => {
    const handleCtaClick = () => {
        trackCtaClick();
        window.open('https://logos.co', '_blank');
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
                            Tips to improve your browser privacy
                        </p>
                    </div>
                </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
                {/* General Tips */}
                <div>
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
                        <li className="flex items-start gap-2">
                            <span className="text-success">•</span>
                            Disable WebRTC in browser settings to prevent IP leaks
                        </li>
                    </ul>
                </div>
                
                {/* Logos CTA */}
                <div className="mt-6 pt-6 border-t border-border">
                    <div className="p-6 rounded-xl bg-gradient-to-br from-primary/10 via-accent/15 to-primary/10 border border-primary/30">
                        <div className="flex flex-col items-center text-center">
                            <div className="p-3 rounded-full bg-primary/20 mb-4">
                                <Rocket className="h-8 w-8 text-primary" />
                            </div>
                            <h4 className="font-serif text-2xl text-foreground mb-3">
                                Want to escape browser hell altogether?
                            </h4>
                            <p className="text-sm text-muted-foreground mb-2 max-w-lg">
                                Web3 was meant to be trustless, yet browsers remain a central point of risk 
                                in today's decentralized ecosystem—leaking your identity, tracking your activity, 
                                and undermining the privacy you deserve.
                            </p>
                            <p className="text-sm text-muted-foreground mb-6 max-w-lg">
                                The browser was never designed with your privacy in mind. 
                                Escape the surveillance web entirely with a new paradigm.
                            </p>
                            <Button
                                size="lg"
                                className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-8 py-6 text-base"
                                onClick={handleCtaClick}
                            >
                                Escape with Logos
                                <ExternalLink className="h-5 w-5 ml-2" />
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default RecommendationsCard;
