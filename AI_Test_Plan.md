# Test Plan & Cases - Pilates with Neelam AI Features

## Test Strategy
- **Unit Tests**: Vitest for individual components and utilities
- **Integration Tests**: API endpoint testing, AI flow integration
- **E2E Tests**: Playwright for complete user journeys
- **Safety Tests**: AI governance and disclaimer verification

## Unit Test Cases

### AI Assessment Component
| Test Case | Description | Expected |
|-----------|-------------|----------|
| T001 | Render assessment modal on mount | Modal visible, timer starts |
| T002 | User selects answer, moves to next question | Progresses to next question, state updated |
| T003 | Timer reaches 2 minutes, auto-submit | Assessment submitted, results shown |
| T004 | User skips assessment, clicks CTA | Assessment dismissed, booking CTA shown |
| T005 | Level classification based on responses | Correct level (beginner/intermediate/advanced) assigned |
| T006 | Recommended classes match user level | Only appropriate level classes displayed |

### Natural Language Booking Assistant
| Test Case | Description | Expected |
|-----------|-------------|----------|
| T010 | Parse "reformer class Wednesday morning" | classType: "reformer", day: "Wednesday", timeRange: "morning" |
| T011 | Parse "mat class Friday evening" | classType: "mat", day: "Friday", timeRange: "evening" |
| T012 | Parse "any class next week" | No specific filters, broad search |
| T013 | No matching classes found | Empty results state displayed, suggestions offered |
| T014 | Multiple intent query handled | Both class search and FAQ answered |
| T015 | Booking from AI search to checkout | Seamless handoff, all details preserved |

### Instructor Copilot Component
| Test Case | Description | Expected |
|-----------|-------------|----------|
| T020 | Copilot renders with classId prop | Student summaries loaded, structure suggested |
| T021 | Student summary shows goals, level, last attendance | All three fields populated correctly |
| T022 | Exercise recommendations from approved library only | No exercises outside allowed list |
| T023 | Instructor can override/delete AI suggestion | Modifications saved, AI suggestion dismissed |
| T024 | Updates reflect latest student data | Real-time or refresh-triggered data update |

### AI Safety Tests
| Test Case | Description | Expected |
|-----------|-------------|----------|
| T030 | AI-generated content labeled as "AI-generated" | Label visible next to all AI output |
| T031 | Medical disclaimer shown on relevant pages | Disclaimer present where AI gives health/body advice |
| T032 | Instructor can override any AI recommendation | Override button available and functional |
| T033 | Exercise library validation enforced | Only approved exercises can be recommended |
| T034 | Role-based access prevents student access to instructor AI | Student UI hides/inhibits instructor-only AI features |

## Integration Test Cases

### AI Assessment → Booking Flow
| Test Case | Description | Expected |
|-----------|-------------|----------|
| T100 | Complete assessment → receive recommendations | 5-7 questions, then recommendations shown |
| T101 | Select recommended class → proceed to booking | All class details pre-populated |
| T102 | Assessment without booking → return later | Progress saved, can resume assessment |

### Booking Search → Checkout Flow
| Test Case | Description | Expected |
|-----------|-------------|----------|
| T110 | AI search result → click book → checkout page | All details (class, date, time, instructor) carried forward |
| T111 | Modify query after initial search | New search replaces previous results |
| T112 | Payment integration with AI-assisted booking | Payment methods work as expected |

## E2E Test Cases (Playwright)

### New Student Journey
| Test Case | Description | Expected |
|-----------|-------------|----------|
| T200 | Visitor lands on home page → sees AI assessment CTA | CTA visible, clickable |
| T201 | User completes assessment → gets class recommendations | Recommendations match assessment level |
| T202 | User books recommended class → checkout completed | Booking confirmed, email/SMS sent |
| T203 | User books class → appears in My Classes dashboard | Class visible in dashboard immediately |

### Instructor Journey
| Test Case | Description | Expected |
|-----------|-------------|----------|
| T210 | Instructor logs in → sees Today's Classes | Class roster with student summaries |
| T211 | Copilot panel shows student goals and level | All summaries accurate |
| T212 | Instructor modifies AI suggestion → change saved | Modification persisted, reflected in class view |

### AI Safety Verification
| Test Case | Description | Expected |
|-----------|-------------|----------|
| T220 | All AI content has "AI-generated" label | Page scan finds label on all AI output |
| T221 | Medical disclaimer present where needed | Disclaimer visible on relevant components |
| T222 | Role checks prevent unauthorized AI access | Student cannot access instructor copilot |

## Bug Fix Verification

### Sample Bug Fix Workflow
1. **Bug identified**: e.g., AI assessment timer not stopping
2. **Test case created**: T003 modified to verify timer behavior
3. **Root cause found**: State management issue in assessment component
4. **Fix applied**: Corrected useEffect dependencies, timer cleanup
5. **Test passes**: T003 now passes consistently
6. **Regression test**: Run full assessment flow, all tests pass
7. **Documentation**: Bug noted in changelog, test case added to suite

### Common AI Bugs & Fixes
| Bug | Root Cause | Fix |
|-----|-----------|-----|
| Wrong level classification | Question-answer mapping incorrect | Review and fix mapping logic in assessment service |
| Booking search not parsing "evening" | Missing time range mapping | Add "evening" → 18:00-21:00 mapping |
| Copilot not showing latest data | Stale data from useEffect | Add proper dependency array, implement refetch |
| AI label missing in production | Build process stripping labels | Ensure labels are part of component markup, not dev-only |
| Exercise outside library | Validation missing in recommendation alg | Add library filter, validate before returning results |

## Test Environment Setup

### Prerequisites
- Node.js 20+ 
- Playwright installed: `npm install -D @playwright/test`
- Vitest installed: `npm install -D vitest @vitejs/plugin-react`

### Run Tests
```bash
# Unit tests
npm test              # Vitest unit tests
npm test:watch        # Watch mode

# E2E tests
npx playwright test   # Run all E2E tests
npx playwright test --spec="tests/ai-assessment.spec.ts"  # Specific test

# Type check
npm run typecheck
```

### Test Data fixtures
- Assessment responses JSON fixtures in `tests/fixtures/assessment/`
- Booking search query patterns in `tests/fixtures/booking/`
- Student data mockups in `tests/fixtures/students/`

---
*Test plan derived from Pilates_with_Neelam_AI_Website_Product_Specification.docx*
*Last updated: 2026-08-20*