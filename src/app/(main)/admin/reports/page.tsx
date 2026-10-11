import { AdminReportsList } from "@/components/admin/AdminReportsList";
import { TabNav } from "@/components/ui/TabNav";
import { loadAdminReports } from "@/lib/admin/data";
import { REPORT_STATUS_LABELS } from "@/lib/utils/admin-labels";
import type { ReportStatus } from "@prisma/client";

type AdminReportsPageProps = {
  searchParams: Promise<{ status?: string }>;
};

const STATUSES = Object.keys(REPORT_STATUS_LABELS) as ReportStatus[];

export default async function AdminReportsPage({ searchParams }: AdminReportsPageProps) {
  const { status: statusParam } = await searchParams;
  const status = STATUSES.find((value) => value === statusParam);
  const reports = await loadAdminReports(status ? { status } : {});

  return (
    <>
      <TabNav
        ariaLabel="סינון דיווחים לפי סטטוס"
        items={[
          { href: "/admin/reports", label: "הכל", active: !status },
          ...STATUSES.map((value) => ({
            href: `/admin/reports?status=${value}`,
            label: REPORT_STATUS_LABELS[value],
            active: status === value,
          })),
        ]}
      />
      <AdminReportsList reports={reports} />
    </>
  );
}
