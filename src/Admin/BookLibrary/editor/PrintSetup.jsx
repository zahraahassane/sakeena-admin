import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Copy, Lock, Loader2, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import {
  useGetLuluCoverDimensionsMutation,
  useLazyGetLuluCoverValidationResultQuery,
  useLazyGetLuluInteriorValidationResultQuery,
  useValidateLuluCoverMutation,
  useValidateLuluInteriorMutation,
} from "../../../Api/adminApi";
import FileDropzone from "../../../components/FileDropzone";
import { getApiErrorMessage } from "../../../utils/apiError";
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

const INTERIOR_PASSED = ["VALIDATED", "NORMALIZED"];
const IN_PROGRESS = ["VALIDATING", "NORMALIZING"];

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
  if (unit === "in" || unit === "inch") return n;
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

const Step = ({ number, title, description, right, locked, lockedText, children }) => (
  <div className="p-4 border border-black/10 rounded-xl space-y-3">
    <div className="flex items-start justify-between gap-3">
      <div className="flex gap-3">
        <span
          className={`w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${
            locked ? "bg-gray-300" : "bg-teal-600"
          }`}
        >
          {locked ? <Lock className="w-3 h-3" /> : number}
        </span>
        <div>
          <p className="text-sm font-bold text-neutral-900">{title}</p>
          <p className="text-xs text-gray-500">{locked ? lockedText : description}</p>
        </div>
      </div>
      {right}
    </div>
    {!locked && <div className="pl-9 space-y-3">{children}</div>}
  </div>
);

/**
 * Guided print setup. The order follows what Lulu can tell us:
 * check the interior first, and Lulu reports the page count and the formats that fit it.
 * Before the book is saved, files can be picked but nothing that calls Lulu can run.
 */
const PrintSetup = ({ book: savedBook, form, setForm, errors, fileProps, ensureSaved, onRefresh, syncFromServer }) => {
  const saved = !!savedBook;
  const book = savedBook || {};

  const [validateInterior] = useValidateLuluInteriorMutation();
  const [pollInterior] = useLazyGetLuluInteriorValidationResultQuery();
  const [getCoverDimensions, { isLoading: calculating }] = useGetLuluCoverDimensionsMutation();
  const [validateCover] = useValidateLuluCoverMutation();
  const [pollCover] = useLazyGetLuluCoverValidationResultQuery();

  const [busy, setBusy] = useState(null); // "interior" | "format" | "cover" | null
  const [messages, setMessages] = useState({});
  const [filters, setFilters] = useState({ binding: "", color: "" });
  const [showAllFormats, setShowAllFormats] = useState(false);
  const [typedId, setTypedId] = useState("");
  const [typedResult, setTypedResult] = useState(null); // {ok, text}
  const [manualPages, setManualPages] = useState(false);
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

  const interiorPassed = INTERIOR_PASSED.includes(interiorStatus);
  const interiorBusy = busy === "interior" || IN_PROGRESS.includes(interiorStatus);
  const coverBusy = busy === "cover" || coverStatus === "NORMALIZING";
  const formatUnlocked = interiorPassed || validIds.length > 0 || !!form.lulu_pod_package_id;
  const pages = Number(form.page_count) || 0;

  const setMessage = (key, text) => setMessages((prev) => ({ ...prev, [key]: text }));

  // Lulu works in the background. Poll for a few minutes and leave a "Check status" button for longer waits.
  const pollUntilDone = async (kind, terminal) => {
    const trigger = kind === "interior" ? pollInterior : pollCover;
    for (let attempt = 0; attempt < 45; attempt += 1) {
      await sleep(4000);
      if (!mounted.current) return null;
      try {
        const result = await trigger(book.slug).unwrap();
        if (terminal.includes(result.status)) {
          if (kind === "interior" && INTERIOR_PASSED.includes(result.status) && result.page_count) {
            syncFromServer({ page_count: String(result.page_count) });
          }
          await onRefresh();
          return result;
        }
      } catch (err) {
        setMessage(kind, getApiErrorMessage(err, "Could not check the status with Lulu."));
        return null;
      }
    }
    setMessage(kind, "Lulu is still working on it. Press “Check status” in a minute.");
    return null;
  };

  const runInterior = async () => {
    setMessage("interior", "");
    setBusy("interior");
    try {
      await validateInterior({ slug: book.slug }).unwrap();
      await onRefresh();
      await pollUntilDone("interior", ["VALIDATED", "NORMALIZED", "ERROR"]);
    } catch (err) {
      setMessage("interior", getApiErrorMessage(err, "Could not send the file to Lulu."));
    } finally {
      if (mounted.current) setBusy(null);
    }
  };

  const checkTypedFormat = async () => {
    const id = typedId.trim().toUpperCase();
    if (!id) return;
    setTypedResult(null);
    setBusy("format");
    try {
      await validateInterior({ slug: book.slug, pod_package_id: id }).unwrap();
      await onRefresh();
      const result = await pollUntilDone("interior", ["NORMALIZED", "ERROR"]);
      if (!result || !mounted.current) return;
      if (result.status === "NORMALIZED") {
        setForm((f) => ({ ...f, lulu_pod_package_id: id }));
        setTypedResult({ ok: true, text: "Lulu accepts this format for your interior. It is selected. Remember to save." });
        setTypedId("");
      } else {
        const why = (result.errors || []).map(errorText).join(" ");
        setTypedResult({ ok: false, text: `Lulu did not accept this format. ${why}`.trim() });
      }
    } catch (err) {
      setTypedResult({ ok: false, text: getApiErrorMessage(err, "Could not check this format with Lulu.") });
    } finally {
      if (mounted.current) setBusy(null);
    }
  };

  const runCover = async () => {
    setMessage("cover", "");
    setBusy("cover");
    try {
      if (!(await ensureSaved())) return;
      await validateCover(book.slug).unwrap();
      await onRefresh();
      await pollUntilDone("cover", ["NORMALIZED", "ERROR"]);
    } catch (err) {
      setMessage("cover", getApiErrorMessage(err, "Could not send the file to Lulu."));
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
      if (kind === "interior" && INTERIOR_PASSED.includes(result.status) && result.page_count) {
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
              : "Work through the steps in order. Orders can't be printed until both files pass Lulu's check."}
          </p>
        </div>
      </div>

      <Step
        number={1}
        title="Interior PDF"
        description="The pages of the book, ready for print. Lulu counts the pages and lists the formats that fit."
        right={<StatusPill status={saved ? interiorStatus : "NOT_SUBMITTED"} />}
      >
        <FileDropzone label="Interior PDF" required kind="pdf" {...fileProps("physical_file")} />
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={!saved || !book.physical_file || interiorBusy || busy === "format"}
            onClick={runInterior}
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
          {!saved ? (
            <span className="text-xs text-gray-500">Available after you save the draft.</span>
          ) : (
            !book.physical_file && <span className="text-xs text-amber-700">Upload the interior PDF first.</span>
          )}
        </div>
        {messages.interior && <p className="text-xs text-rose-600">{messages.interior}</p>}
        {interiorErrors.length > 0 && (
          <ul className="text-xs text-rose-600 list-disc pl-4 space-y-0.5">
            {interiorErrors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        )}
      </Step>

      <Step
        number={2}
        title="Print format"
        description="Paper size, binding and colour. Lulu suggests the ones that fit your interior."
        locked={!formatUnlocked}
        lockedText="Check the interior with Lulu first. It tells us which formats fit."
      >
        <div id="field-lulu_pod_package_id" className="scroll-mt-28 space-y-3">
          <div
            className={`p-3 rounded-lg border text-sm ${
              errors.lulu_pod_package_id ? "border-rose-300 bg-rose-50" : "border-black/10 bg-gray-50"
            }`}
          >
            {form.lulu_pod_package_id ? (
              <>
                <p className="font-semibold text-neutral-900">{describePackage(form.lulu_pod_package_id)}</p>
                <p className="text-[11px] text-gray-500 break-all">{form.lulu_pod_package_id}</p>
              </>
            ) : (
              <p className="text-gray-500">No format chosen yet.</p>
            )}
            {errors.lulu_pod_package_id && <p className="text-xs text-rose-600 mt-1">{errors.lulu_pod_package_id}</p>}
          </div>

          {validIds.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-neutral-700">Formats that fit your interior ({validIds.length}). Narrow down, then click one:</p>
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
              <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto">
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
                    {describePackage(id)}
                  </button>
                ))}
              </div>
              {suggestions.length > 12 && (
                <button type="button" onClick={() => setShowAllFormats((v) => !v)} className="text-xs text-teal-700 hover:underline">
                  {showAllFormats ? "Show fewer" : `Show all ${suggestions.length}`}
                </button>
              )}
              {suggestions.length === 0 && <p className="text-xs text-gray-500">No formats match those filters.</p>}
            </div>
          )}

          <div className="pt-1 space-y-2 border-t border-black/5">
            <p className="text-xs font-semibold text-neutral-700">Can't find the one you want?</p>
            <p className="text-xs text-gray-500">Type the format ID yourself and Lulu will check it against your interior.</p>
            <div className="flex gap-2">
              <input
                value={typedId}
                onChange={(e) => setTypedId(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    checkTypedFormat();
                  }
                }}
                placeholder="0600X0900.BW.STD.PB.060UW444.MXX"
                className={`${inputClass(false)} flex-1 font-mono text-xs`}
              />
              <button
                type="button"
                disabled={!saved || !book.physical_file || !typedId.trim() || !!busy || interiorBusy}
                onClick={checkTypedFormat}
                className="px-4 h-11 bg-white border border-black/10 hover:bg-gray-50 disabled:opacity-40 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0"
              >
                {busy === "format" && <Loader2 className="w-4 h-4 animate-spin" />}
                Check this ID with Lulu
              </button>
            </div>
            {typedResult && (
              <p className={`text-xs ${typedResult.ok ? "text-emerald-700" : "text-rose-600"}`}>{typedResult.text}</p>
            )}
          </div>

          <div className="pt-1 border-t border-black/5 text-sm">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-gray-600">Page count:</span>
              <span id="field-page_count" className="font-semibold text-neutral-900">
                {pages > 0 ? `${pages} (counted by Lulu)` : "Not known yet"}
              </span>
              <button type="button" onClick={() => setManualPages((v) => !v)} className="text-xs text-teal-700 hover:underline">
                {manualPages ? "Done" : "Enter manually"}
              </button>
            </div>
            {manualPages && (
              <input
                type="number"
                min="1"
                value={form.page_count}
                onChange={(e) => setForm((f) => ({ ...f, page_count: e.target.value }))}
                className={`${inputClass(!!errors.page_count)} max-w-[160px] mt-2`}
              />
            )}
            {errors.page_count && <p className="text-xs text-rose-600 mt-1">{errors.page_count}</p>}
            <p className="text-xs text-gray-500 mt-1">Changing the format or page count means the cover size and cover check must be redone.</p>
          </div>
        </div>
      </Step>

      <Step
        number={3}
        title="Cover size"
        description="The cover is one wide PDF: back, spine and front together. Lulu works out the exact size."
        locked={!form.lulu_pod_package_id || pages <= 0}
        lockedText="Choose a print format (and make sure the page count is known) first."
      >
        <button
          type="button"
          onClick={calculateCoverSize}
          disabled={calculating || !saved}
          className="px-4 h-10 bg-white border border-black/10 hover:bg-gray-50 disabled:opacity-40 rounded-lg text-xs font-bold flex items-center gap-2"
        >
          {calculating && <Loader2 className="w-4 h-4 animate-spin" />}
          {size ? "Recalculate cover size" : "Calculate cover size"}
        </button>
        {!saved && <p className="text-xs text-gray-500">Available after you save the draft.</p>}
        {messages.size && <p className="text-xs text-rose-600">{messages.size}</p>}
        {size ? (
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-teal-800">{size.inches}</p>
              <p className="text-xs text-teal-700">
                {size.mm} ({size.raw})
              </p>
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
        right={<StatusPill status={saved ? coverStatus : "NOT_SUBMITTED"} />}
      >
        <FileDropzone label="Print cover PDF" required kind="pdf" {...fileProps("lulu_cover_pdf")} />
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={!saved || !book.lulu_cover_pdf || !form.lulu_pod_package_id || pages <= 0 || coverBusy}
            onClick={runCover}
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
          {!saved ? (
            <span className="text-xs text-gray-500">Available after you save the draft.</span>
          ) : !book.lulu_cover_pdf ? (
            <span className="text-xs text-amber-700">Upload the cover PDF first.</span>
          ) : !form.lulu_pod_package_id || pages <= 0 ? (
            <span className="text-xs text-amber-700">Choose a print format first.</span>
          ) : null}
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
