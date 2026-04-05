import { encode, decode } from 'gpt-tokenizer'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { text } = req.body
  if (!text) return res.status(400).json({ error: 'No text provided' })

  try {
    const tokenIds = encode(text)

    const tokens = tokenIds.map((id, index) => {
      const tokenText = decode([id])
      return {
        id,
        text: tokenText,
        index,
        length: tokenText.length,
        startsWithSpace: tokenText.startsWith(' '),
        isNumber: /^\s*\d+\s*$/.test(tokenText),
        isPunctuation: /^\s*[^\w\s]+\s*$/.test(tokenText),
        isWhitespaceOnly: /^\s+$/.test(tokenText)
      }
    })

    const stats = {
      totalTokens: tokens.length,
      totalChars: text.length,
      avgCharsPerToken: (text.length / tokens.length).toFixed(2),
      longestToken: tokens.reduce((a, b) => a.length > b.length ? a : b),
      shortestToken: tokens.reduce((a, b) => a.length < b.length ? a : b),
      numberTokens: tokens.filter(t => t.isNumber).length,
      punctuationTokens: tokens.filter(t => t.isPunctuation).length
    }

    res.status(200).json({ tokens, stats })

  } catch (error) {
    console.error('Tokenise error:', error)
    res.status(500).json({ error: 'Could not tokenise text' })
  }
}