import { useEffect, useRef, useState } from "react";
import { Link, useBlocker, useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Circle,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  Save,
  Send,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  useAddBookCategoryMutation,
  useAddBookMutation,
  useGetBookCategoriesQuery,
  useGetBookDetailsQuery,
  useUpdateBookMutation,
} from "../../Api/adminApi";
import { api } from "../../Api/api";
import FileDropzone from "../../components/FileDropzone";
import TextEditor from "../../components/Editor";
import { getApiErrorMessage, getFieldErrors } from "../../utils/apiError";
import { uploadWithProgress } from "../../utils/uploadFile";
import {
  LANGUAGES,
  bookToForm,
  buildChecklist,
  checkFile,
  emptyForm,
  formToPayload,
  payloadToFormData,
  stripHtml,
  validateForm,
} from "./editor/bookFormModel";
import Field, { Section } from "./editor/Field";
import { inputClass } from "./editor/formStyles";
import GalleryManager from "./editor/GalleryManager";
import PrintSetup from "./editor/PrintSetup";

const FILE_KIND = {
  cover_image: "image",
  sample_file: "pdf",
  digital_file: "pdf",
  physical_file: "pdf",
  lulu_cover_pdf: "pdf",
};

// Order used to scroll to the first problem.
const PROBLEM_ORDER = [
  "title", "author", "author_designation", "description", "publisher", "published_date",
  "cover_image", "gallery_images", "editions", "digital_price", "digital_isbn", "digital_file",
  "physical_price", "physical_isbn", "page_count", "lulu_pod_package_id", "physical_file",
  "lulu_cover_pdf", "video_url", "tags", "category", "language", "slug",
];

// Description is compared as text: the rich-text editor rewrites markup when it loads.
const formKey = (form) => JSON.stringify({ ...form, description: stripHtml(form.description) });

const scrollToField = (name) => {
  const target =
    document.getElementById(`field-${name}`) ||
    document.getElementById(name === "editions" ? "section-editions" : "");
  target?.scrollIntoView({ behavior: "smooth", block: "center" });
};

const Checklist = ({ items }) => {
  const missing = items.filter((i) => !i.done && !i.recommended).length;
  return (
    <div className="bg-white rounded-2xl border border-black/10 shadow-sm p-5 space-y-3">
      <div>
        <p className="text-sm font-bold text-neutral-950">Ready to publish?</p>
        <p className="text-xs text-gray-500">
          {missing === 0 ? "Everything needed is in place." : `${missing} thing${missing === 1 ? "" : "s"} left to do.`}
        </p>
      </div>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item.key}>
            <button
              type="button"
              onClick={() => document.getElementById(item.target)?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="flex items-start gap-2 text-left text-sm w-full hover:bg-gray-50 rounded-md px-1 py-0.5"
            >
              {item.done ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              ) : (
                <Circle className={`w-4 h-4 mt-0.5 shrink-0 ${item.recommended ? "text-amber-400" : "text-gray-300"}`} />
              )}
              <span className={item.done ? "text-gray-500" : "text-neutral-900"}>
                {item.label}
                {item.recommended && !item.done && <span className="text-amber-600 text-xs"> (recommended)</span>}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

const EditionCard = ({ enabled, onToggle, title, subtitle, children }) => (
  <div className={`rounded-xl border ${enabled ? "border-teal-300 bg-teal-50/30" : "border-black/10 bg-gray-50/50"}`}>
    <label className="flex items-start gap-3 p-4 cursor-pointer">
      <input type="checkbox" checked={enabled} onChange={(e) => onToggle(e.target.checked)} className="mt-1 w-4 h-4 accent-teal-600" />
      <span>
        <span className="block text-sm font-bold text-neutral-950">{title}</span>
        <span className="block text-xs text-gray-500">{subtitle}</span>
      </span>
    </label>
    {enabled && <div className="px-4 pb-4 pt-1 space-y-4">{children}</div>}
  </div>
);

const BookEditor = () => {
  const { slug: routeSlug } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [createdSlug, setCreatedSlug] = useState(null);
  const slug = routeSlug || createdSlug;
  const isNew = !slug;

  const {
    data: book,
    isFetching: fetchingBook,
    isError: bookFailed,
    error: bookError,
    refetch,
  } = useGetBookDetailsQuery(slug, { skip: !slug, refetchOnMountOrArgChange: true });
  const { data: categories = [] } = useGetBookCategoriesQuery();
  const [addBook] = useAddBookMutation();
  const [updateBook] = useUpdateBookMutation();
  const [addCategory] = useAddBookCategoryMutation();

  const [form, setForm] = useState(emptyForm);
  const [baseline, setBaseline] = useState(() => formKey(emptyForm()));
  const [seededFor, setSeededFor] = useState(routeSlug ? null : "__new__");
  const [pending, setPending] = useState({});
  const [galleryQueue, setGalleryQueue] = useState([]);
  const [uploads, setUploads] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [banner, setBanner] = useState(null);
  const [busyAction, setBusyAction] = useState(null);
  const [newCategory, setNewCategory] = useState("");
  const abortRefs = useRef({});
  const allowLeaveRef = useRef(false);

  // Fill the form from the server once per book, never on later refetches,
  // so background refreshes can't wipe what the user is typing.
  if (book && !fetchingBook && book.slug === slug && seededFor !== slug) {
    const next = bookToForm(book);
    setForm(next);
    setBaseline(formKey(next));
    setSeededFor(slug);
  }

  // Right after the first save the typed values stay on screen while the saved book loads.
  const ready = isNew || seededFor === slug || seededFor === "__new__";
  const dirty =
    ready &&
    (formKey(form) !== baseline || Object.keys(pending).length > 0 || galleryQueue.length > 0);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      !allowLeaveRef.current && dirty && currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const update = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  // Navigate away after our own save without tripping the unsaved-changes prompt.
  const goWithoutPrompt = (path) => {
    allowLeaveRef.current = true;
    navigate(path, { replace: true });
    setTimeout(() => {
      allowLeaveRef.current = false;
    }, 1000);
  };

  const refreshBook = async () => {
    if (slug) await refetch();
  };

  // ------------------------------------------------------------------ files
  const setUpload = (field, value) => setUploads((prev) => ({ ...prev, [field]: value }));
  const removePending = (field) =>
    setPending((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });

  const uploadField = async (targetSlug, field, file) => {
    const controller = new AbortController();
    abortRefs.current[field] = controller;
    setUpload(field, { state: "uploading", progress: 0 });
    try {
      const body = new FormData();
      body.append("file", file);
      await uploadWithProgress(`books/${targetSlug}/files/${field}/`, body, {
        signal: controller.signal,
        onProgress: (progress) => setUpload(field, { state: "uploading", progress }),
      });
      setUpload(field, { state: "done" });
      // Files upload outside RTK Query, so tell it the book changed. Without this the
      // page can keep showing the book as it was before the file arrived.
      dispatch(api.util.invalidateTags(["books"]));
      removePending(field);
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
      return true;
    } catch (err) {
      setUpload(
        field,
        err?.aborted ? { state: "idle" } : { state: "error", error: getApiErrorMessage(err, "The upload failed. Try again.") },
      );
      return false;
    }
  };

  const onSelectFile = async (field, file) => {
    const problem = checkFile(file, FILE_KIND[field]);
    if (problem) {
      setUpload(field, { state: "error", error: problem });
      return;
    }
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    setPending((prev) => ({ ...prev, [field]: file }));
    if (slug) {
      // The book exists, so send the file straight away.
      if (await uploadField(slug, field, file)) await refreshBook();
    } else {
      setUpload(field, { state: "idle" });
    }
  };

  const fileProps = (field) => ({
    id: `field-${field}`,
    kind: FILE_KIND[field],
    currentUrl: book?.[field] || null,
    file: pending[field] || null,
    status: uploads[field],
    error: fieldErrors[field],
    disabled: !!busyAction,
    onSelect: (file) => onSelectFile(field, file),
    onClear: () => {
      removePending(field);
      setUpload(field, undefined);
    },
    onCancel: () => {
      abortRefs.current[field]?.abort();
      if (slug) removePending(field);
    },
    onRetry: pending[field]
      ? async () => {
          if (slug && (await uploadField(slug, field, pending[field]))) await refreshBook();
        }
      : undefined,
  });

  const uploadQueued = async (targetSlug, files) => {
    let failed = 0;
    for (const [field, file] of Object.entries(files)) {
      if (!(await uploadField(targetSlug, field, file))) failed += 1;
    }
    return failed;
  };

  // ----------------------------------------------------------------- saving
  const showProblems = (errors, text) => {
    setFieldErrors(errors);
    const first = PROBLEM_ORDER.find((key) => errors[key]) || Object.keys(errors)[0];
    setBanner({
      title: text || "Please fix the following before saving:",
      items: Object.entries(errors).map(([field, message]) => message || field),
    });
    if (first) setTimeout(() => scrollToField(first), 50);
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const showServerError = (err, fallback) => {
    const errors = getFieldErrors(err);
    setFieldErrors(errors);
    setBanner({ title: getApiErrorMessage(err, fallback), items: [] });
    const first = PROBLEM_ORDER.find((key) => errors[key]);
    if (first) setTimeout(() => scrollToField(first), 50);
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // makeVisible: true publishes, false hides/keeps as draft, undefined keeps the current choice.
  const persist = async ({ makeVisible, silent = false } = {}) => {
    const visible = makeVisible ?? (isNew ? false : form.is_visible);
    const nextForm = { ...form, is_visible: visible };
    const errors = validateForm(nextForm, { book, pending }, visible);
    if (Object.keys(errors).length) {
      showProblems(errors);
      toast.error(`${Object.keys(errors).length} thing(s) need fixing`);
      return null;
    }

    setBanner(null);
    setFieldErrors({});
    let createdHere = null;
    try {
      if (isNew) {
        const payload = formToPayload({ ...nextForm, is_visible: false });
        const files = { cover_image: pending.cover_image, gallery_images: galleryQueue };
        createdHere = await addBook(payloadToFormData(payload, files)).unwrap();
        setCreatedSlug(createdHere.slug);
        removePending("cover_image");
        setGalleryQueue([]);

        const { cover_image: _cover, ...rest } = pending;
        const failed = await uploadQueued(createdHere.slug, rest);
        if (failed) {
          setBanner({
            title: `The book was saved as a draft, but ${failed} file${failed === 1 ? "" : "s"} did not upload. Use “Try again” on the file below, then publish.`,
            items: [],
          });
          return createdHere;
        }
        if (visible) await updateBook({ slug: createdHere.slug, body: { is_visible: true } }).unwrap();
        toast.success(visible ? "Book published" : "Draft saved");
        goWithoutPrompt(`/admin/book-library/${createdHere.slug}/edit`);
        return createdHere;
      }

      const updated = await updateBook({ slug, body: formToPayload(nextForm) }).unwrap();
      const saved = bookToForm(updated);
      setForm(saved);
      setBaseline(formKey(saved));
      if (!silent) toast.success(visible && !book?.is_visible ? "Book published" : "Saved");
      if (updated.slug !== slug) goWithoutPrompt(`/admin/book-library/${updated.slug}/edit`);
      return updated;
    } catch (err) {
      showServerError(
        err,
        createdHere ? "The draft was saved but could not be published." : "Could not save the book.",
      );
      return null;
    }
  };

  const runAction = async (action, options) => {
    setBusyAction(action);
    try {
      await persist(options);
    } finally {
      setBusyAction(null);
    }
  };

  const ensureSaved = async () => {
    if (isNew) return false;
    if (formKey(form) === baseline) return true;
    return !!(await persist({ silent: true }));
  };

  const syncFromServer = (partial) => {
    setForm((prev) => ({ ...prev, ...partial }));
    setBaseline((prev) => {
      const parsed = JSON.parse(prev);
      return JSON.stringify({ ...parsed, ...partial });
    });
  };

  const handleAddCategory = async () => {
    const name = newCategory.trim();
    if (!name) return;
    try {
      const created = await addCategory(name).unwrap();
      setNewCategory("");
      if (created?.id) update("category", String(created.id));
      toast.success("Category added");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not add the category."));
    }
  };

  // ----------------------------------------------------------------- render
  if (!isNew && bookFailed) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-rose-600 font-bold">{getApiErrorMessage(bookError, "Could not load this book.")}</p>
        <Link to="/admin/book-library" className="text-teal-700 hover:underline inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to the library
        </Link>
      </div>
    );
  }
  if (!ready) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        <p className="text-sm text-gray-500">Loading the book…</p>
      </div>
    );
  }

  const ctx = { book, pending };
  const checklist = buildChecklist(form, ctx);
  const live = !!book?.is_visible;
  const busy = !!busyAction;
  const languages = LANGUAGES.includes(form.language) ? LANGUAGES : [form.language, ...LANGUAGES];
  const uploadingNow = Object.values(uploads).some((u) => u?.state === "uploading");

  return (
    <div className="pb-28 arimo-font">
      <div className="mb-6 space-y-3">
        <Link to="/admin/book-library" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-teal-700">
          <ArrowLeft className="w-4 h-4" /> Back to the library
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-neutral-950">
            {isNew ? "Add a new book" : form.title || "Edit book"}
          </h1>
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
              live ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
            }`}
          >
            {isNew ? "New (not saved yet)" : live ? "Live on the store" : "Draft (hidden)"}
          </span>
        </div>
        <p className="text-sm text-gray-500">
          {isNew
            ? "Fill in the details and save a draft. Nothing is shown to customers until you press Publish."
            : "Changes are saved when you press Save. Files you choose upload straight away."}
        </p>
      </div>

      {banner && (
        <div role="alert" className="mb-6 p-4 rounded-xl border border-rose-200 bg-rose-50 text-sm text-rose-800 flex gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">{banner.title}</p>
            {banner.items.length > 0 && (
              <ul className="list-disc pl-5 space-y-0.5">
                {banner.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
        <div className="space-y-6 min-w-0">
          <Section id="section-basics" title="1. About the book" description="What customers read on the book page.">
            <Field id="title" label="Book title" required error={fieldErrors.title}>
              <input id="title" value={form.title} onChange={(e) => update("title", e.target.value)} className={inputClass(!!fieldErrors.title)} placeholder="e.g. The Healing Heart" />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id="author" label="Author" required error={fieldErrors.author}>
                <input id="author" value={form.author} onChange={(e) => update("author", e.target.value)} className={inputClass(!!fieldErrors.author)} />
              </Field>
              <Field id="author_designation" label="Author's title or role" required error={fieldErrors.author_designation} hint="For example: Islamic scholar, Counsellor">
                <input id="author_designation" value={form.author_designation} onChange={(e) => update("author_designation", e.target.value)} className={inputClass(!!fieldErrors.author_designation)} />
              </Field>
            </div>
            <Field id="description" label="Description" required error={fieldErrors.description}>
              <div className={`rounded-xl overflow-hidden border ${fieldErrors.description ? "border-rose-300" : "border-black/10"}`}>
                <TextEditor htmlElement={form.description} isEditable onChange={(html) => update("description", html)} />
              </div>
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id="category" label="Category" error={fieldErrors.category}>
                <select id="category" value={form.category} onChange={(e) => update("category", e.target.value)} className={inputClass(!!fieldErrors.category)}>
                  <option value="">No category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <div className="flex gap-2 pt-1.5">
                  <input
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCategory();
                      }
                    }}
                    placeholder="Or add a new category"
                    className="flex-1 h-9 px-3 text-xs bg-white border border-black/10 rounded-lg outline-none focus:ring-2 focus:ring-teal-600/15"
                  />
                  <button type="button" onClick={handleAddCategory} className="px-3 h-9 bg-white border border-black/10 rounded-lg text-xs font-medium hover:bg-gray-50 flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
              </Field>
              <Field id="language" label="Language" error={fieldErrors.language}>
                <select id="language" value={form.language} onChange={(e) => update("language", e.target.value)} className={inputClass(!!fieldErrors.language)}>
                  {languages.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id="publisher" label="Publisher" required error={fieldErrors.publisher}>
                <input id="publisher" value={form.publisher} onChange={(e) => update("publisher", e.target.value)} className={inputClass(!!fieldErrors.publisher)} />
              </Field>
              <Field id="published_date" label="Publication date" required error={fieldErrors.published_date}>
                <input id="published_date" type="date" value={form.published_date} onChange={(e) => update("published_date", e.target.value)} className={inputClass(!!fieldErrors.published_date)} />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id="tags" label="Tags" error={fieldErrors.tags} hint="Optional. Separate with commas, e.g. Psychology, Healing">
                <input id="tags" value={form.tags} onChange={(e) => update("tags", e.target.value)} className={inputClass(!!fieldErrors.tags)} />
              </Field>
              <Field id="video_url" label="Intro video link" error={fieldErrors.video_url} hint="Optional. A link starting with https://">
                <input id="video_url" value={form.video_url} onChange={(e) => update("video_url", e.target.value)} className={inputClass(!!fieldErrors.video_url)} />
              </Field>
            </div>
          </Section>

          <Section id="section-files" title="2. Cover and photos" description="The cover is shown cropped to a tall 4:5 shape on the website, so keep important text away from the edges.">
            <FileDropzone
              label="Cover image"
              required
              hint="JPG, PNG or WebP, up to 10 MB"
              {...fileProps("cover_image")}
            />
            <GalleryManager
              slug={slug}
              images={book?.gallery_images || []}
              queued={galleryQueue}
              onQueue={(files) => setGalleryQueue((prev) => [...prev, ...files])}
              onUnqueue={(index) => setGalleryQueue((prev) => prev.filter((_, i) => i !== index))}
              onChanged={refreshBook}
              error={fieldErrors.gallery_images}
            />
            <FileDropzone
              label="Free sample (PDF)"
              hint="Optional. A few pages anyone can read. Up to 100 MB"
              {...fileProps("sample_file")}
            />
          </Section>

          <Section id="section-editions" title="3. Editions and prices" description="Choose how customers can buy this book.">
            {fieldErrors.editions && (
              <p className="text-xs text-rose-600 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> {fieldErrors.editions}
              </p>
            )}
            <EditionCard
              enabled={form.has_digital}
              onToggle={(v) => update("has_digital", v)}
              title="Digital edition"
              subtitle="A PDF customers read online after buying."
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field id="digital_price" label="Price (USD)" required error={fieldErrors.digital_price}>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input id="digital_price" inputMode="decimal" value={form.digital_price} onChange={(e) => update("digital_price", e.target.value)} className={`${inputClass(!!fieldErrors.digital_price)} pl-7`} placeholder="12.50" />
                  </div>
                </Field>
                <Field id="digital_isbn" label="Digital ISBN" required error={fieldErrors.digital_isbn} hint="10 or 13 digits. Hyphens are fine.">
                  <input id="digital_isbn" value={form.digital_isbn} onChange={(e) => update("digital_isbn", e.target.value)} className={inputClass(!!fieldErrors.digital_isbn)} placeholder="978-…" />
                </Field>
              </div>
              <FileDropzone
                label="Digital PDF"
                required
                hint="The full book buyers receive. Up to 100 MB"
                {...fileProps("digital_file")}
              />
            </EditionCard>

            <EditionCard
              enabled={form.has_physical}
              onToggle={(v) => update("has_physical", v)}
              title="Physical edition (printed on demand)"
              subtitle="Printed and posted by Lulu when someone orders. No stock to manage."
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field id="physical_price" label="Price (USD)" required error={fieldErrors.physical_price}>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input id="physical_price" inputMode="decimal" value={form.physical_price} onChange={(e) => update("physical_price", e.target.value)} className={`${inputClass(!!fieldErrors.physical_price)} pl-7`} placeholder="24.00" />
                  </div>
                </Field>
                <Field id="physical_isbn" label="Physical ISBN" required error={fieldErrors.physical_isbn} hint="Different from the digital ISBN.">
                  <input id="physical_isbn" value={form.physical_isbn} onChange={(e) => update("physical_isbn", e.target.value)} className={inputClass(!!fieldErrors.physical_isbn)} placeholder="978-…" />
                </Field>
              </div>
              {!form.lulu_pod_package_id && (
                <Field id="stock_count" label="Copies in stock" hint="Only used until a print format is chosen. Books printed by Lulu are never out of stock.">
                  <input id="stock_count" type="number" min="0" value={form.stock_count} onChange={(e) => update("stock_count", e.target.value)} className={`${inputClass(false)} max-w-[160px]`} />
                </Field>
              )}
              <p className="text-xs text-gray-600">
                The print files and Lulu checks are in step 4 below.
              </p>
            </EditionCard>
          </Section>

          {form.has_physical && (
            <Section
              id="section-print"
              title="4. Print setup"
              description="Get the book ready for Lulu to print. Each step builds on the one before."
            >
              <PrintSetup
                book={isNew ? null : book}
                form={form}
                setForm={setForm}
                errors={fieldErrors}
                fileProps={fileProps}
                ensureSaved={ensureSaved}
                onRefresh={refreshBook}
                syncFromServer={syncFromServer}
              />
            </Section>
          )}

          <Section id="section-review" title={form.has_physical ? "5. Review and publish" : "4. Review and publish"}>
            <div className="lg:hidden">
              <Checklist items={checklist} />
            </div>
            <p className="text-sm text-gray-600">
              {live
                ? "This book is live. Use Save changes to update it, or hide it to take it off the store (people who bought it keep access)."
                : "This book is a draft and customers can't see it. Press Publish when the checklist is complete."}
            </p>
          </Section>
        </div>

        <aside className="hidden lg:block sticky top-24">
          <Checklist items={checklist} />
        </aside>
      </div>

      <div className="sticky bottom-0 -mx-4 sm:mx-0 mt-8 z-30">
        <div className="bg-white/95 backdrop-blur border border-black/10 sm:rounded-2xl shadow-lg px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-gray-500 min-h-[1rem]">
            {uploadingNow
              ? "Uploading files. Keep this page open."
              : dirty
                ? "You have unsaved changes."
                : "All changes saved."}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/admin/book-library" className="px-4 h-10 inline-flex items-center border border-black/10 rounded-lg text-sm hover:bg-gray-50">
              {dirty ? "Discard" : "Close"}
            </Link>
            {live ? (
              <>
                <button
                  type="button"
                  disabled={busy || uploadingNow}
                  onClick={() => runAction("hide", { makeVisible: false })}
                  className="px-4 h-10 border border-black/10 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
                >
                  {busyAction === "hide" ? <Loader2 className="w-4 h-4 animate-spin" /> : <EyeOff className="w-4 h-4" />}
                  Hide from store
                </button>
                <button
                  type="button"
                  disabled={busy || uploadingNow}
                  onClick={() => runAction("save", { makeVisible: true })}
                  className="px-5 h-10 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center gap-2"
                >
                  {busyAction === "save" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save changes
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  disabled={busy || uploadingNow}
                  onClick={() => runAction("save", { makeVisible: false })}
                  className="px-4 h-10 border border-black/10 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
                >
                  {busyAction === "save" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save draft
                </button>
                <button
                  type="button"
                  disabled={busy || uploadingNow}
                  onClick={() => runAction("publish", { makeVisible: true })}
                  className="px-5 h-10 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center gap-2"
                >
                  {busyAction === "publish" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Publish book
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {blocker.state === "blocked" && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center gap-2 text-neutral-950">
              {live ? <Eye className="w-5 h-5 text-amber-600" /> : <AlertCircle className="w-5 h-5 text-amber-600" />}
              <h3 className="font-bold">Leave without saving?</h3>
            </div>
            <p className="text-sm text-gray-600">You have changes that haven't been saved. They will be lost.</p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => blocker.reset()} className="px-4 h-10 border border-black/10 rounded-lg text-sm hover:bg-gray-50">
                Keep editing
              </button>
              <button type="button" onClick={() => blocker.proceed()} className="px-4 h-10 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700">
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookEditor;
