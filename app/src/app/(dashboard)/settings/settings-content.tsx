"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Sparkles } from "lucide-react";

export function SettingsContent() {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasExistingKey, setHasExistingKey] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Load existing key on mount
  useEffect(() => {
    async function loadApiKey() {
      try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        if (data.hasApiKey) {
          setApiKey(data.lyzrApiKey); // Masked
          setHasExistingKey(true);
        }
      } catch (error) {
        console.error('Failed to load API key:', error);
      }
    }
    loadApiKey();
  }, []);

  async function handleSaveApiKey() {
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lyzrApiKey: apiKey })
      });

      if (!res.ok) throw new Error('Failed to save API key');

      setMessage({ type: 'success', text: 'API key saved successfully' });
      setHasExistingKey(true);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save API key' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Pricing Automation</CardTitle>
          <CardDescription>
            Configure how AI pricing proposals are generated and applied
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-approve">Auto-approve low-risk proposals</Label>
              <p className="text-sm text-muted-foreground">
                Automatically approve proposals with &le;10% price change
              </p>
            </div>
            <Switch id="auto-approve" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="daily-cycle">Daily revenue cycle</Label>
              <p className="text-sm text-muted-foreground">
                Run pricing optimization every day at 6:00 AM
              </p>
            </div>
            <Switch id="daily-cycle" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="event-signals">Event signal monitoring</Label>
              <p className="text-sm text-muted-foreground">
                Track Dubai events that impact demand and pricing
              </p>
            </div>
            <Switch id="event-signals" defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Choose what updates you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="new-bookings">New bookings</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when a new reservation is confirmed
              </p>
            </div>
            <Switch id="new-bookings" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="guest-messages">Guest messages</Label>
              <p className="text-sm text-muted-foreground">
                Notify when new guest messages arrive
              </p>
            </div>
            <Switch id="guest-messages" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="task-reminders">Task reminders</Label>
              <p className="text-sm text-muted-foreground">
                Remind about overdue or upcoming tasks
              </p>
            </div>
            <Switch id="task-reminders" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Source</CardTitle>
          <CardDescription>
            Configure property management system connection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Current mode</Label>
              <p className="text-sm text-muted-foreground">
                Using Neon Postgres database (seeded with demo data)
              </p>
            </div>
            <span className="rounded-md bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-300">
              Connected
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden border-amber-200 dark:border-amber-800">
        {/* Gradient background accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" />

        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 p-2">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>Lyzr AI Configuration</CardTitle>
              <CardDescription>
                Configure your Lyzr API key to enable AI-powered pricing
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* API Key Input */}
          <div className="space-y-2">
            <Label htmlFor="lyzr-api-key">API Key</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="lyzr-api-key"
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Lyzr API key"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button
                onClick={handleSaveApiKey}
                disabled={loading || !apiKey}
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
              >
                {loading ? "Saving..." : hasExistingKey ? "Update" : "Save"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              🔒 Your API key is encrypted and stored securely. Never shared or exposed to the client.
            </p>
          </div>

          {/* Success/Error Messages */}
          {message && (
            <div className={`text-sm ${message.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {message.text}
            </div>
          )}

          {/* Status Indicator */}
          {hasExistingKey && (
            <div className="flex items-center gap-2 text-sm">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-muted-foreground">API key configured</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
