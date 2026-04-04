export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { text } = req.body
  if (!text) return res.status(400).json({ error: 'No text provided' })

  try {
    const response = await fetch(
      'https://api-inference.huggingface.co/models/gpt2',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.HF_API_KEY}`
        },
        body: JSON.stringify({
          inputs: text,
          parameters: { return_full_text: false }
        })
      }
    )

    // Use Groq to tokenise instead — simpler and you have the key
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `Tokenise this text exactly as a GPT-style tokeniser would. Return ONLY a JSON array of objects with "text" and "id" fields. The id should be a realistic token ID number. No other text, no markdown.

Text to tokenise: "${text}"

Example format: [{"text": "Hello", "id": 15496}, {"text": " world", "id": 995}]`
        }]
      })
    })

    const groqData = await groqRes.json()
     console.log('Groq status:', response.status)
    console.log('Groq response:', JSON.stringify(data))
    const content = groqData.choices[0].message.content.trim()
    const clean = content.replace(/```json|```/g, '').trim()
    const tokens = JSON.parse(clean)

    res.status(200).json({ tokens })

  } catch (error) {
    console.error('Tokenise error:', error)
    res.status(500).json({ error: 'Could not tokenise text' })
  }
}