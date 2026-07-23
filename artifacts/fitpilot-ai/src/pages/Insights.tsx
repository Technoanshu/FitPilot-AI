import { useListInsights } from "@workspace/api-client-react";
import { Lightbulb, AlertTriangle, Info, TrendingUp, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Insights() {
  const { data: insights, isLoading } = useListInsights();

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <Zap className="h-8 w-8 text-primary" /> AI Insights
        </h1>
        <p className="text-muted-foreground mt-1">Operational and member retention signals powered by your data.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 pt-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-border"><CardContent className="p-6 space-y-4"><Skeleton className="h-6 w-1/2" /><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))
        ) : (
          insights?.map((insight) => (
            <Card key={insight.id} className={`flex flex-col border-border shadow-sm group hover:-translate-y-1 transition-all duration-300 ${insight.priority === 'high' ? 'border-primary/50 bg-primary/5' : 'bg-card'}`}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-center gap-2">
                    {insight.priority === 'high' ? <AlertTriangle className="h-5 w-5 text-primary" /> : 
                     insight.priority === 'medium' ? <TrendingUp className="h-5 w-5 text-orange-500" /> :
                     <Info className="h-5 w-5 text-blue-500" />}
                    <CardTitle className="text-base font-bold leading-tight">{insight.title}</CardTitle>
                  </div>
                  <Badge variant={insight.priority === 'high' ? 'default' : 'secondary'} className="uppercase text-[10px] tracking-wider font-bold">
                    {insight.priority}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between pt-0">
                <div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{insight.summary}</p>
                  {insight.metric && (
                    <div className="mt-4 mb-2 p-3 bg-background rounded-md border border-border inline-block">
                      <span className="font-mono text-lg font-bold text-foreground">{insight.metric}</span>
                    </div>
                  )}
                </div>
                <div className="mt-6 pt-4 border-t border-border">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Recommended Action</p>
                  <p className="text-sm font-medium text-foreground">{insight.action}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
