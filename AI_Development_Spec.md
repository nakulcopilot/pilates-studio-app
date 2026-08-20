# AI Development Specification - Pilates with Neelam

## Project Overview
This document outlines the AI-enhanced features for the Pilates with Neelam studio application. Based on the product specification, the AI layer provides intelligent assistance across student assessment, booking, practice guidance, instructor support, and business analytics.

## Technology Stack
- **Framework**: Next.js 14 (App Router), React 19, TypeScript
- **Database**: PostgreSQL via Supabase with Prisma ORM
- **AI Engine**: Deterministic rules-based with LLM fallback (OpenAI/Groq/Ollama)
- **Styling**: Tailwind CSS ^4
- **Testing**: Playwright (E2E), Vitest (unit)

## AI Architecture

### 1. Student AI Layer
- **AI Assessment**: 2-minute conversational assessment upon first visit
- **Natural-language booking**: AI-assisted class search and booking
- **FAQ**: AI-powered answers to common pilates questions
- **Practice guidance**: Exercise recommendations with video links
- **Progress tracking**: AI-summarized check-in feedback

### 2. Instructor AI Layer
- **Class copilot**: Suggested class structure based on student data
- **Student summaries**: Pre-class briefing with goals, level, feedback
- **Natural-language search**: "Who hasn't attended in 3 weeks?"
- **Planning support**: Exercise library recommendations

### 3. Business AI Layer
- **Capacity insights**: Optimal class scheduling
- **Attendance trends**: Predict no-shows, retention risks
- **Lead conversion**: Score and prioritize website inquiries
- **Revenue analytics**: Package uptake, renewal predictions

## Core AI Interfaces

### AI Assessment Flow
1. Visitor lands on Home Page
2. Trigger AI Assessment modal/CTA
3. Conversational 2-minute assessment (5-7 questions)
4. Based on responses, generate class recommendations
5. Offer booking flow or continue exploration

### Natural Language Booking
1. User types: "I want a reformer class next Wednesday morning"
2. AI parses intent, date, class type, time preference
3. Search available classes matching criteria
4. Present options with AI-generated descriptions
5. Seamless handoff to checkout

### Instructor Copilot
1. Instructor views today's class roster
2. AI provides student summaries (goals, level, last attendance, notes)
3. Suggested class structure warmup/main/cooldown
4. Exercise recommendations from approved library
5. Real-time attendance tracking suggestions

## API Specifications

### Student Assessment API
```
POST /api/ai/assessment
{
  "userId": "uuid",
  "responses": [
    {"questionId": "q1", "answer": "beginner"},
    {"questionId": "q2", "answer": "45", "unit": "minutes"},
    ...
  ]
}
```
Response: `{ "recommendedClasses": [...], "level": "beginner/intermediate/advanced", "focusAreas": [...] }`

### Booking Search API
```
POST /api/ai/booking-search
{
  "query": "reformer class Wednesday morning",
  "userId": "uuid",
  "filters": {"classType": "reformer", "day": "Wednesday", "timeRange": "morning"}
}
```
Response: `{ "classes": [...], "availableSlots": [...] }`

### Instructor Copilot API
```
GET /api/ai/copilot?classId="uuid"
```
Response: `{ "studentSummaries": [...], "suggestedStructure": "...", "exerciseRecommendations": [...] }`

## Component Specifications

### AI Assessment Component (`app/src/components/ai/AssessmentModal.tsx`)
- 2-minute timer
- Conversational question flow
- Progress tracking
- Skip/CTA to book later

### AI Booking Assistant (`app/src/components/ai/BookingAssistant.tsx`)
- Natural language input field
- Class search results with AI descriptions
- Quick book buttons

### Instructor Copilot Panel (`app/src/components/ai/InstructorCopilot.tsx`)
- Student list with summaries
- Class structure builder
- Exercise recommendation chips

## Data Model Enhancements

### AI Interaction Entity (new Prisma model)
```prisma
model AiInteraction {
  id        String    @id @default(uuid())
  userId    String    @relation(onDelete: Cascade)
  type      String    // "assessment" | "booking" | "copilot" | "checkin"
  data      Json      // raw interaction data
  createdAt DateTime  @default(now)
  metadata  Json      // summary, recommendations, etc.
}
```

### Updated Student Profile
- Add `aiAssessmentCompleted: Boolean`
- Add `aiLevel: String` (beginner/intermediate/advanced)
- Add `aiFocusAreas: Json`
- Add `lastAiInteraction: DateTime`

### Updated Booking
- Add `aiAssisted: Boolean`
- Add `aiQuery: String` (original natural language query)
- Add `aiRecommendationSource: String`

## Security & Governance

### AI Safety Measures
1. **Clear AI identification**: All AI-generated content clearly labeled
2. **No medical diagnosis**: Disclaimers on AI guidance
3. **Instructor override**: Always allow instructors to modify AI recommendations
4. **Approved exercise library only**: AI cannot introduce new exercises
5. **Data privacy**: Role-based access to AI interaction data
6. **Audit trail**: Log important AI actions for review

### Governance Checklist
- [ ] AI content labeled as "AI-generated"
- [ ] Medical disclaimer visible
- [ ] Instructor override capability present
- [ ] Exercise library validation in place
- [ ] Role-based access controls verified
- [ ] Audit logging enabled

## MVP Implementation Priority

### Phase 1 (Core AI)
1. AI Assessment flow (assessment → recommendations → booking)
2. Natural language booking search
3. Basic student level classification
4. AI FAQ component

### Phase 2 (Intelligence)
1. Instructor copilot (student summaries)
2. Natural language search ("who hasn't attended...")
3. Post-class check-in AI summarization
4. Practice exercise recommendations

### Phase 3 (Advanced AI)
1. Retention prediction
2. Personalized engagement triggers
3. Voice booking integration
4. Advanced analytics reports

## Test Cases

### AI Assessment Tests
1. **Assessment completion**: User can complete 5-7 question assessment
2. **Level classification**: Correct level assignment based on responses
3. **Recommendation accuracy**: Recommended classes match user level
4. **Timer functionality**: 2-minute timer works correctly
5. **Skip functionality**: User can skip assessment and book later

### Natural Language Booking Tests
1. **Query parsing**: "reformer class Wednesday" → correct classType, day
2. **Time recognition**: "morning", "afternoon", "evening" → time range mapping
3. **No results handling**: Query with no matching classes → empty state
4. **Multiple intent handling**: "I want a class and also info on prices"
5. **Booking flow**: From AI search to checkout completion

### Instructor Copilot Tests
1. **Student summary display**: Correct goals, level, last attendance shown
2. **Structure suggestions**: Appropriate warmup/main/cooldown suggestions
3. **Exercise recommendations**: Only approved library exercises shown
4. **Override capability**: Instructor can modify/delete AI suggestions
5. **Data freshness**: Updates reflect latest student data

### AI Safety Tests
1. **AI labeling**: All AI content marked as AI-generated
2. **Disclaimer visibility**: Medical disclaimer shown where applicable
3. **Override functionality**: Instructor can override any AI recommendation
4. **Exercise validation**: No exercises outside approved library
5. **Role-based access**: Students cannot access instructor-only AI features

## Bug Fix Guidelines

### AI-Related Bugs
1. **Classification errors**: Wrong level assignment → review question-answer mapping
2. **Recommendation mismatches**: Classes not matching user level → fix filtering logic
3. **Search parsing failures**: Natural language not understood → expand intent patterns
4. **Timer issues**: Timer not stopping/starting → check state management
5. **API response errors**: Missing fields → update types and interfaces

### General Bug Fix Process
1. Reproduce bug with test case
2. Identify root cause in codebase
3. Fix implementation
4. Add/updated test case
5. Run existing test suite
6. Deploy to staging, verify fix
7. Document in bug tracker

## Project Team Formation

### Team Leads
- **AI/ML Lead**: Oversees AI architecture, model selection, safety governance
- **Full-Stack Lead**: Coordinates frontend/backend implementation
- **QA Lead**: Defines test strategy, oversees test case development
- **Product Lead**: Prioritizes features, ensures product alignment

### Development Team
1. **Senior React Developer** - AI components, assessment flow, booking assistant
2. **Senior Next.js Developer** - API routes, AI integration, authentication
3. **Prisma/Supabase Specialist** - Data model enhancements, AI interaction schema
4. **QA Engineer** - Test case development, test automation
5. **DevOps Engineer** - Staging/deployment pipelines, environment configuration

### Handover Checklist
- [x] Development specs saved to `D:\Nakuls folder\My Projects\Small Pilates Studio App\Spec document for enhancements\AI_Development_Spec.md`
- [ ] Specification document reviewed with team
- [ ] Project board set up with prioritized features
- [ ] Development environment configured
- [ ] Test framework initialized
- [ ] CI/CD pipeline ready
- [ ] Security review scheduled

## Success Metrics

### Student-facing
- Assessment completion rate: > 60% of new visitors
- Booking conversion from assessment: > 25%
- Student satisfaction with recommendations: > 80%

### Instructor-facing
- Copilot adoption rate: > 70% of instructors use weekly
- Time saved on administration: > 5 hours/week per instructor
- Student summary accuracy: > 90% instructor approval

### Business-facing
- Lead conversion improvement: > 15% increase
- Class fill rate: > 80% average occupancy
- Retention improvement: > 10% month-over-month

---
*Document generated from: Pilates_with_Neelam_AI_Website_Product_Specification.docx*
*Last updated: 2026-08-20*