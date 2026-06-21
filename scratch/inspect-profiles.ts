import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const envPath = path.resolve(process.cwd(), ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const env: Record<string, string> = {};
envContent.split("\n").forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
        const parts = trimmed.split("=");
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join("=").trim().replace(/^['"]|['"]$/g, '');
            env[key] = value;
        }
    }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function main() {
    const { data, error } = await supabase.from("profiles").select("*").limit(1);
    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Profile columns and data:", data);
    }
}

main();
