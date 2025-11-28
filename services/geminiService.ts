import { GoogleGenAI, Type, Content, Part } from "@google/genai";
import { 
  ExamAnalysis, 
  NotebookAnalysis, 
  Worksheet, 
  CameraAnalysisResult, 
  ProfessorLevel, 
  ProfessorResponse, 
  ChatMessage, 
  QuizQuestion, 
  Difficulty 
} from '../types';

// --- API Key Management & Rate Limiting ---

let keyIndex = 0;

const getNextApiKey = (): string => {
  const keysRaw = process.env.API_KEY || "";
  const keys = keysRaw.split(',').map(k => k.trim()).filter(k => k);
  
  if (keys.length === 0) {
    console.error("No API Keys found in process.env.API_KEY");
    return "";
  }
  
  const key = keys[keyIndex];
  
  // LOGGING: Show which key is being used (masked for security)
  const maskedKey = key.substring(0, 8) + '...' + key.substring(key.length - 4);
  console.log(`%c[Gemini Load Balancer] 🔑 Using Key #${keyIndex + 1}/${keys.length}: ${maskedKey}`, 'color: #10b981; font-weight: bold;');

  keyIndex = (keyIndex + 1) % keys.length;
  return key;
};

/**
 * Executes a Gemini operation with automatic retry on Rate Limit (429) errors.
 * It rotates to the next API key upon failure.
 */
const executeWithRetry = async <T>(
  operation: (apiKey: string) => Promise<T>
): Promise<T> => {
  const keysRaw = process.env.API_KEY || "";
  const keys = keysRaw.split(',').filter(k => k.trim());
  
  // If no keys, just try once (will fail inside operation)
  if (keys.length === 0) return operation("");

  // Try up to the number of keys available (capped at 5 to prevent infinite hanging)
  const maxRetries = Math.min(keys.length, 5);
  
  let lastError: any;

  for (let i = 0; i < maxRetries; i++) {
    const apiKey = getNextApiKey();
    try {
      return await operation(apiKey);
    } catch (error: any) {
      lastError = error;
      
      // Check for Rate Limit (429) or Quota issues
      const isRateLimit = 
        error.message?.includes('429') || 
        error.message?.includes('Resource has been exhausted') ||
        error.status === 429;

      if (isRateLimit) {
        console.warn(`%c[Rate Limit Hit] ⚠️ Switching to next key... (Attempt ${i + 1}/${maxRetries})`, 'color: orange; font-weight: bold;');
        // Add a small randomized backoff delay (200-500ms) to be polite
        await new Promise(r => setTimeout(r, 200 + Math.random() * 300));
        continue; 
      }
      
      // If it's not a rate limit error (e.g. Invalid Argument), throw immediately
      throw error;
    }
  }
  
  // If we ran out of retries, throw the last error
  throw lastError;
};

// 1. Exam Analysis
export const analyzeExam = async (base64Data: string, mimeType: string = 'application/pdf'): Promise<ExamAnalysis> => {
  return executeWithRetry(async (apiKey) => {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
      Analyze this exam paper.
      1. Extract the questions and provide detailed step-by-step solutions using LaTeX for math.
      2. Analyze the marks distribution by chapter.
      3. Analyze the difficulty level.
      4. Identify weak areas and suggest a revision plan.
      Return the response in JSON format matching the schema.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            marksDistribution: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  chapter: { type: Type.STRING },
                  marks: { type: Type.NUMBER }
                }
              }
            },
            topicAnalysis: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  topic: { type: Type.STRING },
                  frequency: { type: Type.STRING }
                }
              }
            },
            difficultyMap: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  level: { type: Type.STRING },
                  percentage: { type: Type.NUMBER }
                }
              }
            },
            weakAreas: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            revisionPlan: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            solutions: { type: Type.STRING, description: "Markdown content of solutions" }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as ExamAnalysis;
  });
};

// 2. MathCam Analysis
export const analyzeFrame = async (base64Data: string, mode: 'solver' | 'teacher'): Promise<CameraAnalysisResult> => {
  return executeWithRetry(async (apiKey) => {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = mode === 'solver' 
      ? "Act as an expert professor. Solve the math problem. Provide a rigorous, step-by-step derivation using LaTeX for math. State known values and formulas. Return valid JSON."
      : "Act as a formal academic tutor. Analyze the math problem. Do NOT provide the full solution immediately. Instead: 1. Identify the core concept. 2. Provide a high-level hint. 3. Check for errors. Be concise. Return valid JSON.";

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            solvedEquation: { type: Type.STRING },
            steps: { type: Type.ARRAY, items: { type: Type.STRING } },
            hint: { type: Type.STRING },
            errorDetected: { type: Type.STRING },
            rawTextResponse: { type: Type.STRING }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as CameraAnalysisResult;
  });
};

// 3. Professor Chat
export const askProfessor = async (query: string, level: ProfessorLevel, audioData?: string): Promise<ProfessorResponse> => {
  return executeWithRetry(async (apiKey) => {
    const ai = new GoogleGenAI({ apiKey });
    
    let systemInstruction = `You are an AI Professor. 
    1. **Strict Formal Tone**: Start DIRECTLY with the academic content.
    2. **Format**: Use Markdown. Use **bold** for terms.
    3. **Math**: ALWAYS use LaTeX for math expressions (e.g. $E=mc^2$).
    4. **Structure**: Definition -> Explanation -> Example.
    `;
    
    switch (level) {
      case ProfessorLevel.ELEMENTARY:
        systemInstruction += " Persona: Friendly Teacher (Grade 1-5). Simple analogies.";
        break;
      case ProfessorLevel.MIDDLE:
        systemInstruction += " Persona: Middle School Tutor (Grade 6-8). Focus on logic.";
        break;
      case ProfessorLevel.HIGH:
        systemInstruction += " Persona: High School/SAT Prep. Formal. Use LaTeX.";
        break;
      case ProfessorLevel.COLLEGE:
        systemInstruction += " Persona: University Professor. Rigorous proofs.";
        break;
      case ProfessorLevel.PHD:
        systemInstruction += " Persona: Research Scientist. Deep theory.";
        break;
    }

    const parts: Part[] = [];
    if (audioData) {
        parts.push({ inlineData: { mimeType: 'audio/webm', data: audioData } });
        if (!query) parts.push({ text: "Listen to the audio and respond." });
    } else {
        parts.push({ text: query });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts },
      config: {
        systemInstruction: systemInstruction,
        tools: [{ googleSearch: {} }],
      }
    });

    return {
        text: response.text || "I couldn't understand that.",
        groundingMetadata: response.candidates?.[0]?.groundingMetadata
    };
  });
};

// 4. Worksheet Generator
export const generateWorksheet = async (topic: string, difficulty: Difficulty, count: number): Promise<Worksheet> => {
  return executeWithRetry(async (apiKey) => {
    const ai = new GoogleGenAI({ apiKey });

    // Optimization: explicit instruction to be concise to avoid JSON truncation
    const prompt = `Generate a math worksheet with ${count} questions on "${topic}" (${difficulty}).
    
    Return valid JSON:
    {
      "title": "Worksheet Title",
      "questions": [
        {
          "id": 1,
          "question": "The question text. Use LaTeX for math (e.g. $x^2$).",
          "answer": "Final answer.",
          "explanation": "Concise step-by-step derivation. Keep it brief to ensure valid JSON.",
          "difficulty": "${difficulty}",
          "topic": "${topic}"
        }
      ]
    }`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { text: prompt },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  question: { type: Type.STRING },
                  answer: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  difficulty: { type: Type.STRING },
                  topic: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Failed to generate worksheet");
    return JSON.parse(text) as Worksheet;
  });
};

// 5. Solver Chat Service (Advanced)
export const sendSolverMessage = async (history: ChatMessage[], newMessage: ChatMessage): Promise<string> => {
  return executeWithRetry(async (apiKey) => {
    const ai = new GoogleGenAI({ apiKey });

    const contents: Content[] = history.map(msg => {
      const parts: Part[] = [{ text: msg.text }];
      if (msg.attachments) {
        msg.attachments.forEach(att => {
          parts.push({
            inlineData: {
              mimeType: att.mimeType,
              data: att.data
            }
          });
        });
      }
      return {
        role: msg.role,
        parts: parts
      };
    });

    const newParts: Part[] = [{ text: newMessage.text }];
    if (newMessage.attachments) {
      newMessage.attachments.forEach(att => {
        newParts.push({
          inlineData: {
            mimeType: att.mimeType,
            data: att.data
          }
        });
      });
    }
    contents.push({ role: 'user', parts: newParts });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: `
          You are an **Advanced AI Math Tutor & Solver** designed for CBSE/SAT students.
          
          ### 1. INPUT PROCESSING RULE (OCR & CLEANING)
          - If the user provides an image or messy text, FIRST clean it.
          - Fix formatting issues and OCR mistakes.
          - Rewrite the final clear version of the question.
          - Identify the specific Chapter/Topic (e.g., Trigonometry, Quadratic Equations).

          ### 2. MODE DETECTION
          **DETECT USER INTENT**:
          - **HINT MODE**: If user says "hint", "help", "guide", "clue" -> Provide ONLY a small pedagogical hint. Do NOT solve it.
          - **WORKSHEET MODE**: If user says "generate worksheet", "practice questions", "give me problems" -> Generate 10 mixed-difficulty questions on the current topic.
          - **SOLVER MODE** (Default): Provide the full solution.

          ### 3. RESPONSE FORMAT (Strictly Follow This Structure)
          
          **For Solver Mode:**
          1.  **Cleaned Question:** [The clear version of the input]
          2.  **Topic Identified:** [e.g. Polynomials - Class 10]
          3.  **Step-by-Step Solution:**
              *   **Formula:** State the relevant formula first.
              *   **Substitution:** Show values plugged into the formula.
              *   **Calculation:** Show intermediate steps.
              *   **Final Answer:** Clearly boxed or bolded.
          4.  **Verification:** explicit double-check (e.g. reverse substitution or plugging answer back).

          **For Hint Mode:**
          1.  **Topic Identified:** ...
          2.  **Pedagogical Hint:** [A nudge in the right direction]

          **For Worksheet Mode:**
          1.  **Practice Worksheet:** List 10 questions (Easy/Medium/Hard).
          2.  **Answers:** Hidden or at the bottom.

          ### 4. RULES
          - Use **LaTeX** for all math (e.g., $x^2 + 2x + 1 = 0$).
          - Keep explanations clear and aligned with standard school curriculum (CBSE/Common Core).
          - No college-level methods unless explicitly asked.
          - If image is unclear, ask for a rescan.
        `
      }
    });
    return response.text || "I couldn't generate a response.";
  });
};

// 6. Notebook Sync (PDF Support)
export const analyzeNotebook = async (base64Data: string, mimeType: string = 'image/jpeg'): Promise<NotebookAnalysis> => {
  return executeWithRetry(async (apiKey) => {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
      Analyze this notebook page or PDF document.
      1. Transcribe into Markdown. Use LaTeX for math.
      2. Extract key concepts and connections.
      3. Create an action plan and flashcards.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { inlineData: { mimeType, data: base64Data } },
                { text: prompt }
            ]
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              transcription: { type: Type.STRING },
              summary: { type: Type.STRING },
              keyConcepts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    definition: { type: Type.STRING },
                    category: { type: Type.STRING }
                  }
                }
              },
              connections: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    source: { type: Type.STRING },
                    target: { type: Type.STRING },
                    relationship: { type: Type.STRING }
                  }
                }
              },
              actionPlan: { type: Type.ARRAY, items: { type: Type.STRING } },
              flashcards: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    front: { type: Type.STRING },
                    back: { type: Type.STRING },
                    mastered: { type: Type.BOOLEAN }
                  }
                }
              }
            }
          }
        }
    });
    
    const text = response.text;
    if (!text) throw new Error("No response");
    return JSON.parse(text) as NotebookAnalysis;
  });
}

// 7. Quiz Battle Generator
export const generateQuizQuestion = async (topic: string, grade: string): Promise<QuizQuestion> => {
  return executeWithRetry(async (apiKey) => {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Generate 1 multiple-choice question for ${grade} level students on the topic "${topic}".
    
    Output strictly valid JSON with this structure:
    {
      "question": "The actual question text here. Use LaTeX for math. Do NOT include any instructions, meta-commentary, or descriptions of the format.",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswer": "The exact string content of the correct option",
      "explanation": "Brief explanation of why it is correct"
    }
    
    IMPORTANT: 
    1. The "question" field must contain ONLY the math problem/question.
    2. "correctAnswer" must match one of the strings in "options" exactly.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { text: prompt },
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    question: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correctAnswer: { type: Type.STRING },
                    explanation: { type: Type.STRING }
                }
            }
        }
    });
    const text = response.text;
    if (!text) throw new Error("Quiz gen failed");
    return JSON.parse(text) as QuizQuestion;
  });
}