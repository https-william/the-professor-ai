import os
import re

files_with_sparkles = [
    r"c:\Users\cutef\Downloads\My Projects\the-professor\src\components\ui\PWAInstallBanner.tsx",
    r"c:\Users\cutef\Downloads\My Projects\the-professor\src\components\ui\Markdown.tsx",
    r"c:\Users\cutef\Downloads\My Projects\the-professor\src\components\modals\KnowledgeIngestModal.tsx",
    r"c:\Users\cutef\Downloads\My Projects\the-professor\src\components\landing\PhilosophySection.tsx",
    r"c:\Users\cutef\Downloads\My Projects\the-professor\src\components\landing\HeroSection.tsx",
    r"c:\Users\cutef\Downloads\My Projects\the-professor\src\components\landing\FinalCTA.tsx",
    r"c:\Users\cutef\Downloads\My Projects\the-professor\src\components\platforms\web\DashboardWeb.tsx",
    r"c:\Users\cutef\Downloads\My Projects\the-professor\src\components\features\create\StudyPackCommandCenter.tsx",
    r"c:\Users\cutef\Downloads\My Projects\the-professor\src\components\features\create\ExamSprintCard.tsx",
    r"c:\Users\cutef\Downloads\My Projects\the-professor\src\app\[slug]\page.tsx",
    r"c:\Users\cutef\Downloads\My Projects\the-professor\src\app\settings\page.tsx",
    r"c:\Users\cutef\Downloads\My Projects\the-professor\src\app\onboarding\preview\page.tsx",
    r"c:\Users\cutef\Downloads\My Projects\the-professor\src\app\onboarding\processing\page.tsx",
    r"c:\Users\cutef\Downloads\My Projects\the-professor\src\app\onboarding\page.tsx",
    r"c:\Users\cutef\Downloads\My Projects\the-professor\src\app\library\pack\[id]\page.tsx",
    r"c:\Users\cutef\Downloads\My Projects\the-professor\src\app\hub\HubClient.tsx",
    r"c:\Users\cutef\Downloads\My Projects\the-professor\src\app\glossary\[slug]\page.tsx",
    r"c:\Users\cutef\Downloads\My Projects\the-professor\src\app\eli5\page.tsx",
    r"c:\Users\cutef\Downloads\My Projects\the-professor\src\app\blog\BlogClient.tsx",
]

for file_path in files_with_sparkles:
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        continue
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        if 'Sparkles' in content and 'import' in content and 'lucide-react' in content:
            if re.search(r'import\s+\{[^}]*Sparkles[^}]*\}\s+from\s+["\']lucide-react["\']', content):
                pass # Already imported
            else:
                print(f"Sparkles used but potentially not imported in {file_path}")
        elif 'Sparkles' in content:
            print(f"Sparkles used but NOT imported in {file_path}")
