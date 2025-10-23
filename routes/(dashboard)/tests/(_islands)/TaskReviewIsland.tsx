import { useEffect, useRef, useState } from "preact/hooks";
import { ArrowLeft, Upload, Eye, SlidersHorizontal, Check, X, Users, FileText } from "lucide-preact";
import { Button } from "../../../../components/Button.tsx";
import * as reviewStore from "../../../../components/tests/review-store.ts";
import type { ReviewSession, StudentResponse, TaskIdentification } from "../../../../components/tests/review-store.ts";

export default function TaskReviewIsland() {
  const [sessions] = useState(() => reviewStore.sessions.value);
  const [currentSession] = useState(() => reviewStore.currentSession.value);
  const [selectedStudent] = useState(() => reviewStore.selectedStudent.value);
  const [comparisonStudents] = useState(() => reviewStore.comparisonStudents.value);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to store changes
  useEffect(() => {
    const unsubscribe = reviewStore.reviewState.subscribe(() => {
      // Force re-render when store changes
    });
    return () => unsubscribe();
  }, []);

  const handleFileUpload = async (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (!file) return;
    
    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const formData = new FormData();
      formData.append("pdf", file);

      // Get API credentials from localStorage (same pattern as chat)
      const storedSettings = localStorage.getItem("apiSettings");
      if (storedSettings) {
        const settings = JSON.parse(storedSettings);
        
        // Add shop API key if available
        if (settings.universalApiKey) {
          formData.append("shopApiKey", settings.universalApiKey);
        }
        
        // Add LLM credentials if available
        if (settings.models && settings.models.length > 0) {
          const llmModel = settings.models.find((m: any) => m.capabilities?.includes("💬"));
          if (llmModel) {
            formData.append("llmApiUrl", llmModel.apiUrl);
            formData.append("llmApiKey", llmModel.apiKey);
            formData.append("llmApiModel", llmModel.model);
          }
        }
      }

      const response = await fetch("/api/task-review", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const analysisResult = await response.json();
      
      // Create new review session
      const newSession: ReviewSession = {
        id: `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        filename: file.name,
        uploaded_at: Date.now(),
        tasks: analysisResult.tasks,
        students: analysisResult.students,
        total_students: analysisResult.total_students,
        status: "completed",
      };

      reviewStore.addReviewSession(newSession);
      setUploadSuccess(`Successfully analyzed ${file.name} with ${analysisResult.total_students} students`);

    } catch (error) {
      console.error("Upload error:", error);
      setUploadError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleScoreUpdate = (
    studentId: string,
    taskId: string,
    newScore: number,
    feedback?: string
  ) => {
    if (!currentSession) return;
    
    reviewStore.updateStudentScore(
      currentSession.id,
      studentId,
      taskId,
      newScore,
      feedback
    );
  };

  const renderUploadSection = () => (
    <div class="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 class="text-2xl font-bold mb-4 flex items-center">
        <Upload class="w-6 h-6 mr-2 text-primary-600" />
        Aufgaben hochladen
      </h2>
      
      <div class="space-y-4">
        {uploadError && (
          <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <span class="font-bold">Fehler:</span> {uploadError}
          </div>
        )}

        {uploadSuccess && (
          <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            <span class="font-bold">Erfolg:</span> {uploadSuccess}
          </div>
        )}

        <div>
          <label
            htmlFor="assignment-pdf"
            class="block text-sm font-medium text-gray-700 mb-2"
          >
            PDF mit Schülerarbeiten hochladen
          </label>
          <input
            ref={fileInputRef}
            id="assignment-pdf"
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            disabled={isUploading}
            class="w-full px-3 py-2 border border-gray-300 bg-white rounded-md focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
          />
          <p class="text-sm text-gray-500 mt-1">
            Die PDF sollte die Arbeiten mehrerer Schüler enthalten
          </p>
        </div>

        {isUploading && (
          <div class="flex items-center justify-center py-4">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span class="ml-2 text-gray-600">Analysiere PDF...</span>
          </div>
        )}
      </div>
    </div>
  );

  const renderSessionSelector = () => (
    <div class="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 class="text-xl font-bold mb-4">Bewertungssitzungen</h2>
      
      {sessions.length === 0 ? (
        <p class="text-gray-500">Noch keine Sitzungen vorhanden</p>
      ) : (
        <div class="space-y-2">
          {sessions.map((session) => (
            <div
              key={session.id}
              class={`p-3 rounded-lg border cursor-pointer transition-colors ${
                currentSession?.id === session.id
                  ? "border-primary-500 bg-primary-50"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
              onClick={() => reviewStore.setCurrentSession(session.id)}
            >
              <div class="flex justify-between items-start">
                <div>
                  <h3 class="font-medium">{session.filename}</h3>
                  <p class="text-sm text-gray-500">
                    {session.total_students} Schüler • {new Date(session.uploaded_at).toLocaleDateString()}
                  </p>
                </div>
                <div class="flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      reviewStore.deleteReviewSession(session.id);
                    }}
                    class="text-red-500 hover:text-red-700"
                  >
                    <X class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderStudentList = () => {
    if (!currentSession) return null;

    return (
      <div class="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 class="text-xl font-bold mb-4 flex items-center">
          <Users class="w-5 h-5 mr-2" />
          Schüler ({currentSession.students.length})
        </h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentSession.students.map((student) => (
            <div
              key={student.student_id}
              class={`p-4 rounded-lg border cursor-pointer transition-colors ${
                selectedStudent?.student_id === student.student_id
                  ? "border-primary-500 bg-primary-50"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
              onClick={() => reviewStore.setSelectedStudent(student.student_id)}
            >
              <div class="flex justify-between items-start mb-2">
                <h3 class="font-medium">{student.student_name}</h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    reviewStore.toggleComparisonStudent(student.student_id);
                  }}
                  class={`px-2 py-1 rounded text-xs ${
                    comparisonStudents.some(s => s.student_id === student.student_id)
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {comparisonStudents.some(s => s.student_id === student.student_id) ? "Verglichen" : "Vergleichen"}
                </button>
              </div>
              
              <div class="text-sm text-gray-600">
                <div class="flex justify-between">
                  <span>Punkte:</span>
                  <span class="font-medium">{student.score.toFixed(1)} / {student.max_score}</span>
                </div>
                <div class="flex justify-between">
                  <span>Prozent:</span>
                  <span class="font-medium">{((student.score / student.max_score) * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTaskReview = () => {
    if (!currentSession || !selectedStudent) return null;

    return (
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-bold mb-4 flex items-center">
          <FileText class="w-5 h-5 mr-2" />
          Bewertung: {selectedStudent.student_name}
        </h2>

        <div class="space-y-6">
          {currentSession.tasks.map((task, taskIndex) => {
            const response = selectedStudent.responses.find(r => r.task_id === task.task_id);
            if (!response) return null;

            return (
              <div key={task.task_id} class="border border-gray-200 rounded-lg p-4">
                <div class="mb-4">
                  <h3 class="text-lg font-medium mb-2">Aufgabe {taskIndex + 1}</h3>
                  <p class="text-gray-700 mb-2">{task.task_text}</p>
                  {task.image_data && (
                    <img
                      src={task.image_data}
                      alt={`Aufgabe ${taskIndex + 1}`}
                      class="max-w-full h-auto rounded-lg mb-2"
                    />
                  )}
                  <div class="text-sm text-gray-500">
                    Typ: {task.task_type} • Max. Punkte: {task.max_points}
                  </div>
                </div>

                <div class="bg-gray-50 rounded-lg p-3 mb-4">
                  <h4 class="font-medium mb-2">Schülerantwort:</h4>
                  <p class="text-gray-700">{response.response_text}</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 class="font-medium mb-2">KI-Bewertung:</h4>
                    <div class="bg-blue-50 rounded-lg p-3">
                      <div class="text-lg font-semibold text-blue-800">
                        {response.suggested_score} / {task.max_points} Punkte
                      </div>
                      <p class="text-sm text-blue-600 mt-1">{response.feedback}</p>
                    </div>
                  </div>

                  <div>
                    <h4 class="font-medium mb-2">Lehrer-Bewertung:</h4>
                    <div class="space-y-2">
                      <div class="flex items-center space-x-2">
                        <input
                          type="number"
                          min="0"
                          max={task.max_points}
                          step="0.5"
                          value={response.teacher_score ?? response.suggested_score}
                          onChange={(e) => {
                            const newScore = parseFloat((e.target as HTMLInputElement).value);
                            handleScoreUpdate(selectedStudent.student_id, task.task_id, newScore);
                          }}
                          class="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                        />
                        <span>/ {task.max_points}</span>
                      </div>
                      <textarea
                        placeholder="Zusätzliches Feedback..."
                        value={response.teacher_feedback || ""}
                        onChange={(e) => {
                          const feedback = (e.target as HTMLTextAreaElement).value;
                          handleScoreUpdate(
                            selectedStudent.student_id,
                            task.task_id,
                            response.teacher_score ?? response.suggested_score,
                            feedback
                          );
                        }}
                        class="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderComparisonView = () => {
    if (!currentSession || comparisonStudents.length === 0) return null;

    return (
      <div class="bg-white rounded-lg shadow-md p-6 mt-8">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold">Schülervergleich</h2>
          <button
            onClick={() => reviewStore.clearComparisons()}
            class="text-sm text-gray-500 hover:text-gray-700"
          >
            Vergleich löschen
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full border-collapse border border-gray-300">
            <thead>
              <tr class="bg-gray-50">
                <th class="border border-gray-300 px-4 py-2 text-left">Aufgabe</th>
                {comparisonStudents.map((student) => (
                  <th key={student.student_id} class="border border-gray-300 px-4 py-2 text-left">
                    {student.student_name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentSession.tasks.map((task, taskIndex) => (
                <tr key={task.task_id}>
                  <td class="border border-gray-300 px-4 py-2 font-medium">
                    Aufgabe {taskIndex + 1}
                    <div class="text-sm text-gray-500">Max: {task.max_points}P</div>
                  </td>
                  {comparisonStudents.map((student) => {
                    const response = student.responses.find(r => r.task_id === task.task_id);
                    const score = response?.teacher_score ?? response?.suggested_score ?? 0;
                    return (
                      <td key={student.student_id} class="border border-gray-300 px-4 py-2">
                        <div class="font-semibold">{score} / {task.max_points}P</div>
                        <div class="text-sm text-gray-600 truncate" title={response?.response_text}>
                          {response?.response_text?.substring(0, 50)}...
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr class="bg-gray-50 font-semibold">
                <td class="border border-gray-300 px-4 py-2">Gesamt</td>
                {comparisonStudents.map((student) => (
                  <td key={student.student_id} class="border border-gray-300 px-4 py-2">
                    {student.score.toFixed(1)} / {student.max_score}
                    <div class="text-sm font-normal">
                      ({((student.score / student.max_score) * 100).toFixed(1)}%)
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div class="container mx-auto px-4 py-8 max-w-7xl">
      <div class="mb-8">
        <a
          href="/tests"
          class="inline-flex items-center text-primary-600 hover:text-primary-800"
        >
          <ArrowLeft class="w-5 h-5 mr-2" />
          Zurück zu Tests
        </a>
      </div>

      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Aufgaben prüfen</h1>
        <p class="mt-2 text-gray-600">
          Laden Sie Schülerarbeiten hoch und lassen Sie sie von der KI bewerten
        </p>
      </div>

      {renderUploadSection()}
      {renderSessionSelector()}
      {renderStudentList()}
      {renderTaskReview()}
      {renderComparisonView()}
    </div>
  );
} 