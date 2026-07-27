import OpenAI from 'openai';

let openai: OpenAI;
function getOpenAI() {
  if (!openai) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  // Truncate to reasonable length to avoid token limits just in case, though 3-small handles 8k tokens
  const cleanText = text.replace(/\s+/g, ' ').trim().substring(0, 30000); 

  if (!cleanText) {
    // Return a zero vector or throw? Let's return zero vector to be safe
    return Array(1536).fill(0);
  }

  const response = await getOpenAI().embeddings.create({
    model: 'text-embedding-3-small',
    input: cleanText,
    dimensions: 1536,
  });

  return response.data[0].embedding;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const cleanTexts = texts.map(t => t.replace(/\s+/g, ' ').trim().substring(0, 8000));
  
  if (cleanTexts.length === 0) return [];

  // OpenAI accepts max 2048 inputs per request.
  const response = await getOpenAI().embeddings.create({
    model: 'text-embedding-3-small',
    input: cleanTexts,
    dimensions: 1536,
  });

  return response.data.map(d => d.embedding);
}

export async function insertJobsWithEmbeddings(db: any, jobsSchema: any, jobsData: any[]) {
  if (jobsData.length === 0) return [];

  // Batch embed all jobs
  const textsToEmbed = jobsData.map(j => `${j.title} ${j.description}`.substring(0, 8000));
  
  // Handle OpenAI batch limits by chunking if > 100
  const embeddings: number[][] = [];
  const chunkSize = 100;
  for (let i = 0; i < textsToEmbed.length; i += chunkSize) {
    const chunk = textsToEmbed.slice(i, i + chunkSize);
    const chunkEmbeddings = await generateEmbeddings(chunk);
    embeddings.push(...chunkEmbeddings);
  }

  const jobsToInsert = jobsData.map((jobData, index) => ({
    ...jobData,
    embedding: embeddings[index],
  }));

  return db
    .insert(jobsSchema)
    .values(jobsToInsert)
    .onConflictDoNothing({ target: jobsSchema.externalId })
    .returning({ id: jobsSchema.id });
}
