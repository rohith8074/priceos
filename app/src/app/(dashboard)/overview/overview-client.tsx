"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Building2, TrendingUp, DollarSign, CalendarCheck, Search } from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';

interface PropertyMetric {
    id: number;
    name: string;
    area: string;
    price: number | string;
    occupancy: number;
    avgPrice: number;
    revenue: number;
}

interface OverviewClientProps {
    properties: PropertyMetric[];
    totalProperties: number;
    avgPortfolioOccupancy: number;
    avgPortfolioPrice: number;
    totalPortfolioRevenue: number;
}

export function OverviewClient({
    properties,
    totalProperties,
    avgPortfolioOccupancy,
    avgPortfolioPrice,
    totalPortfolioRevenue
}: OverviewClientProps) {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredProperties = properties.filter((prop) =>
        prop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prop.area.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Prepare chart data - top 10 by revenue
    const chartData = [...filteredProperties]
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-background border border-border/50 p-3 rounded-xl shadow-lg">
                    <p className="font-semibold text-sm mb-1">{label}</p>
                    <p className="text-emerald-500 font-bold text-sm">
                        {payload[0].value.toLocaleString()} AED
                    </p>
                    <p className="text-muted-foreground text-xs mt-1">Projected Revenue</p>
                </div>
            );
        }
        return null;
    };

    return (
    <div className="flex flex-col h-full overflow-y-auto w-full p-8 bg-muted/10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portfolio Analytics</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            30-day forward-looking property performance metrics.
          </p>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Filter properties or locations..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-background/50 border-muted-foreground/20 focus-visible:ring-amber-500/30"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="bg-gradient-to-br from-background to-muted/30 border-muted">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalProperties}</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Active in portfolio</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-background to-muted/30 border-muted">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Occupancy (30D)</CardTitle>
            <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CalendarCheck className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgPortfolioOccupancy}%</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Across all properties</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-background to-muted/30 border-muted">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Daily Rate (ADR)</CardTitle>
            <div className="h-8 w-8 rounded-full bg-violet-500/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-violet-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgPortfolioPrice} <span className="text-lg font-medium text-muted-foreground">AED</span></div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Overall booked rate</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-background to-muted/30 border-muted relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -mr-10 -mt-10" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Projected Revenue</CardTitle>
            <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalPortfolioRevenue.toLocaleString()} <span className="text-lg font-medium text-muted-foreground">AED</span></div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Estimated 30-day gross</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card className="md:col-span-2 shadow-sm border-muted">
          <CardHeader>
            <CardTitle>Top Drivers by Revenue</CardTitle>
            <CardDescription>Top 10 performing properties in the selected cohort.</CardDescription>
          </CardHeader>
          <CardContent className="px-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground) / 0.1)" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    dy={10}
                    tickFormatter={(val) => val.length > 15 ? val.substring(0, 15) + '...' : val}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(val) => \`\${val / 1000}k\`}
                    dx={-10}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.4)' }} />
                  <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={\`cell-\${index}\`} fill={entry.revenue > 10000 ? 'hsl(var(--amber-500))' : 'hsl(var(--primary) / 0.7)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-muted flex flex-col">
          <CardHeader>
            <CardTitle>Occupancy Status</CardTitle>
            <CardDescription>Property health distribution.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
             <ScrollArea className="h-full px-6 pb-6">
                <div className="space-y-4">
                  {filteredProperties.sort((a,b) => b.occupancy - a.occupancy).slice(0,8).map(prop => (
                    <div key={prop.id} className="flex items-center justify-between">
                      <div className="flex flex-col flex-1 min-w-0 pr-4">
                        <span className="text-sm font-medium truncate">{prop.name}</span>
                        <span className="text-xs text-muted-foreground truncate">{prop.area}</span>
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                         <span className={\`text-sm font-bold \${
                           prop.occupancy >= 70 ? 'text-emerald-500' : 
                           prop.occupancy >= 40 ? 'text-amber-500' : 
                           'text-rose-500'
                         }\`}>
                           {prop.occupancy}%
                         </span>
                         <span className="text-[10px] text-muted-foreground">{prop.revenue.toLocaleString()} AED</span>
                      </div>
                    </div>
                  ))}
                </div>
             </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Card className="flex-1 min-h-0 flex flex-col shadow-sm border-muted">
        <CardHeader className="border-b bg-muted/5 py-4">
          <CardTitle>Property Details</CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-hidden">
            <ScrollArea className="h-[400px] rounded-b-xl border-t-0 p-4">
              <Table>
                <TableHeader className="bg-muted/10 sticky top-0 z-10 backdrop-blur-sm">
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Target Baseline</TableHead>
                    <TableHead>Next 30D Occupancy</TableHead>
                    <TableHead>Next 30D Avg Rate</TableHead>
                    <TableHead className="text-right">Projected Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProperties.sort((a, b) => b.revenue - a.revenue).map((property) => (
                    <TableRow key={property.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium">{property.name}</TableCell>
                      <TableCell className="text-muted-foreground">{property.area}</TableCell>
                      <TableCell className="text-muted-foreground">{property.price} AED</TableCell>
                      <TableCell>
                        <span className={\`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold \${
                            property.occupancy >= 70 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                            property.occupancy >= 40 ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                            'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        }\`}>
                          {property.occupancy}%
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">{property.avgPrice.toFixed(0)} <span className="text-xs text-muted-foreground">AED</span></TableCell>
                      <TableCell className="text-right font-bold tracking-tight">
                        {property.revenue > 0 ? (
                            <span className="text-emerald-600 dark:text-emerald-400">{property.revenue.toLocaleString()}</span>
                        ) : (
                            <span className="text-muted-foreground">{property.revenue.toLocaleString()}</span>
                        )}{" "}
                        <span className="text-xs font-normal text-muted-foreground">AED</span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredProperties.length === 0 && (
                      <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                              No properties found matching your filter.
                          </TableCell>
                      </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
        </CardContent>
      </Card >
    </div >
  );
}
