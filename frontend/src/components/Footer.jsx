import React from 'react';
import { Shield, Heart } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="border-t border-border bg-card/30 mt-16">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-muted-foreground" />
                        <span className="font-serif text-foreground">
                            Browser<span className="text-muted-foreground">ain&apos;t</span>yourfriend
                        </span>
                    </div>
                    
                    {/* Info */}
                    <div className="text-center md:text-right">
                        <p className="text-sm text-muted-foreground font-sans mb-2">
                            All tests run locally in your browser. No data is sent to any server.
                        </p>
                        <p className="text-xs text-muted-foreground/60 font-sans flex items-center justify-center md:justify-end gap-1">
                            Made with <Heart className="h-3 w-3 text-destructive" /> for privacy awareness by{' '}
                            <a 
                                href="https://x.com/liftlines" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                                @liftlines
                            </a>
                        </p>
                    </div>
                </div>
                
                {/* Disclaimer */}
                <div className="mt-8 pt-6 border-t border-border/50">
                    <p className="text-xs text-muted-foreground/50 font-sans text-center max-w-2xl mx-auto">
                        This tool is indicative in nature and for educational purposes only and inspired 
                        by other similar open-source contributions. The fingerprinting techniques examined 
                        here are generally used by websites to track users. Consider using privacy-focused 
                        browsers or extensions to protect yourself.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
