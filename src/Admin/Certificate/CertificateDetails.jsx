import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Search,
  Award,
  RotateCcw,
  Eye,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  useGetCompletedStudentsQuery,
  useGetCertificateTemplatesQuery,
  useLazyGetCertificateTemplatePreviewQuery,
  useIssueCertificatesMutation
} from "../../Api/adminApi";
import Pagination from "../../components/Pagination";
import ManageTemplatesModal from "./ManageTemplatesModal";

const StudentRow = ({ enrollment, isSelected, onSelect }) => {
  const statusStyles = {
    Issued: {
      bg: "bg-green-100",
      border: "outline-green-200",
      dot: "outline-green-700",
      text: "text-green-700",
    },
    Eligible: {
      bg: "bg-yellow-100",
      border: "outline-yellow-200",
      dot: "outline-yellow-700",
      text: "text-yellow-700",
    },
  };

  const status = enrollment.has_certificate ? "Issued" : "Eligible";
  const style = statusStyles[status];

  const studentName = enrollment.student_name || `Student #${enrollment.enrollment_id}`;
  const studentEmail = enrollment.student_email || "";
  const initials = enrollment.student_name ? enrollment.student_name.charAt(0).toUpperCase() : "S";

  return (
    <div
      className={`w-full px-4 py-3 rounded-[10px] border ${isSelected ? "border-blue-300 bg-blue-50/30" : "border-neutral-200 bg-white"} cursor-pointer hover:border-blue-300 transition-all flex items-center gap-4`}
      onClick={() => onSelect(enrollment)}
    >
      <div className="flex items-center justify-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => { }} // handled by parent div click
          className="w-5 h-5 rounded border-neutral-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
        />
      </div>

      <div className="w-10 h-10 bg-slate-400 rounded-full flex justify-center items-center text-white font-bold text-sm shrink-0">
        {initials}
      </div>

      <div className="flex-1 flex flex-col truncate">
        <span className="text-neutral-800 text-base font-bold arimo-font truncate">
          {studentName}
        </span>
        {studentEmail && (
          <span className="text-neutral-500 text-sm font-normal arimo-font truncate">
            {studentEmail}
          </span>
        )}
      </div>

      <div className="w-32 flex flex-col items-end mr-4 sm:mr-8 shrink-0 hidden sm:flex">
        <span className="text-neutral-500 text-sm font-normal arimo-font">
          Completed
        </span>
        <span className="text-neutral-800 text-sm font-normal arimo-font">
          {new Date(enrollment.completed_at).toLocaleDateString()}
        </span>
      </div>

      <div
        className={`w-28 shrink-0 h-7 rounded-full flex justify-center items-center px-1.5 gap-2 outline outline-1 outline-offset-[-1px] ${style.bg} ${style.border}`}
      >
        <div className="w-3 h-3 relative flex items-center justify-center">
          <div
            className={`w-2 h-2 rounded-full border-[1.5px] ${style.dot.replace("outline", "border")}`}
          ></div>
        </div>
        <span className={`text-xs font-bold arimo-font ${style.text}`}>
          {status}
        </span>
      </div>
    </div>
  );
};

const CertificateDetails = ({ selectedCourse, onBack }) => {
  const [selectedEnrollments, setSelectedEnrollments] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [isFetchingPreview, setIsFetchingPreview] = useState(false);

  // Scaling state — sized to match the backend's US Letter landscape
  // (11in x 8.5in) render in certificates/utils.py, not A4.
  const containerRef = useRef(null);
  const [scale, setScale] = useState(0.65);
  const PAGE_W = 1056;
  const PAGE_H = 816;

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      const available = entry.contentRect.width - 64; // subtract padding
      setScale(Math.min(available / PAGE_W, 1));
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isPreviewOpen]);

  // Queries
  const { data: enrollmentsData, isLoading: isEnrollmentsLoading } = useGetCompletedStudentsQuery({ course: selectedCourse.id, page: currentPage });
  const { data: templatesData, isLoading: isTemplatesLoading } = useGetCertificateTemplatesQuery({ page_size: 1000 });
  const [fetchPreview] = useLazyGetCertificateTemplatePreviewQuery();
  const [issueCertificates, { isLoading: isIssuing }] = useIssueCertificatesMutation();

  const enrollmentsList = Array.isArray(enrollmentsData) ? enrollmentsData : (enrollmentsData?.results || []);
  const templatesList = templatesData?.results || [];

  // Default select first template when loaded
  useEffect(() => {
    if (templatesList.length > 0 && !selectedTemplateId) {
      setSelectedTemplateId(templatesList[0].id);
    }
  }, [templatesList, selectedTemplateId]);

  const handleSelectEnrollment = (enrollment) => {
    // The endpoint only returns completed students now, so no is_completed check block needed.
    const id = enrollment.enrollment_id;
    setSelectedEnrollments((prev) =>
      prev.includes(id) ? prev.filter((eid) => eid !== id) : [...prev, id],
    );
  };

  const handleDeselectAll = () => {
    setSelectedEnrollments([]);
  };

  const handlePreviewOpen = async () => {
    if (!selectedTemplateId) {
      toast.error("Please select a template first.");
      return;
    }
    setIsPreviewOpen(true);
    setIsFetchingPreview(true);
    setPreviewHtml("");
    try {
      const htmlStr = await fetchPreview(selectedTemplateId).unwrap();
      // Test if it's a 404 from DRF
      if (htmlStr.includes("Not Found")) {
        setPreviewHtml(`
            <div style="text-align: center; font-family: sans-serif; padding: 50px;">
               <h3>404 Error</h3>
               <p>The backend could not find a valid HTML preview for this template id: ${selectedTemplateId}</p>
            </div>
         `);
      } else {
        setPreviewHtml(htmlStr);
      }
    } catch (err) {
      setPreviewHtml(`
         <div style="text-align: center; font-family: sans-serif; padding: 50px; color: red;">
            <h3>Error Fetching Preview</h3>
            <p>Could not connect or fetch HTML render.</p>
         </div>
      `);
    } finally {
      setIsFetchingPreview(false);
    }
  };

  const handleGenerateClick = async () => {
    if (selectedEnrollments.length === 0) {
      toast.error("Please select at least one student.");
      return;
    }
    if (!selectedTemplateId) {
      toast.error("Please select a template from the dropdown.");
      return;
    }

    try {
      const result = await issueCertificates({
        enrollment_ids: selectedEnrollments,
        template_id: selectedTemplateId
      }).unwrap();

      const emailFailed = result?.email_failed || [];
      if (emailFailed.length > 0) {
        toast.error(
          `Certificates issued, but the email failed to send for: ${emailFailed.join(", ")}. Check the email template configuration.`
        );
      } else {
        toast.success(`Successfully issued certificates to ${selectedEnrollments.length} student(s)! Email dispatch has begun.`);
      }
      setSelectedEnrollments([]);
    } catch (err) {
      toast.error(err?.data?.detail || err?.data?.error || "Failed to issue certificates online.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-8 space-y-8 animate-in fade-in duration-500">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors pl-1 hover:bg-neutral-200/50 px-3 py-1.5 rounded-xl"
      >
        <ArrowLeft size={20} />
        <span className="text-base font-normal arimo-font">
          Back to Courses
        </span>
      </button>

      {/* Header & Action */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-neutral-800 text-2xl font-bold arimo-font">
            {selectedCourse.title}
          </h1>
          <p className="text-neutral-500 text-sm font-normal arimo-font mt-1">
            Instructor: {selectedCourse.instructor}
          </p>
        </div>
        <div className="flex flex-col gap-1 w-full md:min-w-[280px] md:w-auto">
          <label className="text-neutral-500 text-xs font-bold uppercase arimo-font flex justify-between items-center">
            <span>Certificate Template</span>
            {isTemplatesLoading && <div className="w-3 h-3 border-b-2 border-neutral-400 rounded-full animate-spin"></div>}
          </label>
          <div className="flex gap-2">
            <select
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-300 bg-white text-neutral-800 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-slate-300 transition-all cursor-pointer"
            >
              {templatesList.length === 0 ? (
                <option value="" disabled>No templates available</option>
              ) : (
                templatesList.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.name}
                  </option>
                ))
              )}
            </select>
            <button
              onClick={handlePreviewOpen}
              disabled={!selectedTemplateId}
              className="w-11 h-11 flex items-center justify-center rounded-xl border border-neutral-300 bg-white text-neutral-600 hover:bg-slate-50 hover:text-greenTeal transition-all shadow-sm group active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Preview Template"
            >
              <Eye size={20} />
            </button>
          </div>
          <button
            onClick={() => setIsManageModalOpen(true)}
            className="text-greenTeal text-xs font-bold uppercase tracking-widest hover:underline mt-1 text-left w-fit"
          >
            Manage Templates
          </button>
        </div>
      </div>

      {/* Template Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <div className="flex flex-col">
                <h3 className="text-neutral-800 text-lg font-bold arimo-font">
                  Template Preview HTML
                </h3>
                <p className="text-neutral-500 text-xs font-normal arimo-font">
                  Review the raw layout structure before issuing.
                </p>
              </div>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-neutral-100 text-neutral-500 transition-colors"
                title="Close"
              >
                <X size={24} />
              </button>
            </div>

            <div ref={containerRef} className="flex-1 bg-neutral-200 p-8 overflow-auto flex justify-center items-start">
              {isFetchingPreview ? (
                <div className="flex flex-col items-center justify-center h-full text-neutral-500 gap-4">
                  <div className="w-8 h-8 rounded-full border-2 border-t-greenTeal animate-spin"></div>
                  <p className="font-bold tracking-wider uppercase text-xs">Loading Template...</p>
                </div>
              ) : (
                <div style={{ width: PAGE_W * scale, height: PAGE_H * scale, flexShrink: 0 }}>
                  <div
                    className="shadow-2xl bg-white overflow-hidden"
                    style={{
                      width: PAGE_W,
                      height: PAGE_H,
                      transform: `scale(${scale})`,
                      transformOrigin: "top left",
                    }}
                  >
                    <iframe
                      title="Certificate Preview"
                      srcDoc={`<style>body,html{margin:0!important;padding:0!important;box-sizing:border-box;overflow:hidden!important;}</style>\n${previewHtml}`}
                      style={{ width: PAGE_W, height: PAGE_H }}
                      className="border-none bg-white block"
                      scrolling="no"
                      sandbox="allow-same-origin"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-neutral-100 flex justify-end bg-slate-50">
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="bg-neutral-800 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-neutral-700 transition-all active:scale-95"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Bar (Only shows when students selected) */}
      {selectedEnrollments.length > 0 && (
        <div className="w-full h-auto py-4 bg-white rounded-xl shadow-sm border border-neutral-200 px-6 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-200 sticky top-4 z-50">
          <div className="flex items-center gap-2">
            <span className="text-neutral-500 text-lg">Selected Enrollments:</span>
            <span className="text-neutral-800 text-2xl font-bold">
              {selectedEnrollments.length}
            </span>
          </div>
          <button
            onClick={handleGenerateClick}
            disabled={isIssuing}
            className="bg-greenTeal hover:bg-greenTeal/80 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-[10px] font-bold shadow-sm transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            {isIssuing ? (
              <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
            ) : (
              <Award size={18} />
            )}
            {isIssuing ? "Issuing Certificates..." : "Generate Certificates"}
          </button>
        </div>
      )}

      {/* Students List Container */}
      <div className="w-full bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 flex flex-col gap-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <h2 className="text-neutral-800 text-lg font-bold arimo-font flex items-center gap-2">
            Enrolled Students
            {isEnrollmentsLoading && <div className="w-3.5 h-3.5 border-2 border-b-greenTeal rounded-full animate-spin"></div>}
          </h2>

          <div className="flex items-center gap-4 flex-1 justify-end">
            {/* Search (visual only currently, real search needs API string 'search' param mapping if backend supports it) */}
            <div className="relative w-full sm:w-[350px]">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Filter currently viewed..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-[10px] border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>

            {selectedEnrollments.length > 0 && (
              <button
                onClick={handleDeselectAll}
                className="hidden sm:flex items-center gap-2 bg-white hover:bg-neutral-50 text-neutral-600 border border-neutral-200 px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm active:scale-95"
              >
                <RotateCcw size={18} />
                Deselect
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="flex flex-col gap-3">
          {enrollmentsList.length === 0 && !isEnrollmentsLoading ? (
            <div className="p-8 text-center text-neutral-500 rounded-xl bg-neutral-50 border border-neutral-200">
              No students are currently eligible for certificates in this course.
            </div>
          ) : (
            enrollmentsList
              .filter((enrollment) => {
                if (!searchQuery) return true;
                const name = enrollment.student_name || "";
                return name.toLowerCase().includes(searchQuery.toLowerCase());
              })
              .map((enrollment) => (
                <StudentRow
                  key={enrollment.enrollment_id}
                  enrollment={enrollment}
                  isSelected={selectedEnrollments.includes(enrollment.enrollment_id)}
                  onSelect={handleSelectEnrollment}
                />
              ))
          )}
        </div>

        {/* Pagination bounds */}
        {enrollmentsData?.total_pages > 1 && (
          <div className="mt-4 border-t border-neutral-100 pt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={enrollmentsData.total_pages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      <ManageTemplatesModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
      />
    </div>
  );
};

export default CertificateDetails;
