export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { text, temperature = 1.0 } = req.body
  if (!text) return res.status(400).json({ error: 'No text provided' })

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 500,
        temperature: 0,
        messages: [{
          role: 'system',
          content: 'You are a language model prediction analyser. Return only valid JSON, no markdown.'
        }, {
          role: 'user',
          content: `Given this text, predict the top 12 most likely next tokens a language model would generate.

Text: "${text}"
Temperature: ${temperature}

Consider how temperature ${temperature} affects the distribution:
- Temperature < 1: distribution is sharper, top tokens get higher probability
- Temperature = 1: natural distribution
- Temperature > 1: distribution is flatter, more tokens get similar probability

Return JSON in exactly this format:
{
  "predictions": [
    {"token": "word", "probability": 0.34},
    {"token": "word2", "probability": 0.18},
    ...
  ],
  "top_token": "most likely next word",
  "entropy": 2.3
}

Probabilities must sum to approximately 1.0. Adjust the spread based on the temperature value.
entropy is the Shannon entropy of the distribution (higher = more uncertain).`
        }]
      })
    })

    const groqData = await groqRes.json()
    const content = groqData.choices[0].message.content.trim()
    const clean = content.replace(/```json|```/g, '').trim()
    const result = JSON.parse(clean)

    res.status(200).json(result)

  } catch (error) {
    console.error('Predict error:', error.message)
    res.status(500).json({ error: error.message })
  }
}