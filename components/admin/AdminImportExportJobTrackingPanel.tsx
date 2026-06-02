import { updateImportExportJobTrackingAction } from '@/app/admin/settings/actions';
import {
  IMPORT_EXPORT_JOB_KINDS,
  IMPORT_EXPORT_JOB_STATUSES,
  IMPORT_EXPORT_JOB_TARGETS,
  type ImportExportJobSummary
} from '@/lib/settings/import-export-job-tracking';

const inputClass = 'rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20 disabled:cursor-not-allowed disabled:bg-stone-100';

function OptionList({ values }: { values: readonly string[] }) {
  return (
    <>
      {values.map((value) => (
        <option key={value} value={value}>
          {value.replace(/_/g, ' ')}
        </option>
      ))}
    </>
  );
}

function formatDate(value?: Date | null) {
  return value ? value.toISOString().slice(0, 10) : '—';
}

function progressText(processed: number, total: number, failed: number) {
  if (!total) return failed ? `${failed} failed rows` : 'no rows yet';
  return `${processed}/${total} rows${failed ? ` · ${failed} failed` : ''}`;
}

export function AdminImportExportJobTrackingPanel({ summary, databaseReady }: { summary: ImportExportJobSummary; databaseReady: boolean }) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Integrations</p>
          <h2 className="mt-1 text-2xl font-bold text-stone-950">Import/export job tracking</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">Track import and export jobs, row progress, digests, output links, operator attribution, and failure diagnostics before adding background processors.</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${summary.attention ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-700'}`}>
          {summary.attention ? `${summary.attention} need attention` : `${summary.total} tracked`}
        </span>
      </div>
      {!databaseReady ? (
        <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">Database settings are unavailable until DATABASE_URL is configured. Showing safe defaults.</div>
      ) : null}
      <div className="mt-6 grid gap-3 md:grid-cols-6">
        <div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-sm"><p className="font-bold text-stone-950">{summary.total}</p><p className="text-stone-600">Tracked</p></div>
        <div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-sm"><p className="font-bold text-stone-950">{summary.queued}</p><p className="text-stone-600">Queued</p></div>
        <div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-sm"><p className="font-bold text-stone-950">{summary.running}</p><p className="text-stone-600">Running</p></div>
        <div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-sm"><p className="font-bold text-stone-950">{summary.completed}</p><p className="text-stone-600">Completed</p></div>
        <div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-sm"><p className="font-bold text-stone-950">{summary.failed}</p><p className="text-stone-600">Failed</p></div>
        <div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-sm"><p className="font-bold text-stone-950">{summary.attention}</p><p className="text-stone-600">Attention</p></div>
      </div>
      <div className="mt-6 grid gap-4">
        {summary.entries.map((job) => (
          <form key={job.key} action={updateImportExportJobTrackingAction} className="grid gap-4 rounded-md border border-stone-200 bg-stone-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-stone-950">{job.label}</h3>
                <p className="text-sm text-stone-600">{job.kind} · {job.target} · {progressText(job.processedRows, job.totalRows, job.failedRows)}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${['failed', 'completed_with_errors'].includes(job.status) || job.failedRows ? 'bg-amber-50 text-amber-800' : job.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-700'}`}>
                {job.status.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-stone-800">
                Key
                <input className={inputClass} name="key" defaultValue={job.key} disabled={!databaseReady} />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-stone-800">
                Label
                <input className={inputClass} name="label" defaultValue={job.label} disabled={!databaseReady} />
              </label>
            </div>
            <label className="grid gap-2 text-sm font-semibold text-stone-800">
              Description
              <input className={inputClass} name="description" defaultValue={job.description ?? ''} disabled={!databaseReady} />
            </label>
            <div className="grid gap-3 md:grid-cols-4">
              <label className="grid gap-2 text-sm font-semibold text-stone-800">
                Kind
                <select className={inputClass} name="kind" defaultValue={job.kind} disabled={!databaseReady}>
                  <OptionList values={IMPORT_EXPORT_JOB_KINDS} />
                </select>
              </label>
              <label className="grid gap-2 text-sm font-semibold text-stone-800">
                Target
                <select className={inputClass} name="target" defaultValue={job.target} disabled={!databaseReady}>
                  <OptionList values={IMPORT_EXPORT_JOB_TARGETS} />
                </select>
              </label>
              <label className="grid gap-2 text-sm font-semibold text-stone-800">
                Status
                <select className={inputClass} name="status" defaultValue={job.status} disabled={!databaseReady}>
                  <OptionList values={IMPORT_EXPORT_JOB_STATUSES} />
                </select>
              </label>
              <label className="grid gap-2 text-sm font-semibold text-stone-800">
                Requested by
                <input className={inputClass} name="requestedBy" defaultValue={job.requestedBy ?? ''} placeholder="owner@example.com" disabled={!databaseReady} />
              </label>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <label className="grid gap-2 text-sm font-semibold text-stone-800">
                Total rows
                <input className={inputClass} name="totalRows" type="number" defaultValue={job.totalRows} disabled={!databaseReady} />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-stone-800">
                Processed rows
                <input className={inputClass} name="processedRows" type="number" defaultValue={job.processedRows} disabled={!databaseReady} />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-stone-800">
                Failed rows
                <input className={inputClass} name="failedRows" type="number" defaultValue={job.failedRows} disabled={!databaseReady} />
              </label>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-stone-800">
                Source filename
                <input className={inputClass} name="sourceFilename" defaultValue={job.sourceFilename ?? ''} placeholder="products.csv" disabled={!databaseReady} />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-stone-800">
                Source MIME type
                <input className={inputClass} name="sourceMimeType" defaultValue={job.sourceMimeType ?? ''} placeholder="text/csv" disabled={!databaseReady} />
              </label>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-stone-800">
                Input value for digest
                <input className={inputClass} name="inputValue" type="password" placeholder="Paste only when refreshing digest" disabled={!databaseReady} />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-stone-800">
                Output URL
                <input className={inputClass} name="outputUrl" defaultValue={job.outputUrl ?? ''} placeholder="/admin/exports/products.csv" disabled={!databaseReady} />
              </label>
            </div>
            <label className="grid gap-2 text-sm font-semibold text-stone-800">
              Error message
              <input className={inputClass} name="errorMessage" defaultValue={job.errorMessage ?? ''} disabled={!databaseReady} />
            </label>
            <div className="grid gap-3 rounded-md border border-stone-200 bg-white p-3 text-sm text-stone-600 md:grid-cols-4">
              <p><span className="font-semibold text-stone-900">Input digest:</span> {job.inputDigest ? `${job.inputDigest.slice(0, 12)}…` : 'not set'}</p>
              <p><span className="font-semibold text-stone-900">Output digest:</span> {job.outputDigest ? `${job.outputDigest.slice(0, 12)}…` : 'not set'}</p>
              <p><span className="font-semibold text-stone-900">Started:</span> {formatDate(job.startedAt)}</p>
              <p><span className="font-semibold text-stone-900">Completed:</span> {formatDate(job.completedAt)}</p>
            </div>
            <button className="w-fit rounded-full bg-rosewood px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none" type="submit" disabled={!databaseReady}>
              Save job record
            </button>
          </form>
        ))}
      </div>
    </section>
  );
}
