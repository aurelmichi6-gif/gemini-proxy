export default async function handler(req, res) {
    const apiKey = process.env.NVIDIA_API_KEY
    const rawQuestion = req.method === "POST" ? req.body?.question : req.query?.question
    const customPrompt = req.method === "POST" ? req.body?.prompt : req.query?.prompt
    const question = rawQuestion ? decodeURIComponent(rawQuestion.replace(/\+/g, " ")) : null

    if (!question) {
        return res.status(400).json({ error: "No question provided" })
    }

    const systemPrompt = customPrompt ? customPrompt : ""

    try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 55000)

        const response = await fetch(
            "https://integrate.api.nvidia.com/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + apiKey,
                    "Accept": "text/event-stream"
                },
                body: JSON.stringify({
                    model: "minimaxai/minimax-m2.7",
                    messages: [
                        ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
                        { role: "user", content: question }
                    ],
                    temperature: 1,
                    top_p: 0.95,
                    max_tokens: 512,
                    stream: true
                }),
                signal: controller.signal
            }
        )

        clearTimeout(timeout)

        if (!response.ok) {
            const errData = await response.json()
            return res.status(response.status).json({ error: "NVIDIA API error", raw: errData })
        }

        // Stream langsung ke client
        res.setHeader("Content-Type", "text/event-stream")
        res.setHeader("Cache-Control", "no-cache")
        res.setHeader("Connection", "keep-alive")

        const reader = response.body.getReader()
        const decoder = new TextDecoder()

        while (true) {
            const { done, value } = await reader.read()
            if (done) break
            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split("\n")
            for (const line of lines) {
                if (!line.startsWith("data: ")) continue
                const data = line.slice(6).trim()
                if (data === "[DONE]") {
                    res.write("data: [DONE]\n\n")
                    res.end()
                    return
                }
                try {
                    const parsed = JSON.parse(data)
                    const content = parsed.choices?.[0]?.delta?.content
                    if (content) {
                        res.write(`data: ${JSON.stringify({ text: content })}\n\n`)
                    }
                } catch {
                    // skip malformed chunk
                }
            }
        }

        res.end()

    } catch (err) {
        if (err.name === "AbortError") {
            return res.status(504).json({ error: "Request timeout, coba lagi" })
        }
        return res.status(500).json({ error: err.message })
    }
}
