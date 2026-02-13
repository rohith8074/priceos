export const dynamic = "force-dynamic";

import { createPMSClient } from "@/lib/pms";
import { TaskBoard } from "@/components/tasks/task-board";

export default async function TasksPage() {
  const pms = createPMSClient();
  const [tasks, properties] = await Promise.all([
    pms.getTasks(),
    pms.listListings(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tasks</h1>
        <p className="text-sm text-muted-foreground">
          Manage cleaning, maintenance, and operational tasks
        </p>
      </div>
      <TaskBoard initialTasks={tasks} properties={properties} />
    </div>
  );
}
