import { NextRequest, NextResponse } from "next/server";
import { cleanDescription } from "@/lib/clean-description";

type RemotiveJob = {
  id: number;
  url: string;
  title: string;
  company_name: string;
  description: string;
  publication_date: string;
};

type RemotiveResponse = {
  jobs: RemotiveJob[];
};

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query")?.trim();

  if (!query) {
    return NextResponse.json({ error: "query parameter is required" }, { status: 400 });
  }

  const url = new URL("https://remotive.com/api/remote-jobs");
  url.searchParams.set("search", query);
  url.searchParams.set("limit", "20");

  let jobs: RemotiveJob[];
  try {
    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(12000),
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Job source returned ${response.status}. Please try again.` },
        { status: 502 },
      );
    }

    const data = (await response.json()) as RemotiveResponse;
    jobs = data.jobs ?? [];
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const isTimeout = error instanceof Error && error.name === "TimeoutError";
    return NextResponse.json(
      { error: isTimeout ? "Job search timed out. Please try again." : `Failed to fetch jobs: ${message}` },
      { status: 502 },
    );
  }

  const result = jobs.map((job) => ({
    title: job.title,
    link: job.url,
    description: cleanDescription(job.description),
    date: job.publication_date,
  }));

  return NextResponse.json(result);
}
