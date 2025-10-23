#!/usr/bin/env -S deno run -A

const iconMapping: Record<string, string> = {
  IconAdjustmentsHorizontal: "SlidersHorizontal",
  IconArrowLeft: "ArrowLeft",
  IconArrowRight: "ArrowRight",
  IconBook: "Book",
  IconBrain: "Brain",
  IconCalendar: "Calendar",
  IconCheck: "Check",
  IconChevronDown: "ChevronDown",
  IconDeviceGamepad2: "Gamepad2",
  IconDownload: "Download",
  IconEdit: "Edit",
  IconExclamationCircle: "AlertCircle",
  IconEye: "Eye",
  IconEyeCancel: "EyeOff",
  IconFileExport: "FileDown",
  IconFileText: "FileText",
  IconGavel: "Gavel",
  IconImageInPicture: "PictureInPicture",
  IconInfoCircleFilled: "Info",
  IconKey: "Key",
  IconLayoutGrid: "LayoutGrid",
  IconLink: "Link",
  IconList: "List",
  IconListCheck: "ListChecks",
  IconLoader: "Loader",
  IconLoader2: "Loader2",
  IconMaximize: "Maximize",
  IconMessageCircle: "MessageCircle",
  IconMessagePlus: "MessageSquarePlus",
  IconMicrophone: "Mic",
  IconMouse: "Mouse",
  IconMouseOff: "MouseOff",
  IconPdf: "FileText",
  IconPhoto: "Image",
  IconPlayerPlay: "Play",
  IconPlus: "Plus",
  IconPresentation: "Presentation",
  IconQuestionMark: "HelpCircle",
  IconRefresh: "RefreshCw",
  IconSend: "Send",
  IconSettings: "Settings",
  IconTag: "Tag",
  IconTitle: "Heading",
  IconTrash: "Trash2",
  IconUpload: "Upload",
  IconUsers: "Users",
  IconVideo: "Video",
  IconVolume: "Volume2",
  IconVolumeOff: "VolumeX",
  IconX: "X",
};

async function getAllFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  for await (const entry of Deno.readDir(dir)) {
    const fullPath = `${dir}/${entry.name}`;
    if (entry.isDirectory && !entry.name.startsWith(".") && entry.name !== "node_modules") {
      files.push(...await getAllFiles(fullPath));
    } else if (entry.isFile && (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts"))) {
      files.push(fullPath);
    }
  }
  return files;
}

async function migrateFile(filePath: string): Promise<boolean> {
  let content = await Deno.readTextFile(filePath);
  let modified = false;

  if (!content.includes("@tabler/icons-preact")) {
    return false;
  }

  console.log(`Migrating: ${filePath}`);

  const importRegex = /import\s*{([^}]+)}\s*from\s*["']@tabler\/icons-preact["'];?/g;
  const matches = [...content.matchAll(importRegex)];

  for (const match of matches) {
    const importedIcons = match[1].split(",").map((icon) => icon.trim()).filter((icon) => icon.length > 0);
    const lucideIcons = importedIcons.map((icon) => iconMapping[icon] || icon).join(", ");
    const newImport = `import { ${lucideIcons} } from "lucide-preact";`;
    content = content.replace(match[0], newImport);
    modified = true;
  }

  for (const [tablerIcon, lucideIcon] of Object.entries(iconMapping)) {
    const iconUsageRegex = new RegExp(`<${tablerIcon}([\\s/>])`, "g");
    if (iconUsageRegex.test(content)) {
      content = content.replace(iconUsageRegex, `<${lucideIcon}$1`);
      modified = true;
    }
  }

  if (modified) {
    await Deno.writeTextFile(filePath, content);
    console.log(`✅ Updated: ${filePath}`);
  }

  return modified;
}

async function main() {
  console.log("🔄 Starting icon migration from @tabler/icons-preact to lucide-preact...\n");
  const directories = ["islands", "components", "routes"];
  let totalFiles = 0;
  let modifiedFiles = 0;

  for (const dir of directories) {
    try {
      const files = await getAllFiles(dir);
      console.log(`\n📁 Processing ${dir}/... (${files.length} files)`);
      for (const file of files) {
        totalFiles++;
        if (await migrateFile(file)) modifiedFiles++;
      }
    } catch (error) {
      console.error(`Error processing ${dir}:`, error);
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log(`✅ Migration complete! Total files scanned: ${totalFiles}, Files modified: ${modifiedFiles}`);
  console.log("=".repeat(50));
}

if (import.meta.main) {
  main();
}
