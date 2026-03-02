import { NextResponse } from "next/server";

// Digital Asset Links — proves The Professor Android app owns this domain.
// The SHA256 fingerprint below MUST match the signing key used to build the APK.
// After your first GitHub Actions build, grab the SHA256 from the build log
// (look for "SHA256 FINGERPRINT") and replace the placeholder below.
//
// Format: keytool output looks like: SHA256: AA:BB:CC:...
// Remove the "SHA256: " prefix and paste the colon-separated hex below.

const FINGERPRINT = process.env.APK_SIGNING_FINGERPRINT ||
    "00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00";

export async function GET() {
    const assetLinks = [
        {
            relation: ["delegate_permission/common.handle_all_urls"],
            target: {
                namespace: "android_app",
                package_name: "xyz.theprofessor.app",
                sha256_cert_fingerprints: [FINGERPRINT],
            },
        },
    ];

    return NextResponse.json(assetLinks, {
        headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=3600",
        },
    });
}
