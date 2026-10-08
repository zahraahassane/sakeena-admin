import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Copy, Loader2, RefreshCw, Ruler } from "lucide-react";
import toast from "react-hot-toast";
import {
  useGetLuluCoverDimensionsMutation,
  useGetLuluPackagesQuery,
  useLazyGetLuluCoverValidationResultQuery,
  useLazyGetLuluInteriorValidationResultQuery,
  useValidateLuluCoverMutation,
  useValidateLuluInteriorMutation,
} from "../../../Api/adminApi";
import FileDropzone from "../../../components/FileDropzone";
import { getApiErrorMessage } from "../../../utils/apiError";
import Field from "./Field";
import { inputClass } from "./formStyles";
import { BINDING_LABELS, COLOR_LABELS, describePackage, packageParts } from "./luluPackages";

const STATUS = {
  NOT_SUBMITTED: { label: "Not checked yet", cls: "bg-gray-100 text-gray-600" },
  VALIDATING: { label: "Lulu is checking…", cls: "bg-amber-50 text-amber-700" },
  NORMALIZING: { label: "Lulu is checking…", cls: "bg-amber-50 text-amber-700" },
  VALIDATED: { label: "Passed", cls: "bg-emerald-50 text-emerald-700" },
  NORMALIZED: { label: "Passed", cls: "bg-emerald-50 text-emerald-700" },
  ERROR: { label: "Needs changes", cls: "bg-rose-50 text-rose-700" },
};

const StatusPill = ({ status }) => {
  const s = STATUS[status] || STATUS.NOT_SUBMITTED;
  return <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 ${s.cls}`}>{s.label}</span>;
};

const errorText = (e) => (typeof e === "string" ? e : e?.message || e?.detail || JSON.stringify(e));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const toInches = (value, unit) => {
  const n = parseFloat(value);
  if (!Number.isFinite(n)) return null;
  if (unit === "mm") return n / 25.4;
  if (unit === "in") return n;
  return n / 72; // points
};

const sizeText = (width, height, unit) => {
  const w = toInches(width, unit);
  const h = toInches(height, unit);
  if (w == null || h == null) return null;
  return {
    raw: `${width} x ${height} ${unit}`,
    inches: `${w.toFixed(2)} x ${h.toFixed(2)} in`,
    mm: `${(w * 25.4).toFixed(1)} x ${(h * 25.4).toFixed(1)} mm`,
  };
};

const Step = ({ number, title, description, right, children }) => (
  <div className="p-4 border border-black/10 rounded-xl space-y-3">
    <div className="flex items-start justify-between gap-3">
      <div className="flex gap-3">
        <span className="w-6 h-6 rounded-full bg-teal-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
          {number}
        </span>
        <div>
          <p className="text-sm font-bold text-neutral-900">{title}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
      {right}
    </div>
    <div className="pl-9 space-y-3">{children}</div>
  </div>
);

/**
 * Guided print-on-demand setup. Every step works on the saved book, so anything that
 * reads server values first calls ensureSaved() to store unsaved edits.
 */
const PrintSetup = ({ book, form, setForm, errors, fileProps, ensureSaved, onRefresh, syncFromServer }) => {
  const { data: curated = [] } = useGetLuluPackagesQuery();
  const [validateInterior] = useValidateLuluInteriorMutation();
  const [pollInterior] = useLazyGetLuluInteriorValidationResultQuery();
  const [getCoverDimensions, { isLoading: calculating }] = useGetLuluCoverDimensionsMutation();
  const [validateCover] = useValidateLuluCoverMutation();
  const [pollCover] = useLazyGetLuluCoverValidationResultQuery();

  const [busy, setBusy] = useState(null); // "interior" | "cover" | null
  const [messages, setMessages] = useState({});
  const [filters, setFilters] = useState({ binding: "", color: "" });
  const [showAllFormats, setShowAllFormats] = useState(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const interiorStatus = book.lulu_interior_validation_status;
  const coverStatus = book.lulu_cover_validation_status;
  const interiorErrors = (book.lulu_interior_validation_errors || []).map(errorText);
  const coverErrors = (book.lulu_cover_validation_errors || []).map(errorText);
  const validIds = useMemo(() => book.lulu_interior_valid_package_ids || [], [book.lulu_interior_valid_package_ids]);

  const setMessage = (key, text) => setMessages((prev) => ({ ...prev, [key]: text }));

  // Lulu checks run in the background. Poll for a few minutes, and always leave a
  // visible "Check status" button for longer waits.
  const pollUntilDone = async (kind) => {
    const trigger = kind === "interior" ? pollInterior : pollCover;
    const terminal = kind === "interior" ? ["VALIDATED", "ERROR"] : ["NORMALIZED", "ERROR"];
    for (let attempt = 0; attempt < 45; attempt += 1) {
      await sleep(4000);
      if (!mounted.current) return;
      try {
        const result = await trigger(book.slug).unwrap();
        if (terminal.includes(result.status)) {
          if (kind === "interior" && result.status === "VALIDATED" && result.page_count) {
            syncFromServer({ page_count: String(result.page_count) });
          }
          await onRefresh();
          return;
        }
      } catch (err) {
        setMessage(kind, getApiErrorMessage(err, "Could not check the status with Lulu."));
        return;
      }
    }
    setMessage(kind, "Lulu is still working on it. Press “Check status” in a minute.");
  };

  const run = async (kind) => {
    setMessage(kind, "");
    setBusy(kind);
    try {
      if (kind === "cover" && !(await ensureSaved())) return;
      const submit = kind === "interior" ? validateInterior : validateCover;
      await submit(book.slug).unwrap();
      await onRefresh();
      await pollUntilDone(kind);
    } catch (err) {
      setMessage(kind, getApiErrorMessage(err, "Could not send the file to Lulu."));
    } finally {
      if (mounted.current) setBusy(null);
    }
  };

  const checkNow = async (kind) => {
    setMessage(kind, "");
    setBusy(kind);
    try {
      const trigger = kind === "interior" ? pollInterior : pollCover;
      const result = await trigger(book.slug).unwrap();
      if (kind === "interior" && result.status === "VALIDATED" && result.page_count) {
        syncFromServer({ page_count: String(result.page_count) });
      }
      await onRefresh();
    } catch (err) {
      setMessage(kind, getApiErrorMessage(err, "Could not check the status with Lulu."));
    } finally {
      if (mounted.current) setBusy(null);
    }
  };

  const calculateCoverSize = async () => {
    setMessage("size", "");
    if (!form.lulu_pod_package_id) return setMessage("size", "Choose a print format in step 2 first.");
    if (!(Number(form.page_count) > 0)) return setMessage("size", "Enter the page count first.");
    if (!(await ensureSaved())) return;
    try {
      await getCoverDimensions(book.slug).unwrap();
      await onRefresh();
    } catch (err) {
      setMessage("size", getApiErrorMessage(err, "Could not calculate the cover size."));
    }
  };

  const size = sizeText(book.lulu_cover_required_width, book.lulu_cover_required_height, book.lulu_cover_dimension_unit || "pt");

  const copySize = async () => {
    try {
      await navigator.clipboard.writeText(`${size.inches} (${size.mm})`);
      toast.success("Cover size copied");
    } catch {
      toast.error("Could not copy. Select the text instead.");
    }
  };

  const suggestions = validIds.filter((id) => {
    const { color, binding } = packageParts(id);
    return (!filters.binding || binding === filters.binding) && (!filters.color || color === filters.color);
  });
  const bindings = [...new Set(validIds.map((id) => packageParts(id).binding))].sort();
  const colors = [...new Set(validIds.map((id) => packageParts(id).color))].sort();
  const selectOptions = curated.some((p) => p.id === form.lulu_pod_package_id) || !form.lulu_pod_package_id
    ? curated
    : [{ id: form.lulu_pod_package_id, description: describePackage(form.lulu_pod_package_id) }, ...curated];

  const interiorBusy = busy === "interior" || interiorStatus === "VALIDATING";
  const coverBusy = busy === "cover" || coverStatus === "NORMALIZING";

  return (
    <div className="space-y-4">
      <div
        className={`p-4 rounded-xl flex items-center gap-3 border ${
          book.is_lulu_print_ready ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"
        }`}
      >
        {book.is_lulu_print_ready ? (
          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
        ) : (
          <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
        )}
        <div>
          <p className="text-sm font-bold text-neutral-900">
            {book.is_lulu_print_ready ? "Ready to print" : "Not ready to print yet"}
          </p>
          <p className="text-xs text-gray-600">
            {book.is_lulu_print_ready
              ? "Lulu accepted both the interior and the cover."
              : "Work through the steps below. Orders for this book can't be printed until both files pass Lulu's check."}
          </p>
        </div>
      </div>

      <Step
        number={1}
        title="Interior PDF"
        description="The pages of the book, ready for print. Lulu counts the pages for you."
        right={<StatusPill status={interiorStatus} />}
      >
        <FileDropzone id="field-physical_file" label="Interior PDF" required kind="pdf" {...fileProps("physical_file")} />
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={!book.physical_file || interiorBusy}
            onClick={() => run("interior")}
            className="px-4 h-10 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold flex items-center gap-2"
          >
            {interiorBusy && <Loader2 className="w-4 h-4 animate-spin" />}
            {interiorBusy ? "Lulu is checking…" : "Check with Lulu"}
          </button>
          {book.lulu_interior_validation_id && interiorStatus !== "NOT_SUBMITTED" && (
            <button
              type="button"
              disabled={!!busy}
              onClick={() => checkNow("interior")}
              className="px-3 h-10 border border-black/10 rounded-lg text-xs font-medium flex items-center gap-1.5 hover:bg-gray-50 disabled:opacity-40"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Check status
            </button>
          )}
          {!book.physical_file && <span className="text-xs text-amber-700">Upload the interior PDF first.</span>}
        </div>
        {messages.interior && <p className="text-xs text-rose-600">{messages.interior}</p>}
        {interiorErrors.length > 0 && (
          <ul className="text-xs text-rose-600 list-disc pl-4 space-y-0.5">
            {interiorErrors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        )}
        {interiorStatus === "VALIDATED" && book.page_count > 0 && (
          <p className="text-xs text-emerald-700">Lulu counted {book.page_count} pages.</p>
        )}
      </Step>

      <Step
        number={2}
        title="Print format"
        description="Paper size, binding and colour. Pick the one you want customers to receive."
      >
        <Field id="lulu_pod_package_id" label="Print format" required error={errors.lulu_pod_package_id}>
          <select
            id="lulu_pod_package_id"
            value={form.lulu_pod_package_id}
            onChange={(e) => setForm((f) => ({ ...f, lulu_pod_package_id: e.target.value }))}
            className={inputClass(!!errors.lulu_pod_package_id)}
          >
            <option value="">Choose a print format…</option>
            {selectOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.description}
              </option>
            ))}
          </select>
        </Field>

        {validIds.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-neutral-700">
              Formats Lulu says fit this interior ({validIds.length}):
            </p>
            <div className="flex flex-wrap gap-2">
              <select
                value={filters.binding}
                onChange={(e) => setFilters((f) => ({ ...f, binding: e.target.value }))}
                className="text-xs border border-black/10 rounded-lg px-2 py-1.5 bg-white"
              >
                <option value="">Any binding</option>
                {bindings.map((b) => (
                  <option key={b} value={b}>
                    {BINDING_LABELS[b] || b}
                  </option>
                ))}
              </select>
              <select
                value={filters.color}
                onChange={(e) => setFilters((f) => ({ ...f, color: e.target.value }))}
                className="text-xs border border-black/10 rounded-lg px-2 py-1.5 bg-white"
              >
                <option value="">Any colour</option>
                {colors.map((c) => (
                  <option key={c} value={c}>
                    {COLOR_LABELS[c] || c}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
              {suggestions.slice(0, showAllFormats ? undefined : 12).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, lulu_pod_package_id: id }))}
                  title={id}
                  className={`px-2.5 py-1 rounded-lg text-xs border text-left ${
                    form.lulu_pod_package_id === id
                      ? "bg-teal-600 border-teal-600 text-white"
                      : "bg-white border-black/10 text-neutral-700 hover:border-teal-400"
                  }`}
                >
                  {describePackage(id, curated)}
                </button>
              ))}
            </div>
            {suggestions.length > 12 && (
              <button
                type="button"
                onClick={() => setShowAllFormats((v) => !v)}
                className="text-xs text-teal-700 hover:underline"
              >
                {showAllFormats ? "Show fewer" : `Show all ${suggestions.length}`}
              </button>
            )}
          </div>
        )}

        <Field
          id="page_count"
          label="Page count"
          required
          error={errors.page_count}
          hint="Filled in automatically after Lulu checks the interior."
        >
          <input
            id="page_count"
            type="number"
            min="1"
            value={form.page_count}
            onChange={(e) => setForm((f) => ({ ...f, page_count: e.target.value }))}
            className={`${inputClass(!!errors.page_count)} max-w-[160px]`}
          />
        </Field>
        <p className="text-xs text-gray-500">Changing the format or page count means the cover size and cover check must be redone.</p>
      </Step>

      <Step
        number={3}
        title="Cover size"
        description="The cover is one wide PDF: back, spine and front together. Lulu works out the exact size."
        right={<Ruler className="w-5 h-5 text-gray-300 shrink-0" />}
      >
        <button
          type="button"
          onClick={calculateCoverSize}
          disabled={calculating}
          className="px-4 h-10 bg-white border border-black/10 hover:bg-gray-50 disabled:opacity-40 rounded-lg text-xs font-bold flex items-center gap-2"
        >
          {calculating && <Loader2 className="w-4 h-4 animate-spin" />}
          {size ? "Recalculate cover size" : "Calculate cover size"}
        </button>
        {messages.size && <p className="text-xs text-rose-600">{messages.size}</p>}
        {size ? (
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-teal-800">{size.inches}</p>
              <p className="text-xs text-teal-700">{size.mm} ({size.raw})</p>
              <p className="text-xs text-gray-600 mt-1">Includes spine and bleed. Give this to whoever designs the cover.</p>
            </div>
            <button type="button" onClick={copySize} title="Copy" className="p-2 hover:bg-teal-100 rounded-lg text-teal-700">
              <Copy className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <p className="text-xs text-gray-500">Not calculated yet (or the format or page count changed).</p>
        )}
      </Step>

      <Step
        number={4}
        title="Print cover PDF"
        description="Upload the finished cover at exactly the size above. It must be a PDF."
        right={<StatusPill status={coverStatus} />}
      >
        <FileDropzone id="field-lulu_cover_pdf" label="Print cover PDF" required kind="pdf" {...fileProps("lulu_cover_pdf")} />
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={!book.lulu_cover_pdf || coverBusy}
            onClick={() => run("cover")}
            className="px-4 h-10 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold flex items-center gap-2"
          >
            {coverBusy && <Loader2 className="w-4 h-4 animate-spin" />}
            {coverBusy ? "Lulu is checking…" : "Check cover with Lulu"}
          </button>
          {book.lulu_cover_validation_id && coverStatus !== "NOT_SUBMITTED" && (
            <button
              type="button"
              disabled={!!busy}
              onClick={() => checkNow("cover")}
              className="px-3 h-10 border border-black/10 rounded-lg text-xs font-medium flex items-center gap-1.5 hover:bg-gray-50 disabled:opacity-40"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Check status
            </button>
          )}
          {!book.lulu_cover_pdf && <span className="text-xs text-amber-700">Upload the cover PDF first.</span>}
        </div>
        {messages.cover && <p className="text-xs text-rose-600">{messages.cover}</p>}
        {coverErrors.length > 0 && (
          <ul className="text-xs text-rose-600 list-disc pl-4 space-y-0.5">
            {coverErrors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        )}
      </Step>
    </div>
  );
};

export default PrintSetup;
