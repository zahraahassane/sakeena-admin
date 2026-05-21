import { api, normalizeListResponse } from "./api";

export const adminApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get Doors Data
    getDoorsData: builder.query({
      query: () => "/doors/",
      providesTags: ["doors"],
    }),

    // Add Door
    addDoor: builder.mutation({
      query: (data) => ({
        url: "/doors/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["doors"],
    }),

    // Update Door
    updateDoor: builder.mutation({
      query: ({ id, body }) => ({
        url: `/doors/${id}/`,
        method: "PATCH",
        body: body,
      }),
      invalidatesTags: ["doors"],
    }),

    // Delete Door
    deleteDoor: builder.mutation({
      query: (id) => ({
        url: `/doors/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["doors"],
    }),

    // Get Books Data
    getBooksData: builder.query({
      query: () => "/books/",
      providesTags: ["books"],
    }),

    // Add Book
    addBook: builder.mutation({
      query: (data) => ({
        url: "/books/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["books"],
    }),

    // Other image upload endpoints
    addBookGalleryImage: builder.mutation({
      query: ({ slug, image, order }) => {
        const formData = new FormData();
        formData.append("images", image);
        formData.append("order", order);
        return {
          url: `/books/${slug}/gallery/`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["books"],
    }),

    // Book Details
    getBookDetails: builder.query({
      query: (slug) => `/books/${slug}/`,
      providesTags: ["books"],
    }),

    // Update Book
    updateBook: builder.mutation({
      query: ({ slug, body }) => ({
        url: `/books/${slug}/`,
        method: "PATCH",
        body: body,
      }),
      invalidatesTags: ["books"],
    }),

    // Delete Book
    deleteBook: builder.mutation({
      query: (slug) => ({
        url: `/books/${slug}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["books"],
    }),

    // Book Categories
    getBookCategories: builder.query({
      query: () => "/book-categories/",
      transformResponse: normalizeListResponse,
      providesTags: ["books"],
    }),
    getLuluPackages: builder.query({
      query: () => "/books/lulu-packages/",
      providesTags: ["books"],
    }),
    addBookCategory: builder.mutation({
      query: (name) => ({
        url: "/book-categories/",
        method: "POST",
        body: { name },
      }),
      invalidatesTags: ["books"],
    }),
    deleteBookCategory: builder.mutation({
      query: (slug) => ({
        url: `/book-categories/${slug}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["books"],
    }),

    // Get Book Sales
    getBookSalesData: builder.query({
      query: (page = 1) => `/orders/book-sales/?page=${page}`,
      providesTags: ["book-sales"],
    }),

    // Get Blogs (All Blogs - Admin)
    getBlogsData: builder.query({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append("page", params.page);
        if (params.search) queryParams.append("search", params.search);
        if (params.status) queryParams.append("status", params.status);
        if (params.category__slug) queryParams.append("category__slug", params.category__slug);
        if (params.ordering) queryParams.append("ordering", params.ordering);
        if (params.page_size) queryParams.append("page_size", params.page_size);

        return `/blogs/?${queryParams.toString()}`;
      },
      providesTags: ["blogs"],
    }),

    // Get My Blogs (Teacher specific)
    getMyBlogsData: builder.query({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append("page", params.page);
        if (params.search) queryParams.append("search", params.search);
        if (params.status) queryParams.append("status", params.status);
        if (params.category__slug) queryParams.append("category__slug", params.category__slug);
        if (params.ordering) queryParams.append("ordering", params.ordering);
        if (params.page_size) queryParams.append("page_size", params.page_size);

        return `/blogs/my-blogs/?${queryParams.toString()}`;
      },
      providesTags: ["blogs"],
    }),

    // Add Blog
    addBlog: builder.mutation({
      query: (data) => ({
        url: "/blogs/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["blogs"],
    }),

    // Delete Blog
    deleteBlog: builder.mutation({
      query: (slug) => ({
        url: `/blogs/${slug}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["blogs"],
    }),

    // Update Blog
    updateBlog: builder.mutation({
      query: ({ slug, body }) => ({
        url: `/blogs/${slug}/`,
        method: "PATCH",
        body: body,
      }),
      invalidatesTags: ["blogs"],
    }),

    // single blog get
    getBlogDetails: builder.query({
      query: (slug) => `/blogs/${slug}/`,
      providesTags: ["blogs"],
    }),

    // approve blog
    approveBlog: builder.mutation({
      query: ({ slug, body }) => ({
        url: `/blogs/${slug}/approve/`,
        method: "POST",
        body: body,
      }),
      invalidatesTags: ["blogs"],
    }),

    // reject blog
    rejectBlog: builder.mutation({
      query: ({ slug, body }) => ({
        url: `/blogs/${slug}/reject/`,
        method: "POST",
        body: body,
      }),
      invalidatesTags: ["blogs"],
    }),
    // Blog Categories
    getBlogCategories: builder.query({
      query: () => "/blogs/categories/",
      transformResponse: normalizeListResponse,
      providesTags: ["blogs"],
    }),
    addBlogCategory: builder.mutation({
      query: (name) => ({
        url: "/blogs/categories/",
        method: "POST",
        body: { name },
      }),
      invalidatesTags: ["blogs"],
    }),
    deleteBlogCategory: builder.mutation({
      query: (slug) => ({
        url: `/blogs/categories/${slug}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["blogs"],
    }),

    // Get Videos
    getVideosData: builder.query({
      query: () => "/videos/",
      providesTags: ["videos"],
    }),

    // Add Video
    addVideo: builder.mutation({
      query: (data) => ({
        url: "/videos/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["videos"],
    }),

    // Update Video
    updateVideo: builder.mutation({
      query: ({ slug, body }) => ({
        url: `/videos/${slug}/`,
        method: "PATCH",
        body: body,
      }),
      invalidatesTags: ["videos"],
    }),

    // Delete Video
    deleteVideo: builder.mutation({
      query: (slug) => ({
        url: `/videos/${slug}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["videos"],
    }),

    // single video get
    getVideoDetails: builder.query({
      query: (slug) => `/videos/${slug}/`,
      providesTags: ["videos"],
    }),
    // Video Categories
    getVideoCategories: builder.query({
      query: () => "/videos/categories/",
      transformResponse: normalizeListResponse,
      providesTags: ["videos"],
    }),
    addVideoCategory: builder.mutation({
      query: (name) => ({
        url: "/videos/categories/",
        method: "POST",
        body: { name },
      }),
      invalidatesTags: ["videos"],
    }),
    deleteVideoCategory: builder.mutation({
      query: (slug) => ({
        url: `/videos/categories/${slug}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["videos"],
    }),

    // Get Courses
    getCoursesData: builder.query({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();
        const page = typeof params === "number" ? params : params?.page || 1;
        queryParams.append("page", page);
        if (params?.search) queryParams.append("search", params.search);
        return `/courses/?${queryParams.toString()}`;
      },
      providesTags: ["courses"],
    }),
    // Get all courses unpaginated (for reorder UI)
    getAllCoursesUnpaginated: builder.query({
      query: (params = {}) => {
        const queryParams = new URLSearchParams({ no_page: "1" });
        if (params?.search) queryParams.append("search", params.search);
        if (params?.category) queryParams.append("category", params.category);
        if (params?.status) queryParams.append("status", params.status);
        return `/courses/?${queryParams.toString()}`;
      },
      providesTags: ["courses"],
    }),
    // Reorder courses
    reorderCourses: builder.mutation({
      query: (items) => ({
        url: "/courses/reorder/",
        method: "PATCH",
        body: items,
      }),
      invalidatesTags: ["courses"],
    }),
    // Get Course Details
    getCourseDetails: builder.query({
      query: (id) => `/courses/${id}/`,
      providesTags: (result, error, id) => [{ type: "courses", id }],
    }),
    // Create Course
    createCourse: builder.mutation({
      query: (data) => ({
        url: "/courses/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["courses"],
    }),
    // Update Course
    updateCourse: builder.mutation({
      query: ({ id, data }) => ({
        url: `/courses/${id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "courses", id },
        "courses",
      ],
    }),
    deleteCourse: builder.mutation({
      query: (id) => ({
        url: `/courses/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["courses"],
    }),
    // Course Modules
    getCourseModules: builder.query({
      query: (course_pk) => `/courses/${course_pk}/modules/`,
      providesTags: (result, error, course_pk) => [
        { type: "courseModules", id: course_pk },
      ],
    }),
    createCourseModule: builder.mutation({
      query: ({ course_pk, body }) => ({
        url: `/courses/${course_pk}/modules/`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { course_pk }) => [
        { type: "courseModules", id: course_pk },
      ],
    }),
    deleteCourseModule: builder.mutation({
      query: ({ course_pk, id }) => ({
        url: `/courses/${course_pk}/modules/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { course_pk }) => [
        { type: "courseModules", id: course_pk },
      ],
    }),
    // Update Course Module
    updateCourseModule: builder.mutation({
      query: ({ course_pk, id, body }) => ({
        url: `/courses/${course_pk}/modules/${id}/`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { course_pk }) => [
        { type: "courseModules", id: course_pk },
      ],
    }),
    // Module Lessons
    getModuleLessons: builder.query({
      query: ({ course_pk, module_pk, page = 1 }) =>
        `/courses/${course_pk}/modules/${module_pk}/lessons/?page=${page}`,
      providesTags: (result, error, { module_pk }) => [
        { type: "moduleLessons", id: module_pk },
      ],
    }),
    getLessonDetails: builder.query({
      query: ({ course_pk, module_pk, id }) =>
        `/courses/${course_pk}/modules/${module_pk}/lessons/${id}/`,
      providesTags: (result, error, { id }) => [{ type: "lesson", id }],
    }),
    createModuleLesson: builder.mutation({
      query: ({ course_pk, module_pk, body }) => ({
        url: `/courses/${course_pk}/modules/${module_pk}/lessons/`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { module_pk }) => [
        { type: "moduleLessons", id: module_pk },
      ],
    }),
    updateModuleLesson: builder.mutation({
      query: ({ course_pk, module_pk, id, body }) => ({
        url: `/courses/${course_pk}/modules/${module_pk}/lessons/${id}/`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { module_pk, id }) => [
        { type: "moduleLessons", id: module_pk },
        { type: "lesson", id },
      ],
    }),
    deleteModuleLesson: builder.mutation({
      query: ({ course_pk, module_pk, id }) => ({
        url: `/courses/${course_pk}/modules/${module_pk}/lessons/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { module_pk }) => [
        { type: "moduleLessons", id: module_pk },
      ],
    }),
    reorderModuleLessons: builder.mutation({
      query: ({ course_pk, module_pk, order }) => ({
        url: `/courses/${course_pk}/modules/${module_pk}/lessons/reorder/`,
        method: "POST",
        body: { order },
      }),
      invalidatesTags: (result, error, { module_pk }) => [
        { type: "moduleLessons", id: module_pk },
      ],
    }),
    getVideoStatus: builder.query({
      query: ({ course_pk, module_pk, id }) =>
        `/courses/${course_pk}/modules/${module_pk}/lessons/${id}/video/`,
    }),
    initLessonVideoUpload: builder.mutation({
      query: ({ course_pk, module_pk, id }) => ({
        url: `/courses/${course_pk}/modules/${module_pk}/lessons/${id}/video/`,
        method: "POST",
      }),
    }),
    createLessonQuiz: builder.mutation({
      query: ({ course_pk, module_pk, lesson_pk, body }) => ({
        url: `/courses/${course_pk}/modules/${module_pk}/lessons/${lesson_pk}/quizzes/`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { module_pk }) => [
        { type: "moduleLessons", id: module_pk },
      ],
    }),
    updateLessonQuiz: builder.mutation({
      query: ({ course_pk, module_pk, lesson_pk, id, body }) => ({
        url: `/courses/${course_pk}/modules/${module_pk}/lessons/${lesson_pk}/quizzes/${id}/`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { module_pk, lesson_pk }) => [
        { type: "moduleLessons", id: module_pk },
        { type: "lesson", id: lesson_pk },
      ],
    }),
    createLessonQuizQuestion: builder.mutation({
      query: ({ course_pk, module_pk, lesson_pk, quiz_pk, body }) => ({
        url: `/courses/${course_pk}/modules/${module_pk}/lessons/${lesson_pk}/quizzes/${quiz_pk}/questions/`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { module_pk, lesson_pk }) => [
        { type: "moduleLessons", id: module_pk },
        { type: "lesson", id: lesson_pk },
      ],
    }),
    createLessonAssignment: builder.mutation({
      query: ({ course_pk, module_pk, lesson_pk, body }) => ({
        url: `/courses/${course_pk}/modules/${module_pk}/lessons/${lesson_pk}/assignments/`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { module_pk }) => [
        { type: "moduleLessons", id: module_pk },
      ],
    }),
    updateLessonAssignment: builder.mutation({
      query: ({ course_pk, module_pk, lesson_pk, id, body }) => ({
        url: `/courses/${course_pk}/modules/${module_pk}/lessons/${lesson_pk}/assignments/${id}/`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { module_pk, lesson_pk }) => [
        { type: "moduleLessons", id: module_pk },
        { type: "lesson", id: lesson_pk },
      ],
    }),
    // Course Categories
    getCourseCategories: builder.query({
      query: () => "/course-categories/",
      transformResponse: normalizeListResponse,
      providesTags: ["courses"],
    }),
    addCourseCategory: builder.mutation({
      query: (name) => ({
        url: "/course-categories/",
        method: "POST",
        body: { name },
      }),
      invalidatesTags: ["courses"],
    }),
    deleteCourseCategory: builder.mutation({
      query: (id) => ({
        url: `/course-categories/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["courses"],
    }),

    // GET EMAIL TEMPLATES
    getEmailTemplates: builder.query({
      query: () => "/email-templates/",
      providesTags: ["email-templates"],
    }),

    // get Sendgrid API
    getSendgridApi: builder.query({
      query: () => "/email-templates/sendgrid-templates/",
      providesTags: ["sendgrid-api"],
    }),
    getTeacherEarnings: builder.query({
      query: () => "/dashboard/teacher-earnings/",
      providesTags: ["dashboard"],
    }),

    // get Purposes
    getPurposes: builder.query({
      query: () => "/email-templates/purposes/",
      providesTags: ["purposes"],
    }),

    // Add Email Template
    addEmailTemplate: builder.mutation({
      query: (data) => ({
        url: "/email-templates/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["email-templates"],
    }),

    // Update Email Template
    updateEmailTemplate: builder.mutation({
      query: ({ id, body }) => ({
        url: `/email-templates/${id}/`,
        method: "PATCH",
        body: body,
      }),
      invalidatesTags: ["email-templates"],
    }),

    // Delete Email Template
    deleteEmailTemplate: builder.mutation({
      query: (id) => ({
        url: `/email-templates/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["email-templates"],
    }),

    // Add more admin-specific endpoints here as needed...
    getTeacherProfiles: builder.query({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();
        const page = typeof params === "number" ? params : params.page;
        if (page) queryParams.append("page", page);
        if (params && typeof params !== "number") {
          if (params.offers_consultations !== undefined) {
            queryParams.append("offers_consultations", String(params.offers_consultations));
          }
          if (params.search) {
            queryParams.append("search", params.search);
          }
        }
        const q = queryParams.toString();
        return `/teacher-profiles/${q ? `?${q}` : ""}`;
      },
      providesTags: ["teachers"],
    }),
    getStudentProfiles: builder.query({
      query: (page = 1) => `/student-profiles/?page=${page}`,
      providesTags: ["students"],
    }),

    getStudentProfile: builder.query({
      query: (id) => `/student-profiles/${id}/`,
      providesTags: ["student"],
    }),

    getTeacherProfile: builder.query({
      query: (id) => `/teacher-profiles/${id}/`,
      providesTags: ["teachers"],
    }),

    getSiteSettings: builder.query({
      query: () => ({
        url: "/site-settings/",
        method: "GET",
      }),
      providesTags: ["siteSettings"],
    }),

    updateSiteSettings: builder.mutation({
      query: (body) => ({
        url: "/site-settings/update/",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["siteSettings"],
    }),

    getAdminDashboard: builder.query({
      query: () => ({
        url: "/dashboard/admin/",
        method: "GET",
      }),
      providesTags: ["dashboard"],
    }),

    getAssignmentSubmissions: builder.query({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();
        const page = typeof params === "number" ? params : params.page;
        if (page) queryParams.append("page", page);
        if (params.assignment)
          queryParams.append("assignment", params.assignment);
        if (params.status) queryParams.append("status", params.status);
        if (params.user) queryParams.append("user", params.user);
        const queryString = queryParams.toString();
        return {
          url: `/assignment-submissions/${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
      transformResponse: (response) => response?.results || [],
      providesTags: ["assignmentSubmissions"],
    }),

    getAssignmentSubmission: builder.query({
      query: (id) => `/assignment-submissions/${id}/`,
      providesTags: ["assignmentSubmissions"],
    }),

    reviewAssignmentSubmission: builder.mutation({
      query: ({ id, body }) => ({
        url: `/assignment-submissions/${id}/review/`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["assignmentSubmissions"],
    }),

    getConsultations: builder.query({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append("page", params.page);
        if (params.page_size) queryParams.append("page_size", params.page_size);
        if (params.search) queryParams.append("search", params.search);
        if (params.teacher) queryParams.append("teacher", params.teacher);

        if (params["teacher__user__email"]) {
          queryParams.append("teacher__user__email", params["teacher__user__email"]);
        }
        if (params["teacher__user__email__icontains"]) {
          queryParams.append("teacher__user__email__icontains", params["teacher__user__email__icontains"]);
        }

        const q = queryParams.toString();
        return `/consultations/${q ? `?${q}` : ""}`;
      },
      providesTags: ["consultations"],
    }),

    // Course Discussions
    getCourseDiscussions: builder.query({
      query: (course_pk) => `/courses/${course_pk}/discussions/`,
      providesTags: (result, error, course_pk) => [
        { type: "discussions", id: course_pk },
      ],
    }),

    getCourseDiscussionDetails: builder.query({
      query: ({ course_pk, id }) => `/courses/${course_pk}/discussions/${id}/`,
      providesTags: (result, error, { id }) => [{ type: "discussions", id }],
    }),

    createCourseDiscussion: builder.mutation({
      query: ({ course_pk, body }) => ({
        url: `/courses/${course_pk}/discussions/`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { course_pk }) => [
        { type: "discussions", id: course_pk },
      ],
    }),

    patchCourseDiscussion: builder.mutation({
      query: ({ course_pk, id, body }) => ({
        url: `/courses/${course_pk}/discussions/${id}/`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "discussions", id }],
    }),

    pinCourseDiscussion: builder.mutation({
      query: ({ course_pk, id }) => ({
        url: `/courses/${course_pk}/discussions/${id}/pin/`,
        method: "POST",
      }),
      invalidatesTags: (result, error, { id, course_pk }) => [
        { type: "discussions", id },
        { type: "discussions", id: course_pk },
      ],
    }),

    closeCourseDiscussion: builder.mutation({
      query: ({ course_pk, id }) => ({
        url: `/courses/${course_pk}/discussions/${id}/close/`,
        method: "POST",
      }),
      invalidatesTags: (result, error, { id, course_pk }) => [
        { type: "discussions", id },
        { type: "discussions", id: course_pk },
      ],
    }),

    deleteCourseDiscussion: builder.mutation({
      query: ({ course_pk, id }) => ({
        url: `/courses/${course_pk}/discussions/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { course_pk }) => [
        { type: "discussions", id: course_pk },
      ],
    }),

    getDiscussionReplies: builder.query({
      query: ({ course_pk, post_pk }) =>
        `/courses/${course_pk}/discussions/${post_pk}/replies/`,
      providesTags: (result, error, { post_pk }) => [
        { type: "replies", id: post_pk },
      ],
    }),

    createDiscussionReply: builder.mutation({
      query: ({ course_pk, post_pk, body }) => ({
        url: `/courses/${course_pk}/discussions/${post_pk}/replies/`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { post_pk }) => [
        { type: "replies", id: post_pk },
      ],
    }),

    patchDiscussionReply: builder.mutation({
      query: ({ course_pk, post_pk, id, body }) => ({
        url: `/courses/${course_pk}/discussions/${post_pk}/replies/${id}/`,
        method: "PATCH",
        body,
      }),
      // Invalidate the replies list for this discussion
      invalidatesTags: (result, error, { course_pk, post_pk }) => [
        { type: "replies", id: post_pk },
        { type: "discussions", id: course_pk },
      ],
    }),

    deleteDiscussionReply: builder.mutation({
      query: ({ course_pk, post_pk, id }) => ({
        url: `/courses/${course_pk}/discussions/${post_pk}/replies/${id}/`,
        method: "DELETE",
      }),
      // Invalidate replies + parent discussion (reply_count changes)
      invalidatesTags: (result, error, { course_pk, post_pk }) => [
        { type: "replies", id: post_pk },
        { type: "discussions", id: course_pk },
      ],
    }),

    getConsultation: builder.query({
      query: (id) => `/consultations/${id}/`,
      providesTags: ["consultations"],
    }),

    createConsultation: builder.mutation({
      query: (body) => ({
        url: "/consultations/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["consultations"],
    }),

    createConsultationRecurring: builder.mutation({
      query: ({ consultationId, body }) => ({
        url: `/consultations/${consultationId}/recurring/`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["consultations"],
    }),

    getConsultationRecurrings: builder.query({
      query: (consultationId) => `/consultations/${consultationId}/recurring/`,
      providesTags: ["consultations"],
    }),

    updateConsultationRecurring: builder.mutation({
      query: ({ consultationId, id, body }) => ({
        url: `/consultations/${consultationId}/recurring/${id}/`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["consultations"],
    }),

    deleteConsultationRecurring: builder.mutation({
      query: ({ consultationId, id }) => ({
        url: `/consultations/${consultationId}/recurring/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["consultations"],
    }),

    createConsultationBundle: builder.mutation({
      query: ({ consultationId, body }) => ({
        url: `/consultations/${consultationId}/bundles/`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["consultations"],
    }),
    getConsultationCalendar: builder.query({
      query: ({ id, month }) => `/consultations/${id}/calendar/?month=${month}`,
      providesTags: ["consultations"],
    }),
    getConsultationTimeslots: builder.query({
      query: ({ id, date, page }) => {
        const queryParams = new URLSearchParams();
        if (date) queryParams.append("date", date);
        if (page) queryParams.append("page", page);
        // page_size omitted, let backend handle default pagination
        const q = queryParams.toString();
        return `/consultations/${id}/timeslots/${q ? `?${q}` : ""}`;
      },
      providesTags: ["consultations"],
    }),
    getRescheduleRequests: builder.query({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append("page", params.page);
        if (params.status) queryParams.append("status", params.status);
        if (params.search) queryParams.append("search", params.search);
        const q = queryParams.toString();
        return `/reschedule-requests/${q ? `?${q}` : ""}`;
      },
      providesTags: ["rescheduleRequests"],
    }),
    getRescheduleRequestDetails: builder.query({
      query: (id) => `/reschedule-requests/${id}/`,
      providesTags: ["rescheduleRequests"],
    }),
    acceptRescheduleRequest: builder.mutation({
      query: (id) => ({
        url: `/reschedule-requests/${id}/accept/`,
        method: "POST",
      }),
      invalidatesTags: ["rescheduleRequests"],
    }),
    declineRescheduleRequest: builder.mutation({
      query: (id) => ({
        url: `/reschedule-requests/${id}/decline/`,
        method: "POST",
      }),
      invalidatesTags: ["rescheduleRequests"],
    }),

    getDonations: builder.query({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append("page", params.page);
        if (params.status) queryParams.append("status", params.status);
        if (params.page_size) queryParams.append("page_size", params.page_size);
        const q = queryParams.toString();
        return `/donations/${q ? `?${q}` : ""}`;
      },
      providesTags: ["donations"],
    }),

    getNewsletterSubscribers: builder.query({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append("page", params.page);
        if (params.page_size) queryParams.append("page_size", params.page_size);
        const q = queryParams.toString();
        return `/newsletter/subscribers/${q ? `?${q}` : ""}`;
      },
      providesTags: ["newsletterSubscribers"],
    }),

    deleteNewsletterSubscriber: builder.mutation({
      query: (id) => ({
        url: `/newsletter/subscribers/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["newsletterSubscribers"],
    }),

    getEnrollments: builder.query({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.user) queryParams.append("user", params.user);
        if (params?.course) queryParams.append("course", params.course);
        if (params?.page) queryParams.append("page", params.page);
        const q = queryParams.toString();
        return `/enrollments/${q ? `?${q}` : ""}`;
      },
      providesTags: ["enrollments"],
    }),

    getCertificateTemplates: builder.query({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.page_size) queryParams.append("page_size", params.page_size);
        if (params.page) queryParams.append("page", params.page);
        const q = queryParams.toString();
        return `/certificate-templates/${q ? `?${q}` : ""}`;
      },
      providesTags: ["certificate-templates"],
    }),
    addCertificateTemplate: builder.mutation({
      query: (body) => ({
        url: "/certificate-templates/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["certificate-templates"],
    }),
    updateCertificateTemplate: builder.mutation({
      query: ({ id, body }) => ({
        url: `/certificate-templates/${id}/`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["certificate-templates"],
    }),
    deleteCertificateTemplate: builder.mutation({
      query: (id) => ({
        url: `/certificate-templates/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["certificate-templates"],
    }),
    getCertificateTemplatePreview: builder.query({
      query: (id) => ({
        url: `/certificate-templates/${id}/preview/`,
        responseHandler: (response) => response.text(),
      }),
    }),
    getCompletedStudents: builder.query({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.course) queryParams.append("course", params.course);
        // if (params?.page) queryParams.append("page", params.page);
        const q = queryParams.toString();
        return `/certificates/completed-students/${q ? `?${q}` : ""}`;
      },
      providesTags: ["completed-students"],
    }),
    issueCertificates: builder.mutation({
      query: (body) => ({
        url: "/certificates/issue/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["completed-students"],
    }),

    // Scholarships
    getScholarships: builder.query({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append("page", params.page);
        if (params?.status) queryParams.append("status", params.status);
        if (params?.course) queryParams.append("course", params.course);
        const q = queryParams.toString();
        return `/scholarships/${q ? `?${q}` : ""}`;
      },
      providesTags: ["scholarships"],
    }),
    approveScholarship: builder.mutation({
      query: ({ id, body }) => ({
        url: `/scholarships/${id}/approve/`,
        method: "POST",
        body: body,
      }),
      invalidatesTags: ["scholarships"],
    }),
    rejectScholarship: builder.mutation({
      query: ({ id, body }) => ({
        url: `/scholarships/${id}/reject/`,
        method: "POST",
        body: body, // e.g. optional rejection note
      }),
      invalidatesTags: ["scholarships"],
    }),

    // Add Student Profile
    addStudentProfile: builder.mutation({
      query: (data) => ({
        url: "/student-profiles/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["students"],
    }),

    // Add Teacher Profile
    addTeacherProfile: builder.mutation({
      query: (data) => ({
        url: "/teacher-profiles/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["teachers"],
    }),

    // Update Teacher Profile
    updateTeacherProfile: builder.mutation({
      query: ({ id, body }) => ({
        url: `/teacher-profiles/${id}/`,
        method: "PATCH",
        body: body,
      }),
      invalidatesTags: ["teachers"],
    }),

    // Delete Student Profile
    deleteStudentProfile: builder.mutation({
      query: (id) => ({
        url: `/student-profiles/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["students"],
    }),

    deleteTeacherProfile: builder.mutation({
      query: (id) => ({
        url: `/teacher-profiles/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["teachers"],
    }),

    // Site Announcements (Popups)
    getSiteAnnouncements: builder.query({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append("page", params.page);
        if (params?.search) queryParams.append("search", params.search);
        const q = queryParams.toString();
        return `/announcements/site/${q ? `?${q}` : ""}`;
      },
      providesTags: ["siteAnnouncements"],
    }),
    createSiteAnnouncement: builder.mutation({
      query: (body) => ({
        url: "/announcements/site/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["siteAnnouncements"],
    }),
    updateSiteAnnouncement: builder.mutation({
      query: ({ id, body }) => ({
        url: `/announcements/site/${id}/`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["siteAnnouncements"],
    }),
    deleteSiteAnnouncement: builder.mutation({
      query: (id) => ({
        url: `/announcements/site/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["siteAnnouncements"],
    }),

    // Course Announcements
    getCourseAnnouncements: builder.query({
      query: ({ course_pk, page, search }) => {
        const queryParams = new URLSearchParams();
        if (page) queryParams.append("page", page);
        if (search) queryParams.append("search", search);
        const q = queryParams.toString();
        return `/courses/${course_pk}/announcements/${q ? `?${q}` : ""}`;
      },
      providesTags: (result, error, { course_pk }) => [
        { type: "courseAnnouncements", id: course_pk },
      ],
    }),
    createCourseAnnouncement: builder.mutation({
      query: ({ course_pk, body }) => ({
        url: `/courses/${course_pk}/announcements/`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { course_pk }) => [
        { type: "courseAnnouncements", id: course_pk },
      ],
    }),
    deleteCourseAnnouncement: builder.mutation({
      query: ({ course_pk, id }) => ({
        url: `/courses/${course_pk}/announcements/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { course_pk }) => [
        { type: "courseAnnouncements", id: course_pk },
      ],
    }),

    // Memberships and Bundles
    getMembershipPlan: builder.query({
      query: () => "/membership/plan/",
      providesTags: ["membership"],
    }),
    createMembershipPlan: builder.mutation({
      query: (body) => ({
        url: "/membership/plan/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["membership"],
    }),
    updateMembershipPlan: builder.mutation({
      query: (body) => ({
        url: "/membership/plan/",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["membership"],
    }),
    getBundles: builder.query({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append("page", params.page);
        if (params?.is_active !== undefined)
          queryParams.append("is_active", params.is_active);
        const q = queryParams.toString();
        return `/bundles/${q ? `?${q}` : ""}`;
      },
      providesTags: ["bundles"],
    }),
    getBundleDetails: builder.query({
      query: (id) => `/bundles/${id}/`,
      providesTags: ["bundles"],
    }),
    createBundle: builder.mutation({
      query: (body) => ({
        url: "/bundles/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["bundles"],
    }),
    updateBundle: builder.mutation({
      query: ({ id, body }) => ({
        url: `/bundles/${id}/`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["bundles"],
    }),
    deleteBundle: builder.mutation({
      query: (id) => ({
        url: `/bundles/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["bundles"],
    }),

    // Get Teacher Profile
    getTeacherProfile: builder.query({
      query: (id) => `/teacher-profiles/${id}/`,
      providesTags: ["teacher"],
    }),
    getTeacherProfileMe: builder.query({
      query: () => "/teacher-profiles/me/",
      providesTags: ["teacher"],
    }),
    updateTeacherProfile: builder.mutation({
      query: ({ id, data, body, method = "PATCH" }) => ({
        url: `/teacher-profiles/${id}/`,
        method: method,
        body: body || data,
      }),
      invalidatesTags: ["teacher"],
    }),

    getCourseById: builder.query({
      query: (id) => `/courses/${id}/`,
      providesTags: (result, error, id) => [{ type: "courses", id }],
    }),

    getCourseEnrollments: builder.query({
      query: ({ courseId, page = 1, pageSize = 20 } = {}) =>
        `/enrollments/?course=${courseId}&page=${page}&page_size=${pageSize}`,
      providesTags: ["enrollments"],
    }),

    getLessonQuizzes: builder.query({
      query: ({ courseId, moduleId, lessonId }) =>
        `/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/quizzes/`,
      providesTags: ["quizzes"],
    }),

    getLessonAssignments: builder.query({
      query: ({ courseId, moduleId, lessonId }) =>
        `/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/assignments/`,
      providesTags: ["assignments"],
    }),

    getCourseReviews: builder.query({
      query: ({ courseId, page = 1 } = {}) =>
        `/courses/${courseId}/reviews/?page=${page}`,
      providesTags: ["reviews"],
    }),

    updateCourseReview: builder.mutation({
      query: ({ courseId, reviewId, ...body }) => ({
        url: `/courses/${courseId}/reviews/${reviewId}/`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["reviews"],
    }),

    deleteCourseReview: builder.mutation({
      query: ({ courseId, reviewId }) => ({
        url: `/courses/${courseId}/reviews/${reviewId}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["reviews"],
    }),

    getAssignmentSubmissions: builder.query({
      query: ({
        status,
        assignment,
        courseId,
        moduleId,
        search,
        page = 1,
      } = {}) => {
        const params = new URLSearchParams({ page });
        if (status) params.append("status", status);
        if (assignment) params.append("assignment", assignment);
        if (courseId)
          params.append("assignment__lesson__module__course", courseId);
        if (moduleId) params.append("assignment__lesson__module", moduleId);
        if (search) params.append("search", search);
        return `/assignment-submissions/?${params.toString()}`;
      },
      transformResponse: normalizeListResponse,
      providesTags: ["assignmentSubmissions"],
    }),

    reviewAssignmentSubmission: builder.mutation({
      query: ({ id, status, teacher_feedback, mark }) => ({
        url: `/assignment-submissions/${id}/review/`,
        method: "PATCH",
        body: { status, teacher_feedback, mark },
      }),
      invalidatesTags: ["assignmentSubmissions"],
    }),

    getQuizAttempts: builder.query({
      query: ({ courseId, page = 1 } = {}) => {
        const params = new URLSearchParams({ page });
        if (courseId) params.append("quiz__lesson__module__course", courseId);
        return `/quiz-attempts/?${params.toString()}`;
      },
      transformResponse: normalizeListResponse,
      providesTags: ["quizAttempts"],
    }),

    getQuizAttemptDetails: builder.query({
      query: (id) => `/quiz-attempts/${id}/`,
      providesTags: ["quizAttempts"],
    }),

    getConsultations: builder.query({
      query: () => "/consultations/",
      providesTags: ["consultations"],
    }),

    getTeacherUpcomingSessions: builder.query({
      query: () => "/teacher/consultations/",
      transformResponse: normalizeListResponse,
      providesTags: ["teacherSessions"],
    }),

    getConsultationEarnings: builder.query({
      query: () => "/teacher/consultations/consultation-earnings/",
      providesTags: ["teacherSessions"],
    }),

    getTeacherLiveSessions: builder.query({
      query: ({ status, page = 1, page_size = 20 } = {}) => {
        const params = new URLSearchParams({ page, page_size });
        if (status) params.append("status", status);
        return `/teacher/live-sessions/?${params.toString()}`;
      },
      transformResponse: normalizeListResponse,
      providesTags: ["teacherLiveSessions"],
    }),

    getTeacherDashboard: builder.query({
      query: () => "/teacher/dashboard/",
      providesTags: ["dashboard"],
    }),

    getSales: builder.query({
      query: ({
        page = 1,
        search,
        type,
        payment_status,
        date_from,
        date_to,
      } = {}) => {
        const params = new URLSearchParams();
        if (page) params.append("page", page);
        if (search) params.append("search", search);
        if (type && type !== "All Types") params.append("type", type);
        if (payment_status && payment_status !== "All Status")
          params.append("payment_status", payment_status);
        if (date_from) params.append("date_from", date_from);
        if (date_to) params.append("date_to", date_to);

        return `/orders/sales/?${params.toString()}`;
      },
      providesTags: ["sales"],
    }),
    getCoupons: builder.query({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append("page", params.page);
        if (params.search) queryParams.append("search", params.search);
        const q = queryParams.toString();
        return `/coupons/${q ? `?${q}` : ""}`;
      },
      providesTags: ["coupons"],
    }),
    addCoupon: builder.mutation({
      query: (body) => ({
        url: "/coupons/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["coupons"],
    }),
    updateCoupon: builder.mutation({
      query: ({ id, body }) => ({
        url: `/coupons/${id}/`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["coupons"],
    }),
    deleteCoupon: builder.mutation({
      query: (id) => ({
        url: `/coupons/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["coupons"],
    }),
    changePassword: builder.mutation({
      query: (body) => ({
        url: "/auth/users/set_password/",
        method: "POST",
        body,
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetDoorsDataQuery,
  useAddDoorMutation,
  useUpdateDoorMutation,
  useDeleteDoorMutation,
  useGetBooksDataQuery,
  useAddBookMutation,
  useAddBookGalleryImageMutation,
  useGetBookDetailsQuery,
  useUpdateBookMutation,
  useDeleteBookMutation,
  useGetBookCategoriesQuery,
  useAddBookCategoryMutation,
  useDeleteBookCategoryMutation,
  useGetBookSalesDataQuery,
  useGetBlogsDataQuery,
  useGetMyBlogsDataQuery,
  useAddBlogMutation,
  useUpdateBlogMutation,
  useDeleteBlogMutation,
  useGetBlogDetailsQuery,
  useApproveBlogMutation,
  useRejectBlogMutation,
  useGetBlogCategoriesQuery,
  useAddBlogCategoryMutation,
  useDeleteBlogCategoryMutation,
  useGetVideosDataQuery,
  useAddVideoMutation,
  useUpdateVideoMutation,
  useDeleteVideoMutation,
  useGetVideoDetailsQuery,
  useGetVideoCategoriesQuery,
  useAddVideoCategoryMutation,
  useDeleteVideoCategoryMutation,
  useGetCoursesDataQuery,
  useGetAllCoursesUnpaginatedQuery,
  useReorderCoursesMutation,
  useGetCourseDetailsQuery,
  useGetCourseCategoriesQuery,
  useAddCourseCategoryMutation,
  useDeleteCourseCategoryMutation,
  useGetEmailTemplatesQuery,
  useGetSendgridApiQuery,
  useGetPurposesQuery,
  useAddEmailTemplateMutation,
  useUpdateEmailTemplateMutation,
  useDeleteEmailTemplateMutation,
  useGetTeacherProfilesQuery,
  useGetTeacherProfileMeQuery,
  useGetStudentProfilesQuery,
  useGetTeacherProfileQuery,
  useGetStudentProfileQuery,
  useGetSiteSettingsQuery,
  useUpdateSiteSettingsMutation,
  useGetAdminDashboardQuery,
  useGetCourseByIdQuery,
  useGetCourseEnrollmentsQuery,
  useGetLessonQuizzesQuery,
  useGetLessonAssignmentsQuery,
  useGetCourseReviewsQuery,
  useUpdateCourseReviewMutation,
  useDeleteCourseReviewMutation,
  useGetAssignmentSubmissionsQuery,
  useGetAssignmentSubmissionQuery,
  useReviewAssignmentSubmissionMutation,
  useGetConsultationsQuery,
  useGetConsultationQuery,
  useCreateConsultationMutation,
  useCreateConsultationRecurringMutation,
  useGetConsultationRecurringsQuery,
  useUpdateConsultationRecurringMutation,
  useDeleteConsultationRecurringMutation,
  useCreateConsultationBundleMutation,
  useGetConsultationCalendarQuery,
  useGetConsultationTimeslotsQuery,
  useGetTeacherUpcomingSessionsQuery,
  useGetConsultationEarningsQuery,
  useGetTeacherLiveSessionsQuery,
  useGetRescheduleRequestsQuery,
  useGetRescheduleRequestDetailsQuery,
  useAcceptRescheduleRequestMutation,
  useDeclineRescheduleRequestMutation,
  useGetEnrollmentsQuery,
  useGetScholarshipsQuery,
  useApproveScholarshipMutation,
  useRejectScholarshipMutation,
  useAddStudentProfileMutation,
  useAddTeacherProfileMutation,
  useUpdateTeacherProfileMutation,
  useDeleteStudentProfileMutation,
  useDeleteTeacherProfileMutation,
  useGetCertificateTemplatesQuery,
  useAddCertificateTemplateMutation,
  useUpdateCertificateTemplateMutation,
  useDeleteCertificateTemplateMutation,
  useGetCompletedStudentsQuery,
  useLazyGetCertificateTemplatePreviewQuery,
  useIssueCertificatesMutation,
  useGetMembershipPlanQuery,
  useCreateMembershipPlanMutation,
  useUpdateMembershipPlanMutation,
  useGetBundlesQuery,
  useCreateBundleMutation,
  useUpdateBundleMutation,
  useDeleteBundleMutation,
  useGetSiteAnnouncementsQuery,
  useCreateSiteAnnouncementMutation,
  useUpdateSiteAnnouncementMutation,
  useDeleteSiteAnnouncementMutation,
  useGetCourseAnnouncementsQuery,
  useCreateCourseAnnouncementMutation,
  useDeleteCourseAnnouncementMutation,
  useGetDonationsQuery,
  useGetNewsletterSubscribersQuery,
  useDeleteNewsletterSubscriberMutation,
  useCreateCourseMutation,
  useUpdateCourseMutation,
  useDeleteCourseMutation,
  useGetCourseModulesQuery,
  useCreateCourseModuleMutation,
  useDeleteCourseModuleMutation,
  useUpdateCourseModuleMutation,
  useGetModuleLessonsQuery,
  useGetLessonDetailsQuery,
  useCreateModuleLessonMutation,
  useUpdateModuleLessonMutation,
  useDeleteModuleLessonMutation,
  useReorderModuleLessonsMutation,
  useLazyGetVideoStatusQuery,
  useInitLessonVideoUploadMutation,
  useCreateLessonQuizMutation,
  useUpdateLessonQuizMutation,
  useCreateLessonQuizQuestionMutation,
  useCreateLessonAssignmentMutation,
  useUpdateLessonAssignmentMutation,
  useGetLuluPackagesQuery,
  useGetCourseDiscussionsQuery,
  useGetCourseDiscussionDetailsQuery,
  useCreateCourseDiscussionMutation,
  usePatchCourseDiscussionMutation,
  usePinCourseDiscussionMutation,
  useCloseCourseDiscussionMutation,
  useDeleteCourseDiscussionMutation,
  useGetDiscussionRepliesQuery,
  useCreateDiscussionReplyMutation,
  usePatchDiscussionReplyMutation,
  useDeleteDiscussionReplyMutation,
  useGetTeacherEarningsQuery,
  useGetTeacherDashboardQuery,
  useGetQuizAttemptsQuery,
  useGetQuizAttemptDetailsQuery,
  useGetSalesQuery,
  useGetCouponsQuery,
  useAddCouponMutation,
  useUpdateCouponMutation,
  useDeleteCouponMutation,
  useChangePasswordMutation,
} = adminApi;
