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
import { addDays, format, isWithinInterval, parseISO } from 'date-fns';

interface PropertyMetric {
  id: number;
  name: string;
  area: string;
  price: number | string;
  occupancy: number;
  avgPrice: number;
  revenue: number;
  calendarDays?: { date: string; status: string; price: number }[];
  reservations?: { title: string; startDate: string; endDate: string; financials: any }[];
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

  // Generate an array of the next 30 days for the Global Calendar header
  const today = new Date();
  const next30Days = Array.from({ length: 30 }).map((_, i) => addDays(today, i));

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
    <div className="flex flex-col h-full overflow-y-auto w-full p-8 bg-[#0a0a0a] text-foreground">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Portfolio Analytics</h1>
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
        <Card className="bg-[#111113] border-white/5 shadow-2xl overflow-hidden relative group hover:border-amber-500/20 transition-all duration-500">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-amber-500/10 transition-colors" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 z-10 relative">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest text-[10px]">Total Properties</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent className="z-10 relative">
            <div className="text-3xl font-light text-white">{totalProperties}</div>
            <p className="text-xs text-emerald-500/80 mt-1 font-medium flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Active in portfolio
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#111113] border-white/5 shadow-2xl overflow-hidden relative group hover:border-emerald-500/20 transition-all duration-500">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-emerald-500/10 transition-colors" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 z-10 relative">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest text-[10px]">Avg Occupancy (30D)</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center">
              <CalendarCheck className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent className="z-10 relative">
            <div className="text-3xl font-light text-white">{avgPortfolioOccupancy}%</div>
            <p className="text-xs text-emerald-500/80 mt-1 font-medium flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Across all properties
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#111113] border-white/5 shadow-2xl overflow-hidden relative group hover:border-violet-500/20 transition-all duration-500">
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-violet-500/10 transition-colors" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 z-10 relative">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest text-[10px]">Avg Daily Rate</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-violet-400" />
            </div>
          </CardHeader>
          <CardContent className="z-10 relative">
            <div className="text-3xl font-light text-white">{avgPortfolioPrice} <span className="text-lg font-light text-muted-foreground">AED</span></div>
            <p className="text-xs text-emerald-500/80 mt-1 font-medium flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Overall booked rate
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#111113] border-white/5 shadow-2xl overflow-hidden relative group border-t-amber-500">
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 z-10 relative">
            <CardTitle className="text-sm font-medium text-amber-500/80 uppercase tracking-widest text-[10px]">Projected Revenue</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent className="z-10 relative">
            <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-200 to-amber-500">{totalPortfolioRevenue.toLocaleString()} <span className="text-lg font-medium text-amber-500/50">AED</span></div>
            <p className="text-xs text-amber-500/80 mt-1 font-medium flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Estimated 30-day gross
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card className="md:col-span-2 shadow-2xl border-white/5 bg-[#111113]">
          <CardHeader>
            <CardTitle className="text-white">Top Drivers by Revenue</CardTitle>
            <CardDescription className="text-muted-foreground">Top 10 performing properties in the selected cohort.</CardDescription>
          </CardHeader>
          <CardContent className="px-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3f3f46" opacity={0.3} />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#a1a1aa' }}
                    dy={10}
                    tickFormatter={(val) => val.length > 15 ? val.substring(0, 15) + '...' : val}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#a1a1aa' }}
                    tickFormatter={(val) => `${val / 1000}k`}
                    dx={-10}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#3f3f46', opacity: 0.2 }} />
                  <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.revenue > 10000 ? '#f59e0b' : '#3f3f46'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xl border-white/5 bg-[#111113] flex flex-col">
          <CardHeader>
            <CardTitle className="text-white">Occupancy Status</CardTitle>
            <CardDescription className="text-muted-foreground">Property health distribution.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full px-6 pb-6">
              <div className="space-y-4">
                {filteredProperties.sort((a, b) => b.occupancy - a.occupancy).slice(0, 8).map(prop => (
                  <div key={prop.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <div className="flex flex-col flex-1 min-w-0 pr-4">
                      <span className="text-sm font-medium truncate text-white">{prop.name}</span>
                      <span className="text-xs text-muted-foreground truncate">{prop.area}</span>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <span className={`text-sm font-bold ${prop.occupancy >= 70 ? 'text-emerald-500' :
                        prop.occupancy >= 40 ? 'text-amber-500' :
                          'text-rose-500'
                        }`}>
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

      <Card className="flex-1 min-h-0 flex flex-col shadow-2xl border-white/5 bg-[#111113]">
        <CardHeader className="border-b border-white/10 py-4 bg-black/20">
          <CardTitle className="text-white">Property Details</CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-hidden">
          <ScrollArea className="h-[400px] rounded-b-xl border-t-0 p-4">
            <Table>
              <TableHeader className="bg-[#1a1a1c] sticky top-0 z-10 backdrop-blur-sm border-b border-white/10">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Property</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Location</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Target Baseline</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Next 30D Occupancy</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Next 30D Avg Rate</TableHead>
                  <TableHead className="text-right text-muted-foreground text-xs uppercase tracking-wider">Projected Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProperties.sort((a, b) => b.revenue - a.revenue).map((property) => (
                  <TableRow key={property.id} className="hover:bg-white/5 transition-colors border-white/5">
                    <TableCell className="font-medium text-white">{property.name}</TableCell>
                    <TableCell className="text-muted-foreground">{property.area}</TableCell>
                    <TableCell className="text-muted-foreground">{property.price} AED</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${property.occupancy >= 70 ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                        property.occupancy >= 40 ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                          'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                        }`}>
                        {property.occupancy}%
                      </span>
                    </TableCell>
                    <TableCell className="font-medium text-white">{property.avgPrice.toFixed(0)} <span className="text-xs text-muted-foreground">AED</span></TableCell>
                    <TableCell className="text-right font-bold tracking-tight">
                      {property.revenue > 0 ? (
                        <span className="text-amber-500">{property.revenue.toLocaleString()}</span>
                      ) : (
                        <span className="text-muted-foreground">{property.revenue.toLocaleString()}</span>
                      )}{" "}
                      <span className="text-xs font-normal text-amber-500/50">AED</span>
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
      </Card>

      <Card className="flex-1 shrink-0 flex flex-col shadow-2xl mt-8 mb-8 border border-white/5 bg-[#111113]">
        <CardHeader className="border-b border-white/10 py-4 bg-gradient-to-r from-amber-500/10 to-transparent">
          <CardTitle className="text-amber-500 flex items-center gap-2">
            <CalendarCheck className="w-5 h-5" />
            Global Availability Master Calendar
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            30-day forward-looking timeline view across all active properties
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 flex flex-col relative w-full">
          <div className="w-full overflow-x-auto custom-scrollbar">
            <div className="min-w-[1200px] inline-block align-top pb-4">
              <div className="flex bg-muted/10 sticky top-0 z-20 border-b border-white/10 backdrop-blur-md">
                <div className="w-[300px] shrink-0 p-3 font-semibold text-xs text-muted-foreground uppercase border-r border-white/10 sticky left-0 bg-[#0c0c0e] z-30 shadow-xl">
                  Property Name
                </div>
                <div className="flex flex-1">
                  {next30Days.map((d, i) => (
                    <div key={i} className="flex-1 min-w-[32px] max-w-[40px] border-r border-white/5 p-2 flex flex-col items-center justify-center bg-black/20">
                      <span className="text-[10px] text-muted-foreground font-medium">{format(d, 'MMM')}</span>
                      <span className="text-xs font-bold text-foreground">{format(d, 'd')}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col relative z-0">
                {filteredProperties.sort((a, b) => b.revenue - a.revenue).map((property, idx) => (
                  <div key={property.id} className={`flex border-b border-white/5 transition-colors hover:bg-white/5 ${idx % 2 === 0 ? 'bg-transparent' : 'bg-black/20'}`}>
                    <div className="w-[300px] shrink-0 p-3 flex flex-col justify-center border-r border-white/10 sticky left-0 bg-[#0c0c0e] z-10 shadow-xl">
                      <span className="text-sm font-semibold truncate text-white">{property.name}</span>
                      <span className="text-xs text-muted-foreground truncate">{property.area}</span>
                    </div>
                    <div className="flex flex-1 relative py-1">
                      {next30Days.map((d, i) => {
                        const dateStr = format(d, 'yyyy-MM-dd');
                        const calDay = property.calendarDays?.find(c => c.date === dateStr);

                        // Look for a reservation exactly covering this day to render block
                        const reservation = property.reservations?.find(r => {
                          try {
                            return isWithinInterval(d, { start: parseISO(r.startDate), end: parseISO(r.endDate) });
                          } catch { return false; }
                        });

                        let bgColor = "bg-green-500/20";
                        let borderColor = "border-green-500/30";

                        if (calDay?.status === 'blocked') {
                          bgColor = "bg-neutral-800/80";
                          borderColor = "border-neutral-700";
                        } else if (calDay?.status === 'reserved' || calDay?.status === 'booked' || reservation) {
                          bgColor = "bg-red-500/20";
                          borderColor = "border-red-500/50";
                        }

                        // We'll create small tooltips for the days
                        return (
                          <div key={i} className="flex-1 min-w-[32px] max-w-[40px] px-0.5 group relative flex items-center">
                            <div className={`w-full h-8 rounded-md border ${bgColor} ${borderColor} transition-all duration-300 hover:brightness-125 z-0`} />

                            {/* Hover Tooltip inside mapping to avoid complex portals for now */}
                            {(reservation || calDay?.status === 'blocked') && (
                              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:flex flex-col bg-black border border-white/20 p-3 rounded-xl shadow-2xl z-[100] w-64 backdrop-blur-xl">
                                {reservation ? (
                                  <>
                                    <div className="border-b border-white/10 pb-2 mb-2">
                                      <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-1">Confirmed Guest</p>
                                      <p className="text-sm font-bold text-white whitespace-nowrap overflow-hidden text-ellipsis">{reservation.title}</p>
                                    </div>
                                    <div className="flex justify-between items-center text-xs mb-1">
                                      <span className="text-muted-foreground">Total Payout:</span>
                                      <span className="font-bold text-emerald-400">{reservation.financials?.hostPayout?.toLocaleString() || reservation.financials?.totalPrice?.toLocaleString() || 'Unknown'} AED</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs mb-1">
                                      <span className="text-muted-foreground">Channel:</span>
                                      <span className="font-semibold text-white capitalize">{reservation.financials?.channelName || reservation.financials?.channel || 'Direct'}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                      <span className="text-muted-foreground">Dates:</span>
                                      <span className="font-medium text-white">{reservation.startDate} - {reservation.endDate}</span>
                                    </div>
                                  </>
                                ) : (
                                  <div className="text-xs text-muted-foreground font-medium text-center">Owner Blocked</div>
                                )}
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-black"></div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
