import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Button } from "@/components/atoms/Button"
import { Activity, Plus, Target, Utensils } from "lucide-react"

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Summary Card */}
        <div className="col-span-full lg:col-span-2">
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h2 className="text-2xl font-semibold tracking-tight">Today's Summary</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="rounded-md border p-4">
                <div className="text-sm font-medium text-muted-foreground">Calories</div>
                <div className="mt-2 flex items-center gap-2">
                  <Utensils className="h-4 w-4" />
                  <span className="text-2xl font-bold">1,200</span>
                  <span className="text-sm text-muted-foreground">/ 2,000</span>
                </div>
              </div>
              <div className="rounded-md border p-4">
                <div className="text-sm font-medium text-muted-foreground">Activity</div>
                <div className="mt-2 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  <span className="text-2xl font-bold">30</span>
                  <span className="text-sm text-muted-foreground">mins</span>
                </div>
              </div>
              <div className="rounded-md border p-4">
                <div className="text-sm font-medium text-muted-foreground">Goals Met</div>
                <div className="mt-2 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  <span className="text-2xl font-bold">2</span>
                  <span className="text-sm text-muted-foreground">/ 3</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Add Card */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold tracking-tight">Quick Add</h2>
          <div className="mt-4 space-y-4">
            <Button className="w-full justify-start gap-2" variant="outline">
              <Plus className="h-4 w-4" />
              Add Food Item
            </Button>
            <Button className="w-full justify-start gap-2" variant="outline">
              <Plus className="h-4 w-4" />
              Log Exercise
            </Button>
          </div>
        </div>

        {/* Food Log */}
        <div className="col-span-full">
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold tracking-tight">Today's Food Log</h2>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>
            <div className="mt-4">
              <div className="space-y-4">
                {/* Food Log Item */}
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-md bg-primary/10" />
                    <div>
                      <div className="font-medium">Breakfast</div>
                      <div className="text-sm text-muted-foreground">Oatmeal with Berries</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">320</div>
                    <div className="text-sm text-muted-foreground">calories</div>
                  </div>
                </div>
                {/* Add more food log items here */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
