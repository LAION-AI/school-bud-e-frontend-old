import { computed, signal } from "@preact/signals";

// Task Review Types
export interface TaskIdentification {
  task_id: string;
  task_text: string;
  task_type: "multiple_choice" | "short_answer" | "essay" | "calculation" | "other";
  image_data?: string; // Base64 encoded image
  max_points: number;
  page_number: number;
}

export interface StudentResponse {
  student_id: string;
  student_name: string;
  responses: Array<{
    task_id: string;
    response_text: string;
    suggested_score: number;
    feedback: string;
    teacher_score?: number;
    teacher_feedback?: string;
  }>;
  score: number;
  max_score: number;
}

export interface ReviewSession {
  id: string;
  filename: string;
  uploaded_at: number;
  tasks: TaskIdentification[];
  students: StudentResponse[];
  total_students: number;
  status: "processing" | "completed" | "error";
}

interface ReviewState {
  sessions: ReviewSession[];
  currentSessionId: string | null;
  selectedStudentId: string | null;
  comparisonStudentIds: string[];
}

// Initialize the store
const loadStoredReviews = (): ReviewState => {
  if (typeof localStorage === "undefined") {
    return { 
      sessions: [], 
      currentSessionId: null, 
      selectedStudentId: null,
      comparisonStudentIds: []
    };
  }

  try {
    const storedReviews = localStorage.getItem("task-reviews");
    if (storedReviews) {
      return JSON.parse(storedReviews);
    }
  } catch (error) {
    console.error("Failed to load reviews from localStorage:", error);
  }

  return { 
    sessions: [], 
    currentSessionId: null, 
    selectedStudentId: null,
    comparisonStudentIds: []
  };
};

// Create signals for the store
export const reviewState = signal<ReviewState>(loadStoredReviews());

// Create computed signals for easier access
export const sessions = computed(() => reviewState.value.sessions);
export const currentSessionId = computed(() => reviewState.value.currentSessionId);
export const selectedStudentId = computed(() => reviewState.value.selectedStudentId);
export const comparisonStudentIds = computed(() => reviewState.value.comparisonStudentIds);

export const currentSession = computed(() =>
  reviewState.value.sessions.find((session) =>
    session.id === reviewState.value.currentSessionId
  ) || null
);

export const selectedStudent = computed(() => {
  const session = currentSession.value;
  if (!session || !reviewState.value.selectedStudentId) return null;
  
  return session.students.find((student) =>
    student.student_id === reviewState.value.selectedStudentId
  ) || null;
});

export const comparisonStudents = computed(() => {
  const session = currentSession.value;
  if (!session || reviewState.value.comparisonStudentIds.length === 0) return [];
  
  return session.students.filter((student) =>
    reviewState.value.comparisonStudentIds.includes(student.student_id)
  );
});

// Helper function to save reviews to localStorage
const saveReviewsToStorage = (state: ReviewState) => {
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem("task-reviews", JSON.stringify(state));
    } catch (error) {
      console.error("Failed to save reviews to localStorage:", error);
    }
  }
};

// Actions for modifying the reviews
export const addReviewSession = (session: ReviewSession) => {
  const updatedState = {
    ...reviewState.value,
    sessions: [...reviewState.value.sessions, session],
    currentSessionId: session.id,
  };
  reviewState.value = updatedState;
  saveReviewsToStorage(updatedState);
};

export const updateReviewSession = (updatedSession: ReviewSession) => {
  const updatedState = {
    ...reviewState.value,
    sessions: reviewState.value.sessions.map((session) =>
      session.id === updatedSession.id ? updatedSession : session
    ),
  };
  reviewState.value = updatedState;
  saveReviewsToStorage(updatedState);
};

export const deleteReviewSession = (sessionId: string) => {
  const updatedState = {
    ...reviewState.value,
    sessions: reviewState.value.sessions.filter((session) => session.id !== sessionId),
    currentSessionId: reviewState.value.currentSessionId === sessionId 
      ? null 
      : reviewState.value.currentSessionId,
  };
  reviewState.value = updatedState;
  saveReviewsToStorage(updatedState);
};

export const setCurrentSession = (sessionId: string | null) => {
  const updatedState = {
    ...reviewState.value,
    currentSessionId: sessionId,
    selectedStudentId: null, // Reset selected student when changing session
    comparisonStudentIds: [], // Reset comparisons
  };
  reviewState.value = updatedState;
  saveReviewsToStorage(updatedState);
};

export const setSelectedStudent = (studentId: string | null) => {
  const updatedState = {
    ...reviewState.value,
    selectedStudentId: studentId,
  };
  reviewState.value = updatedState;
  saveReviewsToStorage(updatedState);
};

export const toggleComparisonStudent = (studentId: string) => {
  const currentComparisons = reviewState.value.comparisonStudentIds;
  const isAlreadyComparing = currentComparisons.includes(studentId);
  
  const updatedState = {
    ...reviewState.value,
    comparisonStudentIds: isAlreadyComparing
      ? currentComparisons.filter(id => id !== studentId)
      : [...currentComparisons, studentId],
  };
  reviewState.value = updatedState;
  saveReviewsToStorage(updatedState);
};

export const clearComparisons = () => {
  const updatedState = {
    ...reviewState.value,
    comparisonStudentIds: [],
  };
  reviewState.value = updatedState;
  saveReviewsToStorage(updatedState);
};

export const updateStudentScore = (
  sessionId: string, 
  studentId: string, 
  taskId: string, 
  newScore: number, 
  feedback?: string
) => {
  const updatedState = {
    ...reviewState.value,
    sessions: reviewState.value.sessions.map((session) => {
      if (session.id !== sessionId) return session;
      
      return {
        ...session,
        students: session.students.map((student) => {
          if (student.student_id !== studentId) return student;
          
          const updatedResponses = student.responses.map((response) => {
            if (response.task_id !== taskId) return response;
            
            return {
              ...response,
              teacher_score: newScore,
              teacher_feedback: feedback || response.teacher_feedback,
            };
          });
          
          // Recalculate total score
          const totalTeacherScore = updatedResponses.reduce((sum, response) => 
            sum + (response.teacher_score ?? response.suggested_score), 0
          );
          
          return {
            ...student,
            responses: updatedResponses,
            score: totalTeacherScore,
          };
        }),
      };
    }),
  };
  
  reviewState.value = updatedState;
  saveReviewsToStorage(updatedState);
}; 