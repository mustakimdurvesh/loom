# Loom

**See inside a language model.**

An interactive visualiser that walks through how a large language model 
processes text — step by step, with real data and the actual math.

## Four sections

**01 Tokenisation** — How text becomes numbers using GPT-2's BPE vocabulary.  
**02 Embeddings** — How tokens become meaning vectors. PCA scatter plot with cosine similarity.  
**03 Attention** — Which tokens influence which. Interactive heatmap with linguistic analysis.  
**04 Prediction** — Probability distribution over next tokens. Temperature slider. Sampling demo.

## Stack

- Frontend: HTML, CSS, JavaScript
- Embeddings: Voyage AI (voyage-3-lite)
- Attention + Prediction: Groq (llama-3.3-70b-versatile)
- Math rendering: KaTeX
- Visualisation: D3.js
- Deployment: Vercel

## What this teaches

- What tokenisation actually does and why context limits exist
- What an embedding vector is and why semantic similarity works mathematically
- What the attention formula computes and why transformers outperformed RNNs
- What temperature does to a probability distribution

Built as a learning project — one of three apps in a self-directed software 
development curriculum starting from electrical engineering.