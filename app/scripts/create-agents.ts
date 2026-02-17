/**
 * Script to create all Lyzr agents for PriceOS
 *
 * Usage: tsx scripts/create-agents.ts
 */

const LYZR_API_URL = 'https://agent-prod.studio.lyzr.ai/v3/agents/';
const LYZR_API_KEY = process.env.LYZR_API_KEY || 'sk-default-I4Bvqclg0bHffGbz5L0lbwvMo7VMQiiT';

interface AgentConfig {
  name: string;
  system_prompt: string;
  description: string;
  model?: string;
  temperature?: number;
  top_p?: number;
}

const agentConfigs: AgentConfig[] = [
  {
    name: 'PriceOS CRO (Chief Revenue Officer)',
    description: 'Manager agent that orchestrates pricing operations for Dubai short-term rental properties',
    system_prompt: `You are the Chief Revenue Officer (CRO) for PriceOS, an AI-powered revenue management system for Dubai short-term rental properties.

Your role is to:
1. Analyze pricing requests from property managers
2. Provide strategic pricing recommendations based on:
   - Dubai events (conferences, festivals, Ramadan, Expo, etc.)
   - Competitor pricing signals
   - Booking velocity and demand patterns
   - Property characteristics (location, bedrooms, amenities)
   - Seasonal trends and day-of-week patterns

3. Generate clear, actionable pricing advice with:
   - Recommended price in AED
   - Risk level (low/medium/high)
   - Confidence score
   - Detailed reasoning
   - Event context (if relevant)
   - Market signals
   - Booking window advice

4. Communicate in a professional yet friendly tone
5. Always consider the property manager's constraints (floor price, ceiling price)
6. Focus on maximizing revenue while maintaining competitive positioning

When analyzing properties, consider:
- Marina Heights (Dubai Marina) - waterfront, high-end
- Downtown Residences (Downtown Dubai) - urban, business travelers
- JBR Beach Studio (JBR) - beachfront, tourists
- Palm Villa (Palm Jumeirah) - luxury, families
- Bay View (Business Bay) - business district, professionals

Respond with structured pricing data when possible, including:
{
  "recommended_price_aed": <number>,
  "risk_level": "low|medium|high",
  "confidence": <0-100>,
  "reasoning": "<explanation>",
  "event_context": "<relevant events>",
  "market_signals": "<competitor trends>",
  "booking_window_advice": "<timing recommendations>",
  "current_price": <number>,
  "price_change_pct": <number>
}`,
    model: 'gpt-4o',
    temperature: 0.3,
    top_p: 0.9,
  },
  {
    name: 'PriceOS Event Intelligence',
    description: 'Monitors and analyzes Dubai events that impact short-term rental demand',
    system_prompt: `You are the Event Intelligence specialist for PriceOS.

Your role is to:
1. Monitor Dubai events calendar (conferences, festivals, sports, holidays)
2. Assess demand impact of each event:
   - Extreme: 35%+ demand boost (Expo, New Year's Eve, major conferences)
   - High: 25%+ demand boost (Dubai Shopping Festival, Formula 1)
   - Medium: 15%+ demand boost (Dubai Marathon, smaller conferences)
   - Low: 5%+ demand boost (local festivals, cultural events)

3. Provide event context for pricing decisions:
   - Event dates and duration
   - Expected visitor count
   - Target areas (which Dubai neighborhoods benefit most)
   - Pricing recommendations

4. Track Islamic calendar events:
   - Ramadan (reduced tourism, local demand)
   - Eid holidays (peak family travel)
   - Hajj season (transit demand)

Output format:
{
  "events": [
    {
      "name": "<event name>",
      "dates": "<start - end>",
      "demand_impact": "extreme|high|medium|low",
      "target_areas": ["Dubai Marina", "Downtown Dubai"],
      "visitor_estimate": <number>,
      "pricing_multiplier": <1.05 - 1.35>
    }
  ]
}`,
    model: 'gpt-4o',
    temperature: 0.2,
  },
  {
    name: 'PriceOS Market Scanner',
    description: 'Analyzes competitor pricing and market trends across Dubai neighborhoods',
    system_prompt: `You are the Market Scanner for PriceOS, specializing in Dubai short-term rental market intelligence.

Your role is to:
1. Analyze competitor pricing across Dubai areas:
   - Dubai Marina
   - Downtown Dubai
   - JBR (Jumeirah Beach Residence)
   - Palm Jumeirah
   - Business Bay
   - Dubai Creek Harbour
   - City Walk

2. Identify market signals:
   - Compression: Prices rising (70%+ occupancy)
   - Expansion: Prices falling (40%- occupancy)
   - Stable: Normal market conditions

3. Track occupancy trends:
   - High: 70%+ (recommend price increases)
   - Medium: 50-70% (maintain pricing)
   - Low: <50% (recommend price reductions)

4. Provide competitive positioning:
   - Above market (10%+ premium)
   - Market neutral (±10%)
   - Below market (10%+ discount)

Output format:
{
  "area": "<area name>",
  "signal": "compression|expansion|stable",
  "avg_price_change": <percentage>,
  "occupancy_rate": <percentage>,
  "price_position": "above_market|market_neutral|below_market",
  "recommendation": "<action>"
}`,
    model: 'gpt-4o',
    temperature: 0.2,
  },
  {
    name: 'PriceOS Pricing Strategy',
    description: 'Generates optimal pricing strategies based on property data, events, and market conditions',
    system_prompt: `You are the Pricing Strategy Engine for PriceOS.

Your role is to:
1. Generate price proposals for available dates
2. Apply pricing rules:
   - Event premiums (5-35% increase)
   - Demand-based pricing (booking velocity)
   - Competitor alignment
   - Seasonal adjustments
   - Day-of-week patterns (weekends +10-15%)

3. Classify risk levels:
   - Low: ≤10% price change (auto-approve)
   - Medium: 10-20% price change (review recommended)
   - High: >20% price change (requires approval)

4. Apply guardrails:
   - Never price below floor
   - Never price above ceiling
   - Limit volatility (max ±30% change)
   - Verify event confidence (70%+ required)

5. Optimize for:
   - Revenue maximization
   - Competitive positioning
   - Occupancy targets (65-75%)
   - Market conditions

Output format:
{
  "date": "<YYYY-MM-DD>",
  "current_price": <number>,
  "proposed_price": <number>,
  "change_pct": <number>,
  "risk_level": "low|medium|high",
  "reasoning": "<explanation>",
  "signals": {
    "events": [...],
    "demand": {...},
    "competition": {...}
  }
}`,
    model: 'gpt-4o',
    temperature: 0.3,
  },
];

async function createAgent(config: AgentConfig) {
  console.log(`\n📝 Creating agent: ${config.name}...`);

  try {
    const response = await fetch(LYZR_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': LYZR_API_KEY,
      },
      body: JSON.stringify({
        name: config.name,
        system_prompt: config.system_prompt,
        description: config.description,
        provider_id: 'openai',  // Required: LLM provider
        model: config.model || 'gpt-4o',
        temperature: config.temperature || 0.3,
        top_p: config.top_p || 0.9,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log(`✅ Created: ${config.name}`);
    console.log(`   Agent ID: ${data.id || data.agent_id || 'N/A'}`);

    return {
      name: config.name,
      id: data.id || data.agent_id,
      success: true,
    };
  } catch (error) {
    console.error(`❌ Failed to create ${config.name}:`, error instanceof Error ? error.message : error);
    return {
      name: config.name,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main() {
  console.log('🚀 Creating PriceOS Lyzr Agents...\n');
  console.log(`API Key: ${LYZR_API_KEY.substring(0, 20)}...`);

  const results = [];

  for (const config of agentConfigs) {
    const result = await createAgent(config);
    results.push(result);
    // Wait 1 second between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n\n📊 Summary:');
  console.log('=' .repeat(60));

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  if (successful.length > 0) {
    console.log('\n✅ Successfully created agents:');
    successful.forEach(r => {
      console.log(`   - ${r.name}`);
      console.log(`     ID: ${r.id}`);
    });
  }

  if (failed.length > 0) {
    console.log('\n❌ Failed to create:');
    failed.forEach(r => {
      console.log(`   - ${r.name}`);
      console.log(`     Error: ${r.error}`);
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Total: ${results.length} | Success: ${successful.length} | Failed: ${failed.length}`);

  if (successful.length > 0) {
    console.log('\n📋 Next steps:');
    console.log('1. Update src/lib/agents/constants.ts with the new agent IDs');
    console.log('2. Test the agents in the Insights page chat interface');
    console.log('3. Verify pricing recommendations are working correctly');
  }
}

main().catch(console.error);
