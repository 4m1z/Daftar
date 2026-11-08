import { prisma } from "~/db.server";

export type Template = {
    id: string;
    name: string;
    description: string | null;
    content: string;
    category: string;
    isPredefined: boolean;
    createdAt: string;
    updatedAt: string;
};

export async function listTemplates(): Promise<Template[]> {
    const templates = await prisma.template.findMany({
        orderBy: [{ category: "asc" }, { name: "asc" }],
        select: {
            id: true,
            name: true,
            description: true,
            content: true,
            category: true,
            isPredefined: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    return templates.map((template) => ({
        id: template.id,
        name: template.name,
        description: template.description,
        content: template.content,
        category: template.category,
        isPredefined: template.isPredefined,
        createdAt: template.createdAt.toISOString(),
        updatedAt: template.updatedAt.toISOString(),
    }));
}

export async function createTemplate({
    id,
    name,
    description,
    content,
    category,
    isPredefined = false,
}: {
    id: string;
    name: string;
    description?: string;
    content: string;
    category: string;
    isPredefined?: boolean;
}) {
    return prisma.template.create({
        data: {
            id,
            name,
            description,
            content,
            category,
            isPredefined,
        },
        select: { updatedAt: true },
    });
}

export async function updateTemplate(
    id: string,
    { name, description, content, category }: { name: string; description?: string; content: string; category: string },
) {
    const result = await prisma.template.updateMany({
        where: { id },
        data: { name, description, content, category },
    });
    if (result.count === 0) throw new Response("Template not found", { status: 404 });
    return { updatedAt: new Date() };
}

export async function deleteTemplate(id: string) {
    const result = await prisma.template.deleteMany({ where: { id, isPredefined: false } });
    if (result.count === 0) throw new Response("Custom template not found", { status: 404 });
    return { updatedAt: new Date() };
}

export async function getTemplate(id: string): Promise<Template | null> {
    const template = await prisma.template.findFirst({
        where: { id },
        select: {
            id: true,
            name: true,
            description: true,
            content: true,
            category: true,
            isPredefined: true,
            createdAt: true,
            updatedAt: true,
        },
    });
    if (!template) return null;
    return {
        id: template.id,
        name: template.name,
        description: template.description,
        content: template.content,
        category: template.category,
        isPredefined: template.isPredefined,
        createdAt: template.createdAt.toISOString(),
        updatedAt: template.updatedAt.toISOString(),
    };
}

export async function ensurePredefinedTemplates() {
    const existing = await prisma.template.count({ where: { isPredefined: true } });
    if (existing > 0) return;

    const predefinedTemplates = [
        {
            key: "daily-notes",
            name: "Daily Notes",
            description: "A structured template for daily journaling and planning",
            category: "Journaling",
            content: `# Daily Notes - {{date}}

## 🎯 Today's Focus
- [ ] 
- [ ] 
- [ ] 

## 📝 Notes
<!-- Capture thoughts, observations, and important information throughout the day -->

## ✅ Completed
- 

## 💭 Reflections
<!-- What went well? What could be improved? -->

## 📅 Tomorrow's Priorities
- [ ] 
- [ ] `,
        },
        {
            key: "meeting-notes",
            name: "Meeting Notes",
            description: "Template for organized meeting documentation",
            category: "Work",
            content: `# Meeting: {{date}}

**Attendees:** 
**Date/Time:** 
**Duration:** 

## 📋 Agenda
1. 
2. 
3. 

## 📝 Discussion Points
### Topic 1
- 

### Topic 2
- 

## ✅ Action Items
| Action | Owner | Due Date |
|--------|-------|----------|
|  |  |  |
|  |  |  |

## 🔑 Key Decisions
- 

## 📎 Follow-up
- Next meeting: 
- Notes shared with: `,
        },
        {
            key: "todo-list",
            name: "To-Do List",
            description: "Simple and effective task management template",
            category: "Productivity",
            content: `# To-Do List - {{date}}

## 🔴 High Priority
- [ ] 
- [ ] 

## 🟡 Medium Priority
- [ ] 
- [ ] 

## 🟢 Low Priority
- [ ] 
- [ ] 

## ✅ Completed Today
- [ ] 
- [ ] 

## 📌 Notes
<!-- Additional context, blockers, or reminders -->`,
        },
        {
            key: "project-planning",
            name: "Project Planning",
            description: "Comprehensive project planning and tracking template",
            category: "Work",
            content: `# Project: {{date}}

## 🎯 Project Overview
**Goal:** 
**Timeline:** 
**Status:** ████████░░ 80%

## 📋 Scope & Deliverables
- [ ] Deliverable 1
- [ ] Deliverable 2
- [ ] Deliverable 3

## 🗓️ Milestones
| Milestone | Target Date | Status |
|-----------|-------------|--------|
|  |  | ⬜ Not Started |
|  |  | ⬜ Not Started |
|  |  | ⬜ Not Started |

## ✅ Tasks
### Phase 1
- [ ] Task 1
- [ ] Task 2

### Phase 2
- [ ] Task 3
- [ ] Task 4

## ⚠️ Risks & Blockers
- 

## 📊 Resources & Budget
- 

## 📝 Notes
<!-- Meeting notes, decisions, references -->`,
        },
        {
            key: "bug-report",
            name: "Bug Report",
            description: "Structured bug reporting template for development",
            category: "Development",
            content: `# Bug Report: {{date}}

## 🐛 Summary
**Title:** 
**Severity:** ▢ Critical ▢ High ▢ Medium ▢ Low
**Component:** 
**Version:** 

## 📝 Description
<!-- Clear and concise description of the bug -->

## 🔄 Steps to Reproduce
1. 
2. 
3. 

## ✅ Expected Behavior
<!-- What should happen? -->

## ❌ Actual Behavior
<!-- What actually happens? -->

## 🖥️ Environment
- **OS:** 
- **Browser/Device:** 
- **Network:** 

## 📸 Screenshots/Logs
<!-- Attach relevant screenshots, error logs, or recordings -->

## 🔍 Additional Context
<!-- Any other information, configuration, or data that might help -->`,
        },
        {
            key: "study-notes",
            name: "Study Notes",
            description: "Template for effective learning and knowledge retention",
            category: "Learning",
            content: `# Study Notes: {{date}}

**Topic:** 
**Source:** 
**Duration:** 

## 📚 Key Concepts
### Concept 1
- Definition: 
- Examples: 

### Concept 2
- Definition: 
- Examples: 

## ❓ Questions & Unclear Points
- 

## 💡 Insights & Connections
- 

## 🧪 Practice / Exercises
- 

## 📖 References & Resources
- 

## 🔄 Review Schedule
- [ ] 1 day later
- [ ] 1 week later
- [ ] 1 month later`,
        },
        {
            key: "weekly-review",
            name: "Weekly Review",
            description: "Template for weekly reflection and planning",
            category: "Journaling",
            content: `# Weekly Review - Week of {{date}}

## 🎯 This Week's Goals
| Goal | Status | Notes |
|------|--------|-------|
|  | ⬜ |  |
|  | ⬜ |  |
|  | ⬜ |  |

## ✅ Accomplishments
- 
- 
- 

## 📊 Metrics & Progress
- 

## 🤔 What Went Well
- 
- 

## 📈 What Could Be Improved
- 
- 

## 🎯 Next Week's Focus
- [ ] 
- [ ] 
- [ ] 

## 💭 Personal Reflection
<!-- Energy levels, mood, learnings, gratitude -->`,
        },
    ];

    await prisma.$transaction(
        predefinedTemplates.map(({ key, ...template }) =>
            prisma.template.upsert({
                where: { id: key },
                update: {},
                create: {
                    ...template,
                    id: key,
                    isPredefined: true,
                },
            }),
        ),
    );
}
