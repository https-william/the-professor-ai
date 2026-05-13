/**
 * error-logger.ts
 *
 * Lightweight server-side error + event logging.
 * Currently logs to console (structured JSON for easy Vercel log ingestion).
 * Drop-in ready for Sentry or Axiom — just add the SDK call below the console.log.
 */

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
    // TODO: sentry.captureEvent(entry) or axiom.ingest(entry)
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
