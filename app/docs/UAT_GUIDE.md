# User Acceptance Testing (UAT) Guide

**PriceOS - Price Intelligence Layer**
**Version:** 1.0.0
**Date:** 2026-02-17

---

## Overview

This guide provides step-by-step instructions for testing PriceOS features during User Acceptance Testing (UAT).

**Target User:** Ijas Abdulla (Founder)
**Duration:** ~30 minutes
**Environment:** Development (http://localhost:3000)

---

## Pre-UAT Setup

### 1. Start the Application
```bash
cd app
npm run dev
```

Wait for:
```
✓ Compiled successfully in X.Xs
- Local: http://localhost:3000
```

### 2. Access the Application
Open browser and navigate to: **http://localhost:3000**

### 3. Sign In (Optional)
- Click "Sign In" (if auth is configured)
- Or proceed directly to `/properties` route

---

## Test Scenarios

### Scenario 1: Property Portfolio Overview
**Duration:** ~5 minutes
**Objective:** Verify property list displays with performance metrics

#### Steps:
1. Navigate to `/properties`
2. Observe the properties list

#### Expected Results:
✅ **5 Dubai properties displayed:**
- Marina Heights 1BR (Dubai Marina)
- Downtown Residences 2BR (Downtown Dubai)
- JBR Beach Studio (JBR)
- Palm Villa 3BR (Palm Jumeirah)
- Bay View 1BR (Business Bay)

✅ **Each property card shows:**
- Property name, area, bedrooms, bathrooms
- Current price (AED XXX/night)
- Occupancy % (last 30 days)
- Revenue (AED XXX)
- Average lead time (X days)

✅ **Header displays:**
- "Global Chat" button in top right
- "Manage your portfolio with AI-powered pricing intelligence" subtitle

#### What to Look For:
- ✅ All properties load without errors
- ✅ Metrics display real numbers (not zeros)
- ✅ UI is clean and professional
- ✅ "Analyze" button visible on each property

---

### Scenario 2: Property-Specific Pricing Analysis
**Duration:** ~10 minutes
**Objective:** Test AI-powered pricing proposal generation

#### Steps:
1. Click **"Analyze"** button on "Marina Heights 1BR"
2. Wait for chat interface to load
3. Read the initial greeting message
4. Type: **"Analyze pricing for next week"**
5. Press Enter and wait for response (~2-3 seconds)

#### Expected Results:
✅ **Chat interface displays:**
- Property details in header (name, area, bedrooms, price)
- Initial greeting from AI assistant
- Clear input field at bottom

✅ **After submitting message:**
- User message appears on right (blue background)
- Loading spinner appears briefly
- AI response appears on left with analysis summary

✅ **AI response includes:**
- Number of pricing opportunities found
- Event count detected
- Breakdown by risk level (low/medium/high)
- Instruction to review proposals below

✅ **Proposal cards displayed:**
- Each card shows:
  - Date range (e.g., "Feb 24 - Feb 26, 2026")
  - Risk badge (LOW/MEDIUM/HIGH RISK) with color coding
  - Current price → Proposed price with % change
  - Trend icon (↑ increase or ↓ decrease)
  - Reasoning paragraph explaining the recommendation
  - "Approve & Execute" and "Reject" buttons

#### What to Look For:
- ✅ Proposals make business sense
- ✅ Event reasoning is clear (e.g., "F1 Grand Prix weekend")
- ✅ Price changes are within reasonable range
- ✅ Risk levels match the magnitude of change
- ✅ UI is responsive and easy to understand

#### Additional Queries to Test:
1. "What events are coming up?"
2. "Generate proposals for March"
3. "Show me low-risk opportunities only"

---

### Scenario 3: Proposal Approval & Execution
**Duration:** ~5 minutes
**Objective:** Test proposal execution workflow

#### Steps:
1. In the property chat from Scenario 2
2. Find a **low-risk proposal** (green badge)
3. Click **"Approve & Execute"** button
4. Wait for execution (~1-2 seconds)

#### Expected Results:
✅ **During execution:**
- Loading spinner appears on button
- Both buttons disabled (cannot double-click)

✅ **After execution:**
- Success message appears in chat:
  - "✅ Price updated successfully!"
  - Details: "Price updated from AED XXX to AED YYY for [date range]. Updated Z days (verified)."
- Proposal card may disappear or show "executed" status

✅ **Verification:**
- Database updated (calendar_days table)
- Proposal status changed to "executed"
- No errors in console

#### What to Look For:
- ✅ Execution is fast (<5 seconds)
- ✅ Success message is clear and informative
- ✅ No errors appear
- ✅ Can approve multiple proposals in sequence

#### Test Rejection:
1. Find another proposal
2. Click **"Reject"** button
3. Verify confirmation message appears
4. Verify proposal is not executed

---

### Scenario 4: Global Portfolio Chat - Underperforming Properties
**Duration:** ~5 minutes
**Objective:** Test portfolio-wide analysis

#### Steps:
1. Navigate back to `/properties`
2. Click **"Global Chat"** button in header
3. Wait for global chat interface to load
4. Type: **"Which properties are underperforming?"**
5. Press Enter and wait for response

#### Expected Results:
✅ **Chat interface displays:**
- "Global Portfolio Chat" title
- "Ask questions about your entire portfolio • 5 properties" subtitle
- Initial greeting listing available queries

✅ **AI response includes:**
- Number of underperforming properties found
- List of properties with occupancy < 70%
- For each property:
  - Name and occupancy %
  - Current price per night
  - Actionable suggestion (price adjustment, promotions)

✅ **Metadata display (optional):**
- Property count
- Average occupancy across underperformers

#### What to Look For:
- ✅ Analysis covers all 5 properties
- ✅ Occupancy calculations are accurate
- ✅ Recommendations are actionable
- ✅ Response is fast (<3 seconds)

---

### Scenario 5: Global Portfolio Chat - Revenue Summary
**Duration:** ~5 minutes
**Objective:** Test portfolio-wide revenue aggregation

#### Steps:
1. In the same global chat from Scenario 4
2. Type: **"Show me total revenue this month"**
3. Press Enter and wait for response

#### Expected Results:
✅ **AI response includes:**
- Total revenue (AED XXX) for last 30 days
- Total number of bookings
- Average booking value (AED XXX)
- Number of properties in portfolio

✅ **Metadata display:**
- Property count: 5
- Total revenue: AED XXX

#### What to Look For:
- ✅ Revenue calculations are correct
- ✅ Currency formatted properly (AED 24,750 not 24750.00)
- ✅ Averages calculated correctly
- ✅ Response is comprehensive

#### Additional Queries to Test:
1. "Compare properties by revenue"
2. "Show portfolio performance summary"
3. "Which property has highest occupancy?"

---

## Success Criteria

### ✅ User Experience
- [ ] UI is intuitive and easy to navigate
- [ ] Chat responses feel natural and helpful
- [ ] Proposal cards are easy to understand
- [ ] Approve/reject workflow is clear
- [ ] No confusing error messages

### ✅ Functionality
- [ ] All 5 properties load correctly
- [ ] Chat generates relevant proposals
- [ ] Proposals have clear reasoning
- [ ] Execution completes in <5 seconds
- [ ] Global chat answers questions accurately

### ✅ Performance
- [ ] Page loads in <2 seconds
- [ ] Chat responses in <3 seconds
- [ ] Proposal execution in <5 seconds
- [ ] No lag or freezing

### ✅ Data Quality
- [ ] Property metrics are realistic
- [ ] Event data is up-to-date
- [ ] Price recommendations make sense
- [ ] Risk levels are appropriate
- [ ] Revenue calculations are accurate

---

## Common Issues & Troubleshooting

### Issue 1: Properties Not Loading
**Symptom:** Empty properties list or "No properties found"

**Solution:**
```bash
# Reseed database
cd app
npm run db:seed
```

### Issue 2: Chat Not Responding
**Symptom:** Loading spinner never stops

**Check:**
1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Check Network tab for failed API calls

**Possible Causes:**
- Database connection issue
- API route error
- Missing environment variables

### Issue 3: Execution Fails
**Symptom:** Error message after clicking "Approve & Execute"

**Check:**
1. Browser console for error details
2. Terminal logs for backend errors

**Common Fix:**
- Verify DATABASE_URL is set correctly
- Check proposal exists in database
- Verify listing has valid data

---

## Feedback Collection

### Questions to Ask During UAT

#### User Experience:
1. Does the chat interface feel natural?
2. Are the proposal cards easy to understand?
3. Is the reasoning clear and convincing?
4. Would you trust these recommendations?
5. What additional information would be helpful?

#### Business Logic:
1. Do the price recommendations make sense?
2. Are the risk levels appropriate?
3. Do you agree with the event impact assessments?
4. What events are missing that should be included?
5. What occupancy threshold feels right for "underperforming"?

#### Feature Requests:
1. What additional queries would you want to ask?
2. What other metrics would be valuable?
3. How would you like to bulk-approve proposals?
4. Should there be notification for price changes?
5. What reports would you want to see?

---

## UAT Completion Checklist

### Before UAT Session:
- [ ] Dev server running (`npm run dev`)
- [ ] Database seeded with test data
- [ ] Browser DevTools ready (F12)
- [ ] Screen recording tool ready (optional)
- [ ] Feedback document prepared

### During UAT Session:
- [ ] All 5 test scenarios completed
- [ ] Feedback collected for each scenario
- [ ] Issues documented (if any)
- [ ] Feature requests noted
- [ ] Screenshots captured (if needed)

### After UAT Session:
- [ ] Prioritize feedback items
- [ ] Create GitHub issues for bugs
- [ ] Document feature requests for Phase 6
- [ ] Update roadmap based on feedback
- [ ] Share UAT summary with stakeholders

---

## Next Steps After Successful UAT

1. **Address Critical Feedback**
   - Fix any showstopper bugs
   - Adjust business logic if needed
   - Clarify confusing UI elements

2. **Prepare for Production**
   - Configure production environment variables
   - Set up HostAway API credentials
   - Plan data migration strategy

3. **Schedule Phase 6**
   - HostAway API integration
   - Real authentication implementation
   - User-specific API key management
   - Monitoring and analytics setup

---

## Contact Information

**For UAT Session:**
- **Facilitator:** [Your Name]
- **Date/Time:** [Schedule]
- **Location:** [Remote/In-person]
- **Duration:** 30-45 minutes

**Support:**
- **Technical Issues:** [Contact]
- **Business Questions:** Ijas Abdulla
- **Documentation:** See `/docs` folder

---

**Document Version:** 1.0
**Last Updated:** 2026-02-17
**Status:** Ready for UAT
