const router = require("express").Router();
const axios = require("axios");
const { geminiModel } = require("../lib/gemini");

// Helper to wait/sleep
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function generateContentWithRetry(model, prompt, maxRetries = 3) {
  let delay = 2000;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      const isRateLimit =
        err.status === 429 ||
        err.message?.includes("429") ||
        err.message?.includes("Quota");

      if (isRateLimit && i < maxRetries - 1) {
        console.warn(
          `Quota hit. Retrying in ${delay / 1000}s... (Attempt ${i + 1})`,
        );
        await sleep(delay);
        delay *= 2;
        continue;
      }
      throw err;
    }
  }
}

const safeStringify = (obj) => {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return "{}";
  }
};
router.post("/agent", async (req, res) => {
  try {
    const { message, range, activeTab, contextType } = req.body || {};
    const baseUrl =
      process.env.NODE_ENV === "production"
        ? "https://learnlab-backend-174bc48b923f.herokuapp.com"
        : process.env.BASE_URL || "http://localhost:5001";
    const authHeader = req.headers.authorization || "";

    let analytics = null;
    let plans = null;
    let subscriptionsSummary = null;

    // Public subscription plans
    if (!contextType || contextType === "admin" || contextType === "plans") {
      const plansRes = await axios.get(`${baseUrl}/api/subscription/plans`);
      plans = plansRes.data?.data || plansRes.data;
    }

    // Admin analytics + admin subscription summary
    if (!contextType || contextType === "admin") {
      try {
        const analyticsRes = await axios.get(`${baseUrl}/api/admin/analytics`, {
          params: range || {},
          headers: authHeader ? { Authorization: authHeader } : {},
        });
        analytics = analyticsRes.data;
      } catch (e) {
        if (
          e.response?.data?.message === "Token expired" ||
          e.response?.status === 401
        ) {
          return res.status(401).json({
            reply:
              "Your session has expired. Please log out and log back in to continue using the AI assistant.",
          });
        }
        analytics = null;
      }

      // admin subscriptions summary route
      try {
        const subsRes = await axios.get(`${baseUrl}/api/subscription/admin`, {
          headers: authHeader ? { Authorization: authHeader } : {},
        });
        subscriptionsSummary = subsRes.data?.data || subsRes.data;
      } catch (e) {
        subscriptionsSummary = null;
      }
    }

    // Build prompt
    const prompt = `
You are an AI copilot for an e-learning platform.

User context type: ${contextType || "admin"}

The user's question is:
"${message}"

=== ACTIVE TAB / RANGE (for admin dashboard use) ===
Active tab: ${activeTab || "overview"}
Date range: ${range?.start || "none"} to ${range?.end || "none"}

=== DATA YOU HAVE ===

--- Admin Analytics (from /api/admin/analytics, may be null) ---
This object may include:
- financialAnalytics: { totalRevenue, collectedCourseRevenue, totalSubscriptionRevenue, otherRevenue, totalCourseRevenueCeiling, instructorShare, platformShare, revenueTrend, refundPercentage, subscriptionRevenueByMonth, subscriptionPopularity, monthlyRevenueCompare, revenueByCategory, ... }
- courseAnalytics: { mostEnrolledCourses, highestRatedCourses, dropOffCourses }
- userAnalytics: { mostActiveLearners }
- engagementAnalytics: { quizStats, difficultQuestions }

JSON:
\`\`\`json
${analytics ? safeStringify(analytics) : "{}"}
\`\`\`


--- Subscription Plans (from /api/subscription/plans, public) ---
Each plan comes from the SubscriptionPlans table with fields like:
- id, name, price, duration_days (or durationDays), description, planType, buttonText, slug, features, discount fields, etc.

JSON:
\`\`\`json
${plans ? safeStringify(plans) : "[]"}
\`\`\`


--- Admin Subscription Summary (from /api/subscription/admin, may be null) ---
This may include aggregated subscription data (active subs, churn, etc.).

JSON:
\`\`\`json
${subscriptionsSummary ? safeStringify(subscriptionsSummary) : "{}"}
\`\`\`


=== HOW TO THINK ABOUT CONTEXT TYPE ===

- If contextType is "plans":
  - Assume you are talking to a guest or student who is browsing subscription plans.
  - Focus on explaining the differences between plans, who each plan is for, pricing, discounts, and what they get.
  - Do NOT mention admin dashboards, internal metrics, or internal subscription summaries even if present.
  - Use friendly, marketing-style language, and help them choose a plan based on likely needs.

- If contextType is "admin":
  - Assume you are talking to an admin looking at the Analytics Intelligence dashboard.
  - Use admin analytics, subscription summary, and plans to explain performance and strategy.
  - Use the tab names: "Overview", "Courses", "Subscriptions".
  - Reference cards by their titles, like:
    - "Rolling 30-Day Revenue (Collected)"
    - "Projected Next 30 Days (Collected)"
    - "Refund Rate (All Time)"
    - "Top Course Volume"
    - "Super Learners (Top Users)"
    - "Total Revenue (Collected)"
    - "Course Revenue (Collected)"
    - "Subscription Revenue (Collected, All-Time)"
    - "Other Revenue (Collected)"
  - Describe where to look, e.g., "In the Subscriptions tab, in the top row of KPI cards...".

- If contextType is missing or unknown:
  - First, infer from the question:
    - If it clearly asks about revenue, trends, hardest quiz, drop-off, or top courses, treat it as admin analytics.
    - If it clearly asks about plan prices, which plan is best, or subscription features, treat it as plans.
  - Answer accordingly as above.

=== ANSWER RULES ===

1) For ANALYTICS questions (revenue, trends, top courses, hardest quizzes, drop-off):
   - Use financialAnalytics, courseAnalytics, userAnalytics, engagementAnalytics when available.
   - Quote concrete values (rounded) and compare where helpful.
   - Explain briefly in 3–6 sentences.
   - Suggest one practical next step the admin can take.

2) For DASHBOARD UI questions (only in admin context):
   - Refer to the tabs: "Overview", "Courses", "Subscriptions".
   - Refer to KPI and chart cards by the titles described above.
   - Describe where to look in the dashboard, but do not invent UI elements that are not implied by the data.

3) For SUBSCRIPTION PLAN questions:
   - Use the plans JSON and, when in admin context, subscriptionPopularity and revenue-related fields from analytics or subscription summary.
   - Explain differences between plans in simple language (price, duration, key features).
   - If talking to a guest/student (contextType="plans"), focus on which plan fits which type of learner and budget.
   - If talking to an admin (contextType="admin"), focus on plan performance and concrete ideas: e.g., raising or lowering price, adjusting discounts, adding perks, or retiring weak plans.

4) If the question is ambiguous:
   - Ask one short clarifying question.
   - Then still give your best interpretation and a helpful answer.

5) STYLE:
   - Answer directly and concisely.
   - Use plain language, no technical jargon.
   - Do NOT output raw JSON or code.
   - Do NOT mention API calls, routes, environment variables, or implementation details.
   - Do NOT mention that you are an AI model; just answer as a helpful assistant.
`;

    // Call Gemini
    const reply = await generateContentWithRetry(geminiModel, prompt);

    res.json({ reply });
  } catch (err) {
    console.error("Gemini agent error:", err?.response?.data || err);
    if (err.status === 429) {
      return res.status(429).json({
        reply:
          "The AI is a bit busy right now (Quota exceeded). Please wait 30 seconds and try again.",
      });
    }

    res.status(500).json({
      reply:
        "Sorry, I couldn't process that request. Please try again in a moment.",
    });
  }
});

module.exports = router;
