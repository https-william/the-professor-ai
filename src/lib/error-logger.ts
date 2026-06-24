/**
 * error-logger.ts
 *
 * Lightweight server-side error + event logging.
 * Currently logs to console (structured JSON for easy Vercel log ingestion).
 * Drop-in ready for Sentry or Axiom — just add the SDK call below the console.log.
 */

import { createClient } from "@supabase/supabase-js";

// Make sure these are defined in your env, otherwise fallback to prevent crashes
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

type LogLevel = "info" | "warn" | "error";

function log(level: LogLevel, event: string, data: Record<string, unknown>) {
    const entry = {
        timestamp: new Date().toISOString(),
        level,
        event,
        ...data,
    };
    // Vercel captures stdout as structured logs
    if (level === "error") {
        console.error(JSON.stringify(entry));
    } else if (level === "warn") {
        console.warn(JSON.stringify(entry));
    } else {
        console.log(JSON.stringify(entry));
    }
    
    // Asynchronously push to Supabase if configured
    if (supabase) {
        supabase.from("system_logs").insert([{
            level,
            event,
            data
        }]).then(({ error }) => {
            if (error) console.error("Failed to push log to Supabase:", error);
        });
    }
}

// ─── Parser Events ────────────────────────────────────────────────────────────
export function logParserError(
    fileType: string,
    fileSizeBytes: number,
    errorMessage: string
) {
    log("error", "parser.error", {
        fileType,
        fileSizeMB: +(fileSizeBytes / 1024 / 1024).toFixed(2),
        errorMessage: String(errorMessage).substring(0, 500),
    });
}

export function logParserSuccess(
    fileType: string,
    fileSizeBytes: number,
    wordCount: number,
    durationMs: number
) {
    log("info", "parser.success", {
        fileType,
        fileSizeMB: +(fileSizeBytes / 1024 / 1024).toFixed(2),
        wordCount,
        durationMs,
    });
}

// ─── AI Generation Events ─────────────────────────────────────────────────────
export function logAIError(
    provider: string,
    feature: string,
    errorMessage: string,
    durationMs?: number
) {
    log("error", "ai.error", {
        provider,
        feature,
        errorMessage: String(errorMessage).substring(0, 500),
        durationMs,
    });
}

export function logAISuccess(
    provider: string,
    feature: string,
    durationMs: number,
    outputTokensEstimate?: number
) {
    log("info", "ai.success", {
        provider,
        feature,
        durationMs,
        outputTokensEstimate,
    });
}

// ─── API Route Events ─────────────────────────────────────────────────────────
export function logAPIError(
    route: string,
    statusCode: number,
    errorMessage: string
) {
    log("error", "api.error", {
        route,
        statusCode,
        errorMessage: String(errorMessage).substring(0, 500),
    });
}
