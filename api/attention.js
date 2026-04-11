export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { text } = req.body
  if (!text) return res.status(400).json({ error: 'No text provided' })

  try {
    const response = await fetch(
      'https://api-inference.huggingface.co/models/distilgpt2',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HF_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: text,
          parameters: {
            return_full_text: false,
            max_new_tokens: 1
          },
          options: {
            wait_for_model: true,
            use_cache: false
          }
        })
      }
    )

    const hfData = await response.json()
    console.log('HF raw response:', JSON.stringify(hfData).slice(0, 300))

    // HF text generation doesn't return attention weights directly
    // Use Groq to simulate realistic attention patterns based on linguistic analysis
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 2000,
        temperature: 0,
        messages: [{
          role: 'system',
          content: 'You are a transformer attention analyser. Return only valid JSON, no markdown.'
        }, {
          role: 'user',
          content: `Analyse the linguistic attention patterns for this text as a transformer would.

Text: "${text}"

First tokenise it into words/subwords. Then for each pair of tokens, assign an attention weight between 0 and 1 based on:
- Syntactic dependencies (subject-verb, noun-adjective get high attention)
- Coreference (pronouns attend strongly to their antecedents)
- Semantic proximity (related words attend to each other)
- Position bias (tokens attend more to nearby tokens)

Return JSON in exactly this format:
{
  "tokens": ["word1", "word2", ...],
  "attention": [[0.8, 0.2, ...], [0.3, 0.7, ...], ...],
  "head_description": "This head tracks syntactic subject-verb dependencies"
}

The attention array must be N×N where N = number of tokens. Each row must sum to approximately 1.0.`
        }]
      })
    })

    const groqData = await groqRes.json()
    const content = groqData.choices[0].message.content.trim()
    const clean = content.replace(/```json|```/g, '').trim()
    const result = JSON.parse(clean)

    res.status(200).json(result)

  } catch (error) {
    console.error('Attention error:', error.message)
    res.status(500).json({ error: error.message })
  }
}