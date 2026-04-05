export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { words } = req.body
  if (!words || !words.length) {
    return res.status(400).json({ error: 'No words provided' })
  }

  try {
    const response = await fetch(
      'https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HF_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ inputs: words })
      }
    )

    const embeddings = await response.json()

    if (embeddings.error) {
      return res.status(500).json({ error: embeddings.error })
    }

    // PCA: reduce to 2D on the server
    const reduced = pca(embeddings)

    // Cosine similarity matrix
    const similarity = cosineSimilarityMatrix(embeddings)

    res.status(200).json({ words, embeddings: reduced, similarity })

  } catch (error) {
    console.error('Embed error:', error)
    res.status(500).json({ error: 'Could not fetch embeddings' })
  }
}

// Simple PCA — project onto first 2 principal components
function pca(embeddings) {
  const n = embeddings.length
  const dim = embeddings[0].length

  // Center the data
  const mean = Array(dim).fill(0)
  embeddings.forEach(e => e.forEach((v, i) => mean[i] += v / n))
  const centered = embeddings.map(e => e.map((v, i) => v - mean[i]))

  // Covariance matrix (dim x dim) — too large, use power iteration instead
  // Project onto 2 random directions then refine (simplified PCA)
  const pc1 = powerIteration(centered, dim, null)
  const pc2 = powerIteration(centered, dim, pc1)

  return centered.map(e => ({
    x: dot(e, pc1),
    y: dot(e, pc2)
  }))
}

function powerIteration(data, dim, orthogonalTo) {
  let v = Array(dim).fill(0).map(() => Math.random() - 0.5)
  v = normalize(v)

  for (let iter = 0; iter < 50; iter++) {
    let newV = Array(dim).fill(0)
    data.forEach(e => {
      const d = dot(e, v)
      e.forEach((val, i) => newV[i] += d * val)
    })
    if (orthogonalTo) {
      const proj = dot(newV, orthogonalTo)
      newV = newV.map((v, i) => v - proj * orthogonalTo[i])
    }
    v = normalize(newV)
  }
  return v
}

function dot(a, b) {
  return a.reduce((sum, v, i) => sum + v * b[i], 0)
}

function normalize(v) {
  const mag = Math.sqrt(v.reduce((s, x) => s + x * x, 0))
  return v.map(x => x / (mag || 1))
}

function cosineSimilarityMatrix(embeddings) {
  return embeddings.map((a, i) =>
    embeddings.map((b, j) => {
      const dotAB = dot(a, b)
      const magA = Math.sqrt(dot(a, a))
      const magB = Math.sqrt(dot(b, b))
      return Math.round((dotAB / (magA * magB)) * 100) / 100
    })
  )
}