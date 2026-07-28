import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { adminGetCourseBatches } from "@/features/admin/services/academyAdminBatchesApi";
import { Loader2, Plus, AlertCircle, Edit, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";

export const Route = createFileRoute("/admin/batches/")({
  component: AdminBatchesIndexPage,
});

function AdminBatchesIndexPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadBatches() {
      try {
        setLoading(true);
        const data = await adminGetCourseBatches();
        if (mounted) {
          setBatches(data || []);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || "Failed to load batches");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    loadBatches();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Batches Management</h1>
          <p className="text-muted-foreground mt-2">Manage monthly funnel course batches and registrations</p>
        </div>
        <Button asChild>
          <Link to="/admin/batches/new">
            <Plus className="mr-2 h-4 w-4" /> Create Batch
          </Link>
        </Button>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && batches.length === 0 && (
        <div className="text-center py-12 border rounded-lg bg-card text-muted-foreground">
          No batches found. Create your first batch to get started.
        </div>
      )}

      {!loading && !error && batches.length > 0 && (
        <div className="border rounded-lg bg-card overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-6 py-4 font-medium">Batch</th>
                <th className="px-6 py-4 font-medium">Course</th>
                <th className="px-6 py-4 font-medium">Format</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Dates</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {batches.map((batch) => (
                <tr key={batch.id} className="hover:bg-muted/30">
                  <td className="px-6 py-4">
                    <div className="font-medium text-foreground">{batch.title}</div>
                    <div className="text-muted-foreground text-xs">{batch.slug}</div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {batch.course?.title || batch.course_title || batch.course_id}
                  </td>
                  <td className="px-6 py-4">
                    <span className="capitalize">{batch.training_format}</span>
                  </td>
                  <td className="px-6 py-4">
                    {(() => {
                      const status = batch.status || batch.registration_status || "-";
                      const badgeClass = status === 'OPEN' ? 'bg-green-100 text-green-800' :
                        status === 'CLOSED' ? 'bg-gray-100 text-gray-800' :
                        status === 'DRAFT' ? 'bg-blue-100 text-blue-800' :
                        'bg-muted text-muted-foreground';
                      return (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase ${badgeClass}`}>
                          {status}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {batch.registration_opens_at || batch.start_date ? format(parseISO(batch.registration_opens_at || batch.start_date), "dd/MM/yyyy") : "-"} 
                    {(batch.registration_closes_at || batch.end_date) ? ` - ${format(parseISO(batch.registration_closes_at || batch.end_date), "dd/MM/yyyy")}` : ""}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Link 
                      to="/admin/batches/$batchId/registrations" 
                      params={{ batchId: batch.id }}
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 px-3"
                    >
                      <Users className="h-4 w-4" /> Leads
                    </Link>
                    <Link 
                      to="/admin/batches/$batchId" 
                      params={{ batchId: batch.id }}
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-8 px-3"
                    >
                      <Edit className="h-4 w-4" /> Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
