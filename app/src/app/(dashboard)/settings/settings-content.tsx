"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function SettingsContent() {
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
    </div>
  );
}
