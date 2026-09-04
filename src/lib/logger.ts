import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export type BugSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface LogOptions {
  severity?: BugSeverity;
  context?: any;
  userId?: string;
  source?: string;
}

/**
 * Logs an error to Firestore for the Bug Analyzer Agent to read.
 */
export const logError = async (error: Error | string, options: LogOptions = {}) => {
  try {
    const errorMessage = typeof error === "string" ? error : error.message;
    const stackTrace = typeof error === "string" ? null : error.stack;

    const logData = {
      message: errorMessage,
      stack: stackTrace || null,
      severity: options.severity || "MEDIUM",
      context: options.context ? JSON.stringify(options.context) : null,
      userId: options.userId || null,
      source: options.source || "Client",
      status: "NEW",
      createdAt: serverTimestamp(),
      resolvedAt: null,
      aiAnalysis: null,
    };

    await addDoc(collection(db, "error_logs"), logData);
    
    // Also log to console in development
    console.error("[Logger] Captured:", errorMessage);
  } catch (err) {
    console.error("Failed to log error to Firestore:", err);
  }
};
