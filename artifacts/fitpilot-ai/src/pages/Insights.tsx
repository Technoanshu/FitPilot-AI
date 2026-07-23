import React from 'react';
import { useListInsights } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, AlertTriangle, ArrowRight, TrendingUp, Info } from 'lucide-react';

export function Insights() {
  const { data: insights, isLoading } = useListInsights();

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="w-5 h-5 text-destructive" />;
      case 'medium': return <TrendingUp className="w-5 h-5 text-primary" />;
      default: return <Info className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-destructive/30 bg-destructive/5';
      case 'medium': return 'border-primary/30 bg-primary/5';
      default: return 'border-border bg-card';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            AI Insights 
            <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider">Beta</span>
          </h1>
          <p className="text-muted-foreground mt-1">Operational intelligence generated from your gym's data.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse shadow-sm">
              <CardContent className="p-6">
                <div className="h-6 bg-muted rounded w-3/4 mb-4"></div>
                <div className="h-20 bg-muted rounded w-full mb-6"></div>
                <div className="h-10 bg-muted rounded w-full"></div>
              </CardContent>
            </Card>
          ))
        ) : insights?.map((insight) => (
          <Card key={insight.id} className={`shadow-sm border transition-colors ${getPriorityColor(insight.priority)}`}>
            <CardContent className="p-6 flex flex-col h-full">
              <div className="flex items-start gap-3 mb-4">
                <div className="mt-1 shrink-0">
                  {getPriorityIcon(insight.priority)}
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">{insight.title}</h3>
                  {insight.metric && (
                    <div className="inline-block mt-2 px-2 py-0.5 bg-background rounded-md border border-border text-xs font-mono text-muted-foreground font-semibold">
                      {insight.metric}
                    </div>
                  )}
                </div>
              </div>
              
              <p className="text-foreground/80 text-sm mb-6 flex-1">
                {insight.summary}
              </p>
              
              <Button className="w-full mt-auto" variant={insight.priority === 'high' ? 'destructive' : 'secondary'}>
                {insight.action}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        ))}
        
        {(!insights || insights.length === 0) && !isLoading && (
          <div className="col-span-full py-16 text-center text-muted-foreground bg-card border border-border rounded-xl flex flex-col items-center">
            <Sparkles className="w-12 h-12 mb-4 text-muted-foreground/30" />
            <p className="font-medium text-lg">No new insights right now.</p>
            <p className="text-sm">Check back later as more data flows in.</p>
          </div>
        )}
      </div>
    </div>
  );
}
