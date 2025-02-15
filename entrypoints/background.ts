import { ScoreData, onMessage } from '../lib/messaging';
import { safetyScoreContract } from '../lib/contract_setup';

interface BetDetails {
  uuid?: number;
  name: string;
  rules: string;
  user_msg?: string;
}

interface ChatGPTResponse {
  choices: {
    message?: {
      content: string;
    };
  }[];
}


async function getApiKey(): Promise<string> {
  const result = await chrome.storage.local.get(['apiKey'])
  if (result.apiKey) {
    return atob(result.apiKey)
  }
  throw new Error('API key not found')
}

async function makeGPTRequest(
  betDetails: BetDetails,
  timeout = 30000
): Promise<string> {
  try {
    const apiKey = await getApiKey();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const systemPrompt = {
      role: 'system',
      content: `You are a friendly market expert who's deeply knowledgeable about ${getBetCategory(betDetails.name)}. You particularly understand ${betDetails.name} and enjoy discussing all aspects of this topic, from technical details to broader market dynamics.

For context, this is about a Polymarket bet:
${betDetails.name}

Resolution details:
${betDetails.rules}

Your style:
- Dont include any  ** format in the messages
- Keep responses short and simple - aim for 2-3 key points
- Use plain language, like explaining to a friend
- Focus on what's most relevant right now
- Break down complex topics into simple terms
- Share quick insights about what's happening in the market
- When explaining rules, stick to the essential points
- If asked, happy to expand on specific areas of interest

Think of yourself as a helpful expert who wants to have an interesting discussion about this topic while making sure people understand the key details.`
    };

    let usermsg = betDetails.user_msg
    if (usermsg) {
      usermsg = `
    [FORMAT YOUR RESPONSE AS FOLLOWS]
    ${usermsg}

    Summary Title
    - 🎯 Key Point: Clear and concise explanation
    - 💡 Insight: Brief actionable insight 
    - ⚠️ Watch out: Important consideration or warning if applicable
    - 🔄 Next Steps: Suggested action or follow-up if needed

    RULES:
    1. Each point MUST start with a relevant emoji + label
    2. Keep each point to 1-2 sentences maximum
    3. Only include relevant points (don't force all categories)
    4. Title should be brief and contextual
    5. Maximum 4-5 points total
    6. Use consistent punctuation after labels (:)
    7. No sub-bullets or nested points
    8. Keep formatting exactly as shown above

    Example good response:

    User Question Analysis
    - 🎯 Core Issue: Database queries are inefficient and unoptimized
    - 💡 Solution: Implement index on frequently searched columns
    - ⚠️ Caution: Index creation may temporarily impact write performance
    - 🔄 Action: Run EXPLAIN ANALYZE to identify worst performing queries

    BAD (don't do this):
    - Too many points
    - Missing emojis
    - Inconsistent formatting
    - Multi-paragraph explanations
    - Nested sub-points
    `;
    }

    const userMessage = {
      role: 'user',
      content: usermsg || `Follow this exact style keep it short and straight forward, 1 context related emoji next to each keypoint, dont change ANYTHING just fill the [...]: 
      ${betDetails.name}
      
    - Market Condition: [specific condition]
    - Timeline: [deadline]
    - Status: [status + more useful insights]
    - Probability: [probability]
    - Critical factors: [key factors]
`
    };


    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'o1-mini',
        messages: [
          {
            "role": "user", "content": [{ "type": "text", "text": [systemPrompt.content, userMessage.content].join("\n") }],
            // temperature: 0.4,
            // max_tokens: 1000,
            // presence_penalty: -0.2,
            // frequency_penalty: 0.3
          }]
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json() as ChatGPTResponse;
    console.log({ data })

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from API');
    }

    console.log(data.choices[0].message.content)

    return data.choices[0].message.content;
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      console.error('Error making GPT request:', error.message);
      throw error;
    } else {
      console.error('Unknown error making GPT request:', error);
      throw new Error('An unknown error occurred');
    }
  }
}

function getBetCategory(betName: string): string {
  const categories = {
    politics: ['election', 'president', 'trump', 'biden', 'congress', 'senate', 'governor'],
    crypto: ['bitcoin', 'ethereum', 'crypto', 'blockchain', 'token', 'defi'],
    technology: ['ai', 'artificial intelligence', 'tech', 'software', 'hardware'],
    finance: ['market', 'stock', 'economy', 'fed', 'interest rate'],
  };

  const lowercaseName = betName.toLowerCase();
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => lowercaseName.includes(keyword))) {
      return category;
    }
  }

  return 'general market analysis';
}

async function GPT_get_safety_score(
  betDetails: BetDetails,
  timeout = 30000
): Promise<ScoreData> {
  try {
    const betId = BigInt(betDetails.uuid as number);

    try {
      const existingScore = await safetyScoreContract.readScore(betId);
      if (existingScore > 0n) {
        return { score: Number(existingScore), from_blockchain: true };
      }
    } catch (contractError) {
      console.error('Error reading from contract:', contractError);
    }

    const apiKey = await getApiKey();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const systemPrompt = `You are a betting market rules safety scorer. Analyze the rules and return a safety score (0-100%).
        KEY SCORING CRITERIA:
        1. Source Quality (50%):
           * Official source type (pick highest that applies):
              * Government/institutional sources (50%)
              * Official company announcements (40%)
              * Verified public figure's own announcements (35%)
              * Consensus of credible reporting (30%)
        
        Outcome Clarity (50%):
        Clear deadline with timezone? (20%)
        Deterministic outcome criteria? (20%)
        Edge cases covered? (10%)
        AUTOMATIC PASS (85%+ score) if:
        3. Uses official sources (government/company/verified figures) for their OWN actions/announcements
        4. Has deterministic outcome criteria
        5. Multiple verification sources available
        AUTOMATIC FAIL (0% score) if:
        6. Relies on unverified wallet ownership
        7. Relies on private/unverifiable information
        8. Single point of failure for verification
        IMPORTANT DISTINCTIONS:
        9. Verified public figures announcing their OWN actions = GOOD SOURCE
        10. Unverified wallets as source = BAD
        11. Verified company wallets as source = GOOD
        Examples: GOOD (85-100%):
        12. Government election results
        13. Senate votes
        14. Official statistics
        15. Company SEC filings
        16. Verified public figure announcements (with consensus verification)
        MEDIUM (50-84%):
        17. Public figure actions verified by consensus reporting
        18. Unofficial but widely tracked metrics
        19. Events with multiple verification sources
        BAD (0-49%):
        20. Unverified wallet activities
        21. Private individual actions without verification
        22. Single-source markets without backup verification
        Output format: Return ONLY a percentage number (0-100).]

        Analyze the safety of these betting rules: ${betDetails.rules}
    `

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { "role": "user", "content": [{ "type": "text", "text": systemPrompt }] }
          // {
          //   role: 'user',
          //   content: `Analyze the safety of these betting rules: ${betDetails.rules}`
          // }
        ],
        // temperature: 0.1,
        // max_tokens: 150,
        // presence_penalty: -0.5,
        // frequency_penalty: 0.3
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API request failed with status ${await response.text()}`);
    }

    const data = await response.json() as ChatGPTResponse;
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from API');
    }

    const score = parseInt(data.choices[0].message.content.replace('%', ''));

    try {
      const tx = await safetyScoreContract.setScore(betId, score);
      await tx.wait();
    } catch (contractError) {
      console.error('Error saving to contract:', contractError);
    }

    return { score: Number(score), from_blockchain: false };

  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      console.error('Error making GPT request:', error.message);
      throw error;
    } else {
      console.error('Unknown error making GPT request:', error);
      throw new Error('An unknown error occurred');
    }
  }
}

export default defineBackground(() => {
})

onMessage('talk_to_ai', async (message) => {
  try {
    const data = message.data;
    const gptResponse = await makeGPTRequest(data);
    return gptResponse;

  } catch (error: unknown) {
    console.error('Error:', error);
    throw error;
  }
});


onMessage('get_safety_score', async (message) => {
  try {
    /*const data = message.data

    if (data.uuid == -1) {
      return Number(-1)
    }*/
    const gptResponse = await GPT_get_safety_score(message.data);
    console.log(gptResponse)
    return gptResponse;


  } catch (error: unknown) {
    console.error('Error:', error);
    throw error;
  }
});