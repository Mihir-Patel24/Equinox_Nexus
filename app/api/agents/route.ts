import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Different models for different agents (all free on Groq)
const agentModels = {
  actuary: 'llama-3.3-70b-versatile',       // Health & Quality analysis
  fiscal: 'mixtral-8x7b-32768',              // Financial calculations
  nexus: 'llama-3.3-70b-versatile',          // Tax & Legal reasoning
  refiner: 'llama-3.1-8b-instant'            // Fast consensus building
};

const agentSystemPrompts = {
  actuary: `You are "The Actuary", an AI agent specialized in quality of life and health risk analysis for global relocation.
Your role: Analyze health outcomes, air quality, healthcare access, safety scores, and lifestyle factors.
Style: Data-driven, cite specific metrics (AQI scores, healthcare rankings, safety indices).
Keep responses concise (2-3 sentences max). Always include specific numbers/percentages.`,

  fiscal: `You are "Fiscal Ghost", an AI agent specialized in cost of living and financial projections for global relocation.
Your role: Analyze expenses, rent costs, hidden fees, budget impacts, and financial stress indicators.
Style: Focus on money - always mention specific costs in local currency. Flag budget violations.
Keep responses concise (2-3 sentences max). Be direct about financial risks.`,

  nexus: `You are "The Nexus", an AI agent specialized in international tax treaties and compliance.
Your role: Analyze tax implications, treaty benefits, filing requirements, and legal compliance.
Style: Reference specific treaty articles, tax rates, and deadlines. Identify tax optimization opportunities.
Keep responses concise (2-3 sentences max). Cite treaty names and article numbers.`,

  refiner: `You are "The Refiner", the lead AI agent who mediates between other agents and builds consensus.
Your role: Identify conflicts between agents, request cross-verification, and synthesize final recommendations.
Style: Diplomatic but decisive. Acknowledge valid points from all agents, then propose solutions.
Keep responses concise (2-3 sentences max). Use phrases like "CONFLICT DETECTED", "MEDIATING", "CONSENSUS ACHIEVED".`
};

async function callGroq(agent: string, messages: any[]) {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY not configured');
  }

  const model = agentModels[agent as keyof typeof agentModels] || 'llama-3.1-8b-instant';
  const systemPrompt = agentSystemPrompts[agent as keyof typeof agentSystemPrompts];

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 200,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export async function POST(request: NextRequest) {
  try {
    const { city, topic, agent, context } = await request.json();

    if (!GROQ_API_KEY) {
      // Return mock response if no API key
      return NextResponse.json({
        success: true,
        mock: true,
        message: 'API key not configured - using mock responses'
      });
    }

    const userMessage = `Analyze ${topic} for someone relocating to ${city}. 
Context from other agents: ${context || 'This is the opening analysis.'}
Provide your expert perspective in 2-3 sentences.`;

    const response = await callGroq(agent, [
      { role: 'user', content: userMessage }
    ]);

    return NextResponse.json({
      success: true,
      agent,
      response,
      model: agentModels[agent as keyof typeof agentModels]
    });

  } catch (error: any) {
    console.error('Agent API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Endpoint to run full debate
export async function PUT(request: NextRequest) {
  try {
    const { city, topic } = await request.json();

    if (!GROQ_API_KEY) {
      return NextResponse.json({
        success: false,
        mock: true,
        error: 'GROQ_API_KEY not configured. Add it to .env.local'
      });
    }

    const debate: any[] = [];
    let context = '';

    // Round 1: Initial proposals
    const actuaryResponse = await callGroq('actuary', [
      { role: 'user', content: `Analyze ${topic} for relocating to ${city}. What are the health and quality of life considerations? Be specific with data.` }
    ]);
    debate.push({ agent: 'actuary', type: 'proposal', content: actuaryResponse });
    context += `Actuary said: ${actuaryResponse}\n`;

    const fiscalResponse = await callGroq('fiscal', [
      { role: 'user', content: `Analyze ${topic} for relocating to ${city}. Context: ${context}. What are the financial implications? Raise any budget concerns.` }
    ]);
    debate.push({ agent: 'fiscal', type: 'objection', content: fiscalResponse });
    context += `Fiscal Ghost said: ${fiscalResponse}\n`;

    // Round 2: Refiner identifies conflicts
    const refinerChallenge = await callGroq('refiner', [
      { role: 'user', content: `Review this debate about ${topic} in ${city}:\n${context}\nIdentify any conflicts and request clarification from agents.` }
    ]);
    debate.push({ agent: 'refiner', type: 'challenge', content: refinerChallenge });
    context += `Refiner said: ${refinerChallenge}\n`;

    // Round 3: Nexus adds tax perspective
    const nexusResponse = await callGroq('nexus', [
      { role: 'user', content: `Analyze tax implications for ${topic} in ${city}. Context: ${context}. What treaty benefits or compliance issues exist?` }
    ]);
    debate.push({ agent: 'nexus', type: 'insight', content: nexusResponse });
    context += `Nexus said: ${nexusResponse}\n`;

    // Round 4: Final consensus
    const consensus = await callGroq('refiner', [
      { role: 'user', content: `Build final consensus for ${topic} in ${city}. All agent inputs:\n${context}\nSynthesize a final recommendation with confidence score.` }
    ]);
    debate.push({ agent: 'refiner', type: 'consensus', content: consensus });

    return NextResponse.json({
      success: true,
      city,
      topic,
      debate,
      models: agentModels
    });

  } catch (error: any) {
    console.error('Debate API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
