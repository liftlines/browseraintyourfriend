import React from 'react';
import { Shield, Github, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Header = ({ onRefresh, isScanning }) => {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <Shield className="h-6 w-6 text-foreground" />
                        <span className="font-serif text-lg text-foreground tracking-tight">
                            Browser<span className="text-muted-foreground">ain&apos;t</span>yourfriend
                        </span>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onRefresh}
                            disabled={isScanning}
                            className="font-sans text-sm border-border hover:bg-muted"
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${isScanning ? 'animate-spin' : ''}`} />
                            {isScanning ? 'Scanning...' : 'Re-scan'}
                        </Button>
                        <a
                            href="https://github.com/liftlines/browseraintyourfriend"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg hover:bg-muted transition-colors"
                        >
                            <Github className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                        </a>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
