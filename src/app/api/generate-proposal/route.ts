import { createHash } from "node:crypto";
import OpenAI from "openai";
import { load } from "cheerio";
import { NextResponse } from "next/server";
import { createActionClient as createSupabaseClient } from "@/lib/supabase/server";

const MODEL = "gpt-4o-mini";
const TEMPERATURE = 0.5;
const MAX_OUTPUT_TOKENS = 400;
const WORD_LIMIT = 200; // kept for reference; no longer used to hard-clamp
const MAX_VOICE_SAMPLES = 3;
const MAX_VOICE_SAMPLE_CHARS = 600;
const MAX_JOB_DESCRIPTION_CHARS = 7000;
const CACHE_TTL_DAYS = 7;
const OPENAI_TIMEOUT_MS = 25000;

const PLAN_LIMITS = {
  free: { rateUser10m: 10, rateIp10m: 20, daily: 30, monthly: 300 },
  pro: { rateUser10m: 60, rateIp10m: 120, daily: 500, monthly: 5000 },
} as const;

type PlanName = keyof typeof PLAN_LIMITS;
type ChatMessage = { role: "system" | "user"; content: string };

type GenerateProposalRequest = {
  job_description?: string;
  voice_samples?: string[];
  two_variations?: boolean;
  job_title?: string;
  job_link?: string;
  stream?: boolean;
};

type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "RATE_LIMITED"
  | "PLAN_QUOTA_EXCEEDED"
  | "UPSTREAM_TIMEOUT"
  | "UPSTREAM_FAILURE"
  | "STORAGE_FAILURE"
  | "CONFIG_ERROR"
  | "INTERNAL_ERROR";

// ─── System message ───────────────────────────────────────────────────────────
const SYSTEM_MESSAGE = `You are a senior freelance copywriter who writes winning proposals for freelancers and agencies. Your proposals consistently get hired because they lead with the client's problem, not the freelancer's credentials, and they feel written by a real human who read the job carefully.

WRITING RULES — follow every rule without exception:

Opening:
- Never start the proposal with the word "I". Lead with the client's situation, goal, or problem.
- Never open with "Dear", "Hello", "Hi", or any salutation.
- The first sentence must be specific to this job — not a generic confidence statement.

Voice and tone:
- Write in active voice. Avoid passive constructions.
- No em dashes. Use commas or short sentences instead.
- No buzzwords: "passionate", "dedicated", "results-driven", "detail-oriented", "synergy", "leverage", "innovative", "guru", "ninja", "rockstar".
- No robotic filler: "I am excited to apply", "I am a perfect fit", "I would love the opportunity", "hardworking", "team player".
- No bullet points or numbered lists in the output. Write in flowing paragraphs.

Content rules:
- Infer the client's top 1-2 unstated priorities from the job description, then address those directly.
- Mention only the skills and tools genuinely relevant to this specific role.
- Include one concrete outcome or implementation signal that builds credibility (a past result, a specific technical approach, or a question that proves you understand the problem).
- Do not mention the platform by name (not "Upwork", "Freelancer.com", "this platform").

Format and length:
- Plain prose only. No headings, no lists, no JSON, no preamble, no labels.
- Target 150-180 words. Hard ceiling: 200 words. Do not truncate mid-sentence — if approaching the limit, wrap up the current thought cleanly.
- End with a single low-friction call to action: a brief question, an offer of a quick call, or a clear next step. One sentence maximum.
- Return only the proposal text. Nothing else.`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function errorResponse(status: number, code: ApiErrorCode, message: string, details?: Record<string, unknown>) {
  return NextResponse.json({ error: { code, message, ...(details ?? {}) } }, { status });
}

function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function cleanText(text: string) {
  return text.replace(/\s+/g, " ").replace(/\n\s*\n/g, "\n").trim();
}

function clampWords(input: string, maxWords: number) {
  const words = input.trim().split(/\s+/);
  if (words.length <= maxWords) return input.trim();
  return `${words.slice(0, maxWords).join(" ").trim()}...`;
}

function hashRequest(input: object) {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

function extractIp(request: Request) {
  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (!xForwardedFor) return "unknown";
  return xForwardedFor.split(",")[0]?.trim() || "unknown";
}

function getUserPlan(user: { user_metadata?: Record<string, unknown>; app_metadata?: Record<string, unknown> }) {
  const rawPlan = String(user.app_metadata?.plan ?? user.user_metadata?.plan ?? "free").toLowerCase();
  if (rawPlan === "pro") return "pro" satisfies PlanName;
  return "free" satisfies PlanName;
}

function extractJobTextFromHtml(html: string) {
  const $ = load(html);
  $("script, style, noscript, svg, nav, footer, header, form").remove();

  const prioritizedSelectors = [
    "main",
    "article",
    "[role='main']",
    ".job-description",
    ".jobDescriptionContent",
    ".description",
    ".posting-description",
    ".jobs-description",
  ];

  let extracted = "";
  for (const selector of prioritizedSelectors) {
    const candidate = $(selector).first().text();
    if (candidate && candidate.trim().length > 200) {
      extracted = candidate;
      break;
    }
  }

  if (!extracted) extracted = $("body").text();
  return cleanText(extracted).slice(0, MAX_JOB_DESCRIPTION_CHARS);
}

async function resolveJobDescription(input: string) {
  if (!isValidUrl(input)) {
    return { source: "text" as const, text: cleanText(input).slice(0, MAX_JOB_DESCRIPTION_CHARS) };
  }

  const response = await fetch(input, {
    headers: {
      "User-Agent": "Mozilla/5.0 ProposalioBot/1.0",
      Accept: "text/html,application/xhtml+xml",
    },
    cache: "no-store",
  });

  if (!response.ok) throw new Error(`Failed to fetch URL (${response.status})`);
  const html = await response.text();
  const extractedText = extractJobTextFromHtml(html);
  if (!extractedText) throw new Error("Could not extract readable job description from URL");
  return { source: "url" as const, text: extractedText };
}

// ─── Prompt builder ───────────────────────────────────────────────────────────
function buildMessages(
  jobDescription: string,
  voiceSamples: string[],
  userProfile?: string,
): ChatMessage[] {
  const parts: string[] = [];

  if (userProfile) {
    parts.push(`FREELANCER PROFILE\n${userProfile}`);
  }

  if (voiceSamples.length > 0) {
    const samplesText = voiceSamples
      .map((sample, i) => `[Sample ${i + 1}]\n${sample}`)
      .join("\n\n");
    parts.push(
      `VOICE AND STYLE REFERENCE\nThe samples below are from proposals this freelancer has written and been hired from. Study them to extract: sentence length patterns, how formal or casual the tone is, how they open paragraphs, and any distinctive phrasing habits. Mirror those stylistic qualities in the proposal you write. Do not copy sentences verbatim.\n\n${samplesText}`,
    );
  }

  parts.push(`JOB DESCRIPTION\n${jobDescription}`);

  return [
    { role: "system", content: SYSTEM_MESSAGE },
    { role: "user", content: parts.join("\n\n---\n\n") },
  ];
}

// ─── Generation ───────────────────────────────────────────────────────────────
async function generateSingleProposal(
  client: OpenAI,
  messages: ChatMessage[],
  signal: AbortSignal,
  variationInstruction?: string,
) {
  const finalMessages: ChatMessage[] = variationInstruction
    ? messages.map((m, i) =>
        i === messages.length - 1
          ? { ...m, content: `${m.content}\n\n${variationInstruction}` }
          : m,
      )
    : messages;

  const response = await client.chat.completions.create(
    {
      model: MODEL,
      messages: finalMessages,
      temperature: TEMPERATURE,
      max_tokens: MAX_OUTPUT_TOKENS,
    },
    { signal },
  );

  return response.choices[0]?.message?.content?.trim() ?? "";
}

function isTableMissingError(error: { code?: string } | null) {
  return error?.code === "42P01";
}

function isOptionalControlTableError(error: { code?: string } | null) {
  if (!error?.code) return false;
  return error.code === "42P01" || error.code === "42501";
}

// ─── Route ────────────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return errorResponse(500, "CONFIG_ERROR", "Missing OPENAI_API_KEY");
    }

    const body = (await request.json()) as GenerateProposalRequest;
    const jobDescriptionInput = body.job_description?.trim();
    const twoVariations = Boolean(body.two_variations);
    const wantsStream = Boolean(body.stream) && !twoVariations;
    const idempotencyKey = request.headers.get("Idempotency-Key")?.trim() ?? null;
    const ipAddress = extractIp(request);

    if (!jobDescriptionInput) {
      return errorResponse(400, "BAD_REQUEST", "job_description is required");
    }

    const voiceSamples = (body.voice_samples ?? [])
      .filter((sample): sample is string => typeof sample === "string")
      .map((sample) => cleanText(sample).slice(0, MAX_VOICE_SAMPLE_CHARS))
      .filter(Boolean)
      .slice(0, MAX_VOICE_SAMPLES);

    let jobDescription = "";
    try {
      const resolved = await resolveJobDescription(jobDescriptionInput);
      jobDescription = resolved.text.slice(0, MAX_JOB_DESCRIPTION_CHARS);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to process job description input";
      return errorResponse(400, "BAD_REQUEST", message);
    }

    const supabase = createSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return errorResponse(401, "UNAUTHORIZED", "Unauthorized");
    }

    // Fetch user profile for prompt personalization
    const { data: prefData } = await supabase
      .from("user_preferences")
      .select("display_name, bio, skills, hourly_rate, experience_years")
      .eq("user_id", user.id)
      .maybeSingle();

    let userProfile: string | undefined;
    if (prefData) {
      const parts: string[] = [];
      if (prefData.display_name) parts.push(`Name: ${prefData.display_name}`);
      if (prefData.bio) parts.push(`Background: ${prefData.bio}`);
      if (prefData.skills) parts.push(`Skills: ${prefData.skills}`);
      if (prefData.hourly_rate) parts.push(`Rate: ${prefData.hourly_rate}`);
      if (typeof prefData.experience_years === "number") parts.push(`Experience: ${prefData.experience_years} years`);
      if (parts.length) userProfile = parts.join("\n");
    }

    const plan = getUserPlan(user);
    const planLimits = PLAN_LIMITS[plan];
    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000).toISOString();
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [{ count: userRateCount, error: userRateError }, { count: ipRateCount, error: ipRateError }] =
      await Promise.all([
        supabase
          .from("api_usage_events")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("endpoint", "generate-proposal")
          .gte("created_at", tenMinutesAgo),
        supabase
          .from("api_usage_events")
          .select("*", { count: "exact", head: true })
          .eq("ip_address", ipAddress)
          .eq("endpoint", "generate-proposal")
          .gte("created_at", tenMinutesAgo),
      ]);

    if (isTableMissingError(userRateError) || isTableMissingError(ipRateError)) {
      return errorResponse(503, "STORAGE_FAILURE", "Missing table: api_usage_events");
    }
    if (userRateError || ipRateError) {
      return errorResponse(503, "STORAGE_FAILURE", "Failed to evaluate rate limits");
    }

    if ((userRateCount ?? 0) >= planLimits.rateUser10m || (ipRateCount ?? 0) >= planLimits.rateIp10m) {
      return errorResponse(429, "RATE_LIMITED", "Rate limit exceeded", {
        limit_user_10m: planLimits.rateUser10m,
        limit_ip_10m: planLimits.rateIp10m,
      });
    }

    const [{ count: dailyCount, error: dailyError }, { count: monthlyCount, error: monthlyError }] = await Promise.all(
      [
        supabase
          .from("proposals")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gte("created_at", dayStart.toISOString()),
        supabase
          .from("proposals")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gte("created_at", monthStart),
      ],
    );

    if (dailyError || monthlyError) {
      return errorResponse(503, "STORAGE_FAILURE", "Failed to evaluate usage caps");
    }

    if ((dailyCount ?? 0) >= planLimits.daily || (monthlyCount ?? 0) >= planLimits.monthly) {
      return errorResponse(402, "PLAN_QUOTA_EXCEEDED", "Daily or monthly usage cap reached", {
        daily_limit: planLimits.daily,
        monthly_limit: planLimits.monthly,
        daily_used: dailyCount ?? 0,
        monthly_used: monthlyCount ?? 0,
      });
    }

    const cacheInput = {
      prompt_version: 4,
      job_description: jobDescription,
      voice_samples: voiceSamples,
      two_variations: twoVariations,
      model: MODEL,
      max_output_tokens: MAX_OUTPUT_TOKENS,
      temperature: TEMPERATURE,
    };
    const requestHash = hashRequest(cacheInput);

    if (idempotencyKey) {
      const { data: idemCache, error: idemError } = await supabase
        .from("ai_request_cache")
        .select("generated_proposal, proposal_id")
        .eq("user_id", user.id)
        .eq("idempotency_key", idempotencyKey)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (idemError && !isOptionalControlTableError(idemError)) {
        return errorResponse(503, "STORAGE_FAILURE", "Failed to check idempotency cache");
      }
      if (!idemError && idemCache) {
        return NextResponse.json({
          generated_proposal: idemCache.generated_proposal,
          proposal_id: idemCache.proposal_id,
          cached: true,
          cache_type: "idempotency",
        });
      }
    }

    const { data: cached, error: cacheError } = await supabase
      .from("ai_request_cache")
      .select("generated_proposal, proposal_id")
      .eq("user_id", user.id)
      .eq("request_hash", requestHash)
      .gt("expires_at", now.toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cacheError && !isOptionalControlTableError(cacheError)) {
      return errorResponse(503, "STORAGE_FAILURE", "Failed to check request cache");
    }
    if (!cacheError && cached) {
      return NextResponse.json({
        generated_proposal: cached.generated_proposal,
        proposal_id: cached.proposal_id,
        cached: true,
        cache_type: "request_hash",
      });
    }

    const { error: usageInsertError } = await supabase.from("api_usage_events").insert({
      user_id: user.id,
      ip_address: ipAddress,
      endpoint: "generate-proposal",
      request_hash: requestHash,
    });

    if (usageInsertError && !isOptionalControlTableError(usageInsertError)) {
      return errorResponse(503, "STORAGE_FAILURE", "Failed to record usage event");
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const messages = buildMessages(jobDescription, voiceSamples, userProfile);
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), OPENAI_TIMEOUT_MS);

    // ── Streaming path (single proposal) ──────────────────────────────────────
    if (wantsStream) {
      let openaiStream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;
      try {
        openaiStream = await client.chat.completions.create(
          {
            model: MODEL,
            messages,
            temperature: TEMPERATURE,
            max_tokens: MAX_OUTPUT_TOKENS,
            stream: true,
          },
          { signal: abortController.signal },
        );
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === "AbortError") {
          return errorResponse(503, "UPSTREAM_TIMEOUT", "Generation timed out. Please retry.");
        }
        return errorResponse(503, "UPSTREAM_FAILURE", "OpenAI request failed");
      }

      const encoder = new TextEncoder();
      let fullText = "";

      const readable = new ReadableStream({
        async start(streamCtrl) {
          try {
            for await (const chunk of openaiStream) {
              const text = chunk.choices[0]?.delta?.content ?? "";
              if (text) {
                fullText += text;
                streamCtrl.enqueue(encoder.encode(text));
              }
            }
          } catch {
            streamCtrl.error(new Error("Stream interrupted"));
            return;
          } finally {
            clearTimeout(timeoutId);
          }

          const finalText = fullText.trim();

          try {
            const { data: savedProposal, error: saveError } = await supabase
              .from("proposals")
              .insert({
                user_id: user.id,
                job_description: jobDescription,
                generated_proposal: finalText,
                job_title: body.job_title?.trim() || null,
                job_link: body.job_link?.trim() || null,
              })
              .select("id")
              .single();

            if (!saveError && savedProposal) {
              const expiresAt = new Date(now.getTime() + CACHE_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
              await supabase.from("ai_request_cache").insert({
                user_id: user.id,
                request_hash: requestHash,
                idempotency_key: idempotencyKey,
                generated_proposal: finalText,
                proposal_id: savedProposal.id,
                expires_at: expiresAt,
              });
              streamCtrl.enqueue(
                encoder.encode(`\n\n[DONE:${JSON.stringify({ proposal_id: savedProposal.id })}]`),
              );
            }
          } catch {
            // Best-effort DB save — don't break the stream
          }

          streamCtrl.close();
        },
      });

      return new Response(readable, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "X-Accel-Buffering": "no",
          "Cache-Control": "no-cache",
        },
      });
    }

    // ── Non-streaming path (two variations or fallback) ───────────────────────
    let generatedProposal = "";
    try {
      if (twoVariations) {
        const [variationA, variationB] = await Promise.all([
          generateSingleProposal(
            client,
            messages,
            abortController.signal,
            "Write in a direct, confident register. Lead immediately with the core value you bring to this specific problem. Tone: professional but not stiff — like an expert who doesn't need to oversell.",
          ),
          generateSingleProposal(
            client,
            messages,
            abortController.signal,
            "Write in a warmer, more conversational register. Acknowledge the client's situation first before pivoting to your approach. Tone: collegial — like a trusted colleague who gets the problem and has done this before.",
          ),
        ]);
        generatedProposal = `Variation A (Direct):\n${variationA}\n\nVariation B (Conversational):\n${variationB}`;
      } else {
        generatedProposal = await generateSingleProposal(client, messages, abortController.signal);
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return errorResponse(503, "UPSTREAM_TIMEOUT", "Generation timed out. Please retry.");
      }
      return errorResponse(503, "UPSTREAM_FAILURE", "OpenAI request failed");
    } finally {
      clearTimeout(timeoutId);
    }

    if (!generatedProposal) {
      return errorResponse(503, "UPSTREAM_FAILURE", "Failed to generate proposal");
    }

    const { data: savedProposal, error: saveError } = await supabase
      .from("proposals")
      .insert({
        user_id: user.id,
        job_description: jobDescription,
        generated_proposal: generatedProposal,
        job_title: body.job_title?.trim() || null,
        job_link: body.job_link?.trim() || null,
      })
      .select("id")
      .single();

    if (saveError) {
      return errorResponse(503, "STORAGE_FAILURE", `Failed to save proposal: ${saveError.message}`);
    }

    const expiresAt = new Date(now.getTime() + CACHE_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const { error: cacheInsertError } = await supabase.from("ai_request_cache").insert({
      user_id: user.id,
      request_hash: requestHash,
      idempotency_key: idempotencyKey,
      generated_proposal: generatedProposal,
      proposal_id: savedProposal.id,
      expires_at: expiresAt,
    });

    if (
      cacheInsertError &&
      !isOptionalControlTableError(cacheInsertError) &&
      cacheInsertError.code !== "23505" &&
      !String(cacheInsertError.message ?? "").toLowerCase().includes("duplicate")
    ) {
      return errorResponse(503, "STORAGE_FAILURE", "Failed to write request cache");
    }

    return NextResponse.json({
      generated_proposal: generatedProposal,
      proposal_id: savedProposal.id,
      cached: false,
      meta: {
        model: MODEL,
        max_output_tokens: MAX_OUTPUT_TOKENS,
        temperature: TEMPERATURE,
        plan,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(500, "INTERNAL_ERROR", message);
  }
}

// Kept but no longer called — model self-regulates length via system message
void clampWords;
void WORD_LIMIT;
