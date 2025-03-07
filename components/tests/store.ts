import { signal, computed } from "@preact/signals";

// Define the test interface
export interface Test {
  id: string;
  name: string;
  nodeId?: string; // Optional ID of the associated graph node
  content: string;
  questions: TestQuestion[];
  createdAt: number;
  lastUpdatedAt: number;
}

// Define question types
export interface TestQuestion {
  id: string;
  type: "multiple_choice" | "true_false" | "short_answer";
  question: string;
  options?: string[]; // For multiple choice
  correctAnswer: string | string[] | number; // String for text, array for multiple answers, number for option index
  imageUrl?: string; // Base64 encoded image data
}

// Define the tests store
interface TestsState {
  tests: Test[];
  selectedTestId: string | null;
}

// Initialize the store with data from localStorage
const loadStoredTests = (): TestsState => {
  if (typeof localStorage === "undefined") {
    return { tests: [], selectedTestId: null };
  }

  try {
    const storedTests = localStorage.getItem("tests");
    if (storedTests) {
      return JSON.parse(storedTests);
    }
  } catch (error) {
    console.error("Failed to load tests from localStorage:", error);
  }

  return { tests: [], selectedTestId: null };
};

// Create signals for the store
export const testsState = signal<TestsState>(loadStoredTests());

// Create computed signals for easier access
export const tests = computed(() => testsState.value.tests);
export const selectedTestId = computed(() => testsState.value.selectedTestId);
export const selectedTest = computed(() => 
  testsState.value.tests.find(test => test.id === testsState.value.selectedTestId) || null
);

// Helper function to save tests to localStorage
const saveTestsToStorage = (state: TestsState) => {
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem("tests", JSON.stringify(state));
    } catch (error) {
      console.error("Failed to save tests to localStorage:", error);
    }
  }
};

// Actions for modifying the tests
export const addTest = (test: Test) => {
  const updatedState = {
    ...testsState.value,
    tests: [...testsState.value.tests, test],
  };
  testsState.value = updatedState;
  saveTestsToStorage(updatedState);
};

export const updateTest = (updatedTest: Test) => {
  const updatedState = {
    ...testsState.value,
    tests: testsState.value.tests.map(test => 
      test.id === updatedTest.id ? { ...updatedTest, lastUpdatedAt: Date.now() } : test
    ),
  };
  testsState.value = updatedState;
  saveTestsToStorage(updatedState);
};

export const deleteTest = (testId: string) => {
  const updatedState = {
    ...testsState.value,
    tests: testsState.value.tests.filter(test => test.id !== testId),
    selectedTestId: testsState.value.selectedTestId === testId ? null : testsState.value.selectedTestId,
  };
  testsState.value = updatedState;
  saveTestsToStorage(updatedState);
};

export const setSelectedTest = (testId: string | null) => {
  const updatedState = {
    ...testsState.value,
    selectedTestId: testId,
  };
  testsState.value = updatedState;
  saveTestsToStorage(updatedState);
};

// Node-specific test functions
export const getTestForNode = (nodeId: string): Test | null => {
  return testsState.value.tests.find(test => test.nodeId === nodeId) || null;
};

export const hasTestForNode = (nodeId: string): boolean => {
  return testsState.value.tests.some(test => test.nodeId === nodeId);
};

export const createTestForNode = (nodeId: string, nodeName: string): Test => {
  const newTest: Test = {
    id: `test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    name: `Test for ${nodeName}`,
    nodeId,
    content: `This test covers the topic of ${nodeName}.`,
    questions: [],
    createdAt: Date.now(),
    lastUpdatedAt: Date.now(),
  };
  
  addTest(newTest);
  return newTest;
}; 