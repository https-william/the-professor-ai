import { NextRequest, NextResponse } from "next/server";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const PROJECT_ROOT = path.join(
  process.cwd(),
  ".agents",
  "skills",
  "dashiai-ppt-skill",
  "skills",
  "dashiai-ppt",
  "project"
);

export async function POST(req: NextRequest) {
  try {
    const { title, summaryText, theme = "theme08" } = await req.json();

    if (!title || !summaryText) {
      return NextResponse.json(
        { error: "Title and summaryText are required" },
        { status: 400 }
      );
    }

    // 1. Generate unique job ID and create output paths in Next.js public directory
    const jobId = crypto.randomUUID();
    const publicExportDir = path.join(process.cwd(), "public", "ppt-exports", jobId);
    const pptOutputDir = path.join(publicExportDir, "ppt");

    fs.mkdirSync(pptOutputDir, { recursive: true });

    const goalJsonPath = path.join(publicExportDir, "goal.json");
    const outputHtmlPath = path.join(pptOutputDir, "index.html");
    const outputPptxPath = path.join(publicExportDir, "presentation.pptx");

    // 2. Run DashiAI scaffolding script inside project directory
    const scaffoldCmd = `npm run goal:scaffold -- --title "${title.replace(/"/g, '\\"')}" --goal "Study Summary Presentation" --theme "${theme}" --pages 5 --out "${goalJsonPath}"`;
    execSync(scaffoldCmd, { cwd: PROJECT_ROOT, stdio: "ignore" });

    // 3. Read scaffolded JSON and fill-plan to populate slides dynamically
    const goalData = JSON.parse(fs.readFileSync(goalJsonPath, "utf-8"));
    const fillPlanPath = goalJsonPath.replace(".json", ".fill-plan.json");
    const fillPlanData = JSON.parse(fs.readFileSync(fillPlanPath, "utf-8"));

    // Quick text splitter to populate slides with user content
    const paragraphs = summaryText
      .split(/\n+/)
      .map((p: string) => p.trim())
      .filter((p: string) => p.length > 0);

    // Map content to slides based on layout requirements in fill-plan
    goalData.slides = goalData.slides.map((slide: any, index: number) => {
      const plan = fillPlanData.slides[index]?.fillPlan;
      const props: any = {};

      if (plan && plan.text) {
        plan.text.forEach((textKey: any) => {
          const maxChars = textKey.maxChars || 30;
          let content = "";

          if (textKey.key === "eyebrow" || textKey.key === "kicker" || textKey.key === "backdropWord") {
            content = title.substring(0, maxChars);
          } else if (textKey.key === "sloganLine1" || textKey.key === "headline") {
            content = (paragraphs[index % paragraphs.length] || title).substring(0, maxChars);
          } else {
            content = (paragraphs[(index + 1) % paragraphs.length] || "Active Recall Study Guide").substring(0, maxChars);
          }
          props[textKey.key] = content;
        });
      }

      if (plan && plan.arrays) {
        plan.arrays.forEach((arrKey: any) => {
          const count = arrKey.visibleCount || 3;
          props[arrKey.key] = Array.from({ length: count }, (_, i) => {
            const itemText = paragraphs[(index + i) % paragraphs.length] || "Core Study Concept";
            if (typeof arrKey.itemShape === "string") {
              return itemText.substring(0, arrKey.item?.maxChars || 30);
            } else {
              return {
                name: itemText.substring(0, arrKey.itemFields?.name?.maxChars || 15),
                en: "Concept Detail",
                title: itemText.substring(0, arrKey.itemFields?.title?.maxChars || 15),
                note: itemText.substring(0, arrKey.itemFields?.note?.maxChars || 30),
              };
            }
          });
        });
      }

      return {
        layout: slide.layout,
        props: props,
      };
    });

    // Write the populated goal back
    fs.writeFileSync(goalJsonPath, JSON.stringify(goalData, null, 2));

    // 4. Render PPT HTML output using DashiAI runtime
    const renderCmd = `npm run render:goal -- "${goalJsonPath}" "${outputHtmlPath}"`;
    execSync(renderCmd, { cwd: PROJECT_ROOT, stdio: "ignore" });

    // 5. Generate and export editable PPTX file
    const exportCmd = `npm run export:pptx -- "${outputHtmlPath}" "${outputPptxPath}"`;
    execSync(exportCmd, { cwd: PROJECT_ROOT, stdio: "ignore" });

    // 6. Return downloadable preview and file links relative to public assets
    return NextResponse.json({
      success: true,
      jobId,
      previewUrl: `/ppt-exports/${jobId}/ppt/index.html`,
      pptxUrl: `/ppt-exports/${jobId}/presentation.pptx`,
    });

  } catch (error: any) {
    console.error("PPT Generation Error:", error);
    return NextResponse.json(
      { error: "Failed to generate presentation deck: " + error.message },
      { status: 500 }
    );
  }
}
